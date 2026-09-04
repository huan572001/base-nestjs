import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyTaskProgressRepository } from '@libs/infra/postgres/repositories/daily-task-progress.repository';
import { DailyTaskProgressEntity, TaskStatus } from '@libs/infra/postgres/entities/daily-task-progress.entity';
import { UserRepository } from '@libs/infra/postgres/repositories/user.repository';
import { StrategyRepository, TicketRepository } from '@libs/infra/postgres/repositories';
import { In, IsNull, Not } from 'typeorm';
import { BigNumber } from 'bignumber.js';
import { convertValueWithDecimals, getLastAlignedInterval, getPreviousTimestamps } from '@libs/common/utils/function';
import { AptosIndexerService } from '@lib/service/aptos-indexer/aptos-indexer.service';
import { Logger } from '@libs/common/loggers';
import { REPEAT_INTERVAL } from '@libs/constants/context.constant';
import { TaskStatusEnum } from './dtos/update-tasks.dto';
import { StrategyService } from '../strategy/strategy.service';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@libs/constants/env.constant';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class DailyTaskProgressService {
  private logger = new Logger(DailyTaskProgressService.name);
  private TIME_INTERVAL: number;
  private APPLICATION_SOCIAL: string;
  private TELEGRAM_CHANNEL_ID: string;
  private TELEGRAM_GROUP_ID: string;
  private AMOUNT_USD_DEPOSIT_MIN: number;
  constructor(
    @InjectRepository(DailyTaskProgressEntity)
    private readonly dailyTaskProgressRepository: DailyTaskProgressRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly userRepository: UserRepository,
    private readonly strategyRepository: StrategyRepository,
    private readonly aptosIndexerService: AptosIndexerService,
    private readonly strategyService: StrategyService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.TIME_INTERVAL = this.configService.get<number>(EEnvKey.TIME_INTERVAL);
    this.APPLICATION_SOCIAL = this.configService.get<string>(EEnvKey.APPLICATION_SOCIAL);
    this.TELEGRAM_CHANNEL_ID = this.configService.get<string>(EEnvKey.TELEGRAM_CHANNEL_ID);
    this.TELEGRAM_GROUP_ID = this.configService.get<string>(EEnvKey.TELEGRAM_GROUP_ID);
    this.AMOUNT_USD_DEPOSIT_MIN = this.configService.get<number>(EEnvKey.AMOUNT_USD_DEPOSIT_MIN);
  }

  async getOrCreateToday(walletAddress: string) {
    const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
    let daily = await this.dailyTaskProgressRepository.findOne({
      where: { walletAddress, day: timeAgo },
    });
    let process = await this.getCountProcess(walletAddress);
    if (daily) {
      return {
        ...daily,
        process: process,
      };
    }
    daily = await this.createDailyTask(walletAddress);
    process = await this.getCountProcess(walletAddress);
    return {
      ...daily,
      process: process,
    };
  }

  async createDailyTask(walletAddress: string): Promise<DailyTaskProgressEntity> {
    try {
      const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
      const previous = await this.dailyTaskProgressRepository.findOne({
        where: { walletAddress },
        order: { day: 'DESC' },
      });

      const tasks: Partial<TaskStatus> = {
        checkIn: false,
        checkOutX: false,
        joinTelegramChannel: false,
        joinTelegramGroup: false,
        shareReferralLink: 0,
        deposit: 0,
      };
      if (previous && previous.tasks) {
        tasks.joinTelegramChannel = previous.tasks.joinTelegramChannel;
        tasks.joinTelegramGroup = previous.tasks.joinTelegramGroup;
        tasks.shareReferralLink = previous.tasks.shareReferralLink;
        tasks.deposit = await this.checkDeposit(walletAddress);
      }

      const daily = await this.dailyTaskProgressRepository.create({
        walletAddress,
        day: timeAgo,
        isDone: false,
        tasks,
      });
      return await this.dailyTaskProgressRepository.save(daily);
    } catch (error) {
      this.logger.error(`Error creating daily task for wallet ${walletAddress}:`, error);
      throw new Error(`Failed to create daily task: ${error.message}`);
    }
  }

  async getCountProcess(walletAddress: string): Promise<number> {
    const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
    const processToday = await this.dailyTaskProgressRepository.findOne({
      where: { walletAddress, day: timeAgo },
    });

    const dates = getPreviousTimestamps(REPEAT_INTERVAL, timeAgo, this.TIME_INTERVAL);

    if (processToday?.ticketId) {
      return REPEAT_INTERVAL;
    }

    const process = await this.dailyTaskProgressRepository.find({
      where: {
        walletAddress,
        ticketId: IsNull(),
        day: In(dates),
      },
      order: { day: 'DESC' },
      take: REPEAT_INTERVAL,
    });
    const processMap = new Map(process.map(item => [String(item.day), item]));

    let count = 0;
    for (const dateStr of dates) {
      const dailyTask = processMap.get(String(dateStr));
      if (!dailyTask || (!dailyTask.isDone && dateStr !== timeAgo)) {
        break;
      }
      if (dailyTask.isDone) {
        count++;
      }
    }
    return count;
  }

  async updateTasks(typeTasks: TaskStatusEnum[], id: number): Promise<DailyTaskProgressEntity> {
    let daily = await this.dailyTaskProgressRepository.findOne({ where: { id } });
    if (!daily) throw new Error('Daily task not found');
    const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
    if (Number(daily.day) !== Number(timeAgo)) {
      daily = await this.createDailyTask(daily.walletAddress);
    }
    const user = await this.userRepository.findOne({ where: { walletAddress: daily.walletAddress } });
    if (!user) throw new Error('User not found');

    if (daily.isDone) {
      return daily;
    }
    const tasks = { ...daily.tasks };
    for (const typeTask of typeTasks) {
      switch (typeTask) {
        case TaskStatusEnum.JOIN_TELEGRAM_CHANNEL:
          if (!tasks.joinTelegramChannel)
            tasks.joinTelegramChannel = await this.checkJoinTelegram(user.walletAddress, this.TELEGRAM_CHANNEL_ID);
          break;
        case TaskStatusEnum.JOIN_TELEGRAM_GROUP:
          if (!tasks.joinTelegramGroup) {
            tasks.joinTelegramGroup = await this.checkJoinTelegram(user.walletAddress, this.TELEGRAM_GROUP_ID);
          }
          break;
        case TaskStatusEnum.SHARE_REFERRAL_LINK:
          tasks.shareReferralLink = await this.userRepository.count({ where: { refBy: user.refCode } });
          break;
        case TaskStatusEnum.DEPOSIT:
          tasks.deposit = await this.checkDeposit(user.walletAddress);
          break;
        case TaskStatusEnum.CHECK_IN:
          tasks.checkIn = true;
          break;
        case TaskStatusEnum.CHECK_OUT_X:
          tasks.checkOutX = true;
          break;
        default:
          throw new Error('Invalid task type');
      }
    }
    daily.tasks = tasks;

    const checks = [tasks.joinTelegramChannel, tasks.joinTelegramGroup, tasks.shareReferralLink > 0];

    const passed = checks.filter(Boolean).length;
    const coreDone = tasks.checkIn && tasks.checkOutX;
    const extraDone = passed >= 2;
    const depositDone = tasks.deposit >= this.AMOUNT_USD_DEPOSIT_MIN;
    if (coreDone && extraDone && depositDone) {
      daily.isDone = true;
    }
    await this.dailyTaskProgressRepository.save(daily);
    if (daily.isDone) {
      await this.createTicket(daily.walletAddress);
    }
    return daily;
  }
  async createTicket(walletAddress: string) {
    try {
      const timeAgo = getLastAlignedInterval(this.TIME_INTERVAL);
      const dates = getPreviousTimestamps(REPEAT_INTERVAL, timeAgo, this.TIME_INTERVAL);

      const dailyTasks = await this.dailyTaskProgressRepository.find({
        where: { walletAddress, isDone: true, ticketId: IsNull(), day: In(dates) },
        order: { day: 'DESC' },
      });

      if (dailyTasks.length < REPEAT_INTERVAL) return;

      const ticket = await this.ticketRepository.create({
        walletAddress,
      });

      await this.ticketRepository.save(ticket);

      const taskIds = dailyTasks.map(t => t.id);

      await this.dailyTaskProgressRepository.update({ id: In(taskIds) }, { ticketId: ticket.id });
      // call SC create
      this.logger.log(`Created ticket ${ticket.id} for wallet ${walletAddress}`);
    } catch (error) {
      this.logger.error(`Error creating ticket for wallet ${walletAddress}:`, error);
    }
  }
  public async checkDeposit(walletAddress: string): Promise<number> {
    try {
      const strategies = await this.strategyRepository.find({ where: { isActive: true, poolId: Not(IsNull()) } });
      if (strategies.length === 0) return 0;

      const balances = await this.aptosIndexerService.getCurrentFungibleAssetBalance(walletAddress);
      if (balances.length === 0) return 0;

      const strategyByInner = new Map(strategies.map(s => [s.inner, s]));
      const matching = balances.filter(b => b.metadata?.asset_type && strategyByInner.has(b.metadata.asset_type));
      if (matching.length === 0) return 0;

      const balanceMap = new Map(matching.map(b => [b.metadata!.asset_type!, b]));
      const detailPromises = matching.map(b => {
        const { poolId } = strategyByInner.get(b.metadata!.asset_type!)!;
        return poolId ? this.strategyService.getStrategyDetails(poolId) : null;
      });
      if (detailPromises.length === 0) return 0;

      const results = await Promise.all(detailPromises);
      const totalUsd = results
        .reduce((sum, det) => {
          if (!det) return sum;
          const bal = balanceMap.get(det.inner);
          if (!bal) return sum;
          const amt = new BigNumber(convertValueWithDecimals(bal.amount ?? '0', bal.metadata?.decimals ?? 8));
          return sum.plus(amt.multipliedBy(det.price));
        }, new BigNumber(0))
        .toNumber();
      return totalUsd;
    } catch (error) {
      this.logger.error(`Error checking deposit for wallet ${walletAddress}:`, error);
      return 0;
    }
  }

  private async checkJoinTelegram(address: string, channelId: string): Promise<boolean> {
    const urlSocial = `${this.configService.get<string>(EEnvKey.SOCIAL_URL)}/api/telegram/verify`;
    const { data: response } = await lastValueFrom(
      this.httpService.post<
        AxiosResponse<{
          isComplete: boolean;
        }>
      >(
        urlSocial,
        {
          channelId: channelId,
          type: 'join',
          address: address,
          application: this.APPLICATION_SOCIAL,
        },
        {
          headers: {
            'x-api-key': this.configService.get<string>(EEnvKey.SOCIAL_API_KEY),
          },
        },
      ),
    );
    return response.data.isComplete;
  }
}
