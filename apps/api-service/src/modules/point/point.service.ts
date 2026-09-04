import { Injectable } from '@nestjs/common';
import { UserRepository } from '@libs/infra/postgres/repositories/user.repository';
import { Logger } from '@libs/common/loggers';
import { getLastAlignedInterval, sumFloorDividedBy } from '@libs/common/utils/function';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@libs/constants/env.constant';
import { DailyTaskProgressService } from '../daily-task-progress/daily-task-progress.service';
import { PointRepository, TicketRepository } from '@libs/infra/postgres/repositories';
import { TicketType } from '@libs/infra/postgres/entities/ticket.entity';

@Injectable()
export class PointService {
  private readonly logger = new Logger(PointService.name);
  private TIME_INTERVAL: number;
  private POINT_DEPOSIT: number;
  private DAY_INTERVAL: number;
  constructor(
    private readonly dailyTaskProgressService: DailyTaskProgressService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly ticketRepository: TicketRepository,
    private readonly pointRepository: PointRepository,
  ) {
    this.TIME_INTERVAL = this.configService.get<number>(EEnvKey.TIME_INTERVAL);
    this.POINT_DEPOSIT = this.configService.get<number>(EEnvKey.POINT_DEPOSIT);
    this.DAY_INTERVAL = this.configService.get<number>(EEnvKey.DAY_INTERVAL);
  }

  async createAllPointsForAllUsersToday(): Promise<void> {
    try {
      const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
      const usersAddress = await this.pointRepository.getDistinctWallets();

      const BATCH_SIZE = 5;

      for (let i = 0; i < usersAddress.length; i += BATCH_SIZE) {
        const batch = usersAddress.slice(i, i + BATCH_SIZE);
        const latestPoints = await Promise.all(
          batch.map(user =>
            this.pointRepository.findOne({
              where: { walletAddress: user },
              order: { day: 'DESC' },
            }),
          ),
        );

        const pointEntities = await Promise.all(
          batch.map(async (address, index) => {
            const latest = latestPoints[index];
            if (latest) {
              if (latest.point <= 0) {
                return undefined;
              }

              return this.pointRepository.create({
                walletAddress: address,
                day: timeAgo,
                point: latest.point,
              });
            }

            const point = await this.dailyTaskProgressService.checkDeposit(address);
            if (point <= 0) {
              return undefined;
            }
            return this.pointRepository.create({
              walletAddress: address,
              day: timeAgo,
              point,
            });
          }),
        );
        const results = pointEntities.filter(Boolean);
        if (results.length === 0) continue;
        await this.pointRepository.upsertAllData(results as any);
      }
    } catch (error) {
      this.logger.error('Error creating points for all users today:', error);
    }
  }

  async updatePointsForUser(walletAddress: string): Promise<void> {
    try {
      const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
      const existingPoint = await this.pointRepository.findOne({
        where: { walletAddress, day: timeAgo },
      });

      if (existingPoint) {
        const point = await this.dailyTaskProgressService.checkDeposit(walletAddress);
        existingPoint.point = point;
        await this.pointRepository.save(existingPoint);
      } else {
        const point = await this.dailyTaskProgressService.checkDeposit(walletAddress);
        const newPoint = await this.pointRepository.create({
          walletAddress,
          day: timeAgo,
          point,
        });
        await this.pointRepository.upsertAllData([newPoint]);
      }
    } catch (error) {
      this.logger.error(`Error updating points for user ${walletAddress}:`, error);
      throw new Error(`Error updating points for user ${walletAddress}: ${error.message}`);
    }
  }

  async createTicketHoldingIn30DaysForAllUsers(): Promise<void> {
    try {
      const users = await this.userRepository.find({
        select: ['walletAddress'],
      });

      const BATCH_SIZE = 50;
      const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(
          batch.map(async user => {
            try {
              const walletAddress = user.walletAddress;
              const countTicket = await this.ticketRepository.count({
                where: {
                  walletAddress,
                  type: TicketType.DEPOSIT,
                },
              });

              const points = await this.getTotalPointsByChunks(walletAddress);

              if (points.length === 0) {
                return [];
              }
              const point = await this.pointRepository.findOne({
                where: { walletAddress },
                order: { day: 'DESC' },
              });
              let isEndOfMonth = 1;
              if (Number(point.day) < timeAgo) {
                isEndOfMonth = 0;
              }

              const pointsDone = points
                .slice(0, points.length - isEndOfMonth)
                .filter(point => point >= this.POINT_DEPOSIT);
              const totalTicket = sumFloorDividedBy(pointsDone, this.POINT_DEPOSIT);
              const totalTicketCreate = totalTicket - countTicket;

              if (totalTicketCreate <= 0) return [];

              const newTickets = Array.from({ length: totalTicketCreate }, () =>
                this.ticketRepository.create({
                  walletAddress,
                  type: TicketType.DEPOSIT,
                  isClaim: false,
                }),
              );

              return newTickets;
            } catch (innerErr) {
              this.logger.warn(`User ${user.walletAddress} skipped due to error:`, innerErr);
              return [];
            }
          }),
        );

        const ticketsToSave = results.filter(Boolean).flat();
        const tickets = await Promise.all(ticketsToSave);

        if (tickets.length > 0) {
          await this.ticketRepository.save(tickets as any);
        }
      }
    } catch (error) {
      this.logger.error('Error creating tickets for all users:', error);
    }
  }

  async getTotalPointsByChunks(walletAddress: string): Promise<number[]> {
    const totals: number[] = [];

    const points = await this.pointRepository.find({
      where: { walletAddress },
      order: { day: 'ASC' },
    });

    if (points.length === 0) return [];

    const dayInterval = Number(this.DAY_INTERVAL);
    const timeInterval = Number(this.TIME_INTERVAL);
    const timeChunkSize = dayInterval * timeInterval;

    const startTime = Number(points[0].day);
    let currentChunkStart = startTime;
    let currentChunkEnd = startTime + timeChunkSize;

    let chunkTotal = 0;
    for (const record of points) {
      const recordTime = Number(record.day);
      if (recordTime >= currentChunkStart && recordTime < currentChunkEnd) {
        chunkTotal += Number(record.point);
      } else {
        totals.push(chunkTotal);
        currentChunkStart = recordTime;
        currentChunkEnd = currentChunkStart + timeChunkSize;
        chunkTotal = Number(record.point);
      }
    }

    totals.push(chunkTotal);

    return totals;
  }
}
