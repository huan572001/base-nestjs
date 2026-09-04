import { Injectable } from '@nestjs/common';
import { In, IsNull, Not } from 'typeorm';
import { TransactionType } from '@libs/infra/postgres/entities/transaction-events.entity';
import { Logger } from '@libs/common/loggers';
import { BadRequestException } from '@libs/common/exception';
import { StrategyRepository, TransactionEventsRepository } from '@libs/infra/postgres/repositories';

@Injectable()
export class TransactionEventsService {
  private readonly logger = new Logger(TransactionEventsService.name);

  constructor(
    private readonly transactionEventRepository: TransactionEventsRepository,
    private readonly strategyRepository: StrategyRepository,
  ) {}
  async getPnlByAddressAndPoolId(
    address: string,
    poolId: string,
  ): Promise<{
    totalWithdraw: number;
    totalDeposit: number;
    totalLP: number;
  }> {
    try {
      if (!address || typeof address !== 'string' || address.trim() === '') {
        throw new BadRequestException({ message: 'Invalid address provided' });
      }
      const transactions = await this.transactionEventRepository.find({
        where: {
          address,
          valueUsd: Not(IsNull()),
          poolId: poolId,
        },
      });

      let totalDeposit = 0;
      let totalWithdraw = 0;
      let totalLP = 0;

      transactions.forEach(transaction => {
        const value = Number(transaction.valueUsd);
        let lp = 0;
        if (transaction.type !== TransactionType.WITHDRAW_REWARDS) {
          lp = Number((transaction.data as any).lpAmount);
        }
        if (!isNaN(value)) {
          if (transaction.type === TransactionType.WITHDRAW || transaction.type === TransactionType.WITHDRAW_REWARDS) {
            totalWithdraw += value;
            totalLP -= lp;
          }

          if (transaction.type === TransactionType.DEPOSIT) {
            totalDeposit += value;
            totalLP += lp;
          }
        }
      });
      return { totalWithdraw: totalWithdraw, totalDeposit: totalDeposit, totalLP: totalLP };
    } catch (error) {
      this.logger.error(`Error calculating PNL for address ${address}`, error);
      throw new BadRequestException({
        message: `Error calculating PNL for address ${address}`,
      });
    }
  }

  async getPnlByAddress(address: string): Promise<
    {
      totalWithdraw: number;
      totalDeposit: number;
      poolId: string;
    }[]
  > {
    try {
      const activePools = await this.strategyRepository.find({
        where: {
          isActive: true,
        },
        select: ['poolId', 'inner'],
      });
      const activePoolIds = activePools.map(pool => pool.poolId);

      if (activePoolIds.length === 0) return [];
      const transactions = await this.transactionEventRepository.find({
        where: {
          address,
          poolId: In(activePoolIds),
          valueUsd: Not(IsNull()),
        },
      });
      const poolPnlMap = new Map<string, { totalDeposit: number; totalWithdraw: number; totalLP: number }>();
      for (const tx of transactions) {
        const value = Number(tx.valueUsd);
        let lp = 0;

        if (tx.type !== TransactionType.WITHDRAW_REWARDS) {
          lp = Number((tx.data as any).lpAmount);
        }
        if (isNaN(value)) continue;

        const poolId = tx.poolId;
        if (!poolPnlMap.has(poolId)) {
          poolPnlMap.set(poolId, { totalDeposit: 0, totalWithdraw: 0, totalLP: 0 });
        }

        const pool = poolPnlMap.get(poolId)!;

        switch (tx.type) {
          case TransactionType.WITHDRAW_REWARDS:
            pool.totalWithdraw += value;
            break;
          case TransactionType.WITHDRAW:
            pool.totalWithdraw += value;
            pool.totalLP -= lp;
            break;
          case TransactionType.WITHDRAW_SINGLE:
            pool.totalWithdraw += value;
            break;
          case TransactionType.DEPOSIT:
            pool.totalDeposit += value;
            pool.totalLP += lp;
            break;
          default:
            break;
        }
      }

      return activePools.map(pool => {
        const pnl = poolPnlMap.get(pool.poolId);
        return {
          poolId: pool.poolId,
          totalDeposit: pnl?.totalDeposit || 0,
          totalWithdraw: pnl?.totalWithdraw || 0,
          totalLP: pnl?.totalLP || 0,
        };
      });
    } catch (error) {
      this.logger.error(`Error calculating PNL for address ${address}`, error);
      throw new BadRequestException({
        message: `Error calculating PNL for address ${address}`,
      });
    }
  }
  async deleteAllTransactionEvents(): Promise<void> {
    const tx = await this.transactionEventRepository.find({
      select: ['id'],
    });
    await this.transactionEventRepository.delete({ id: In(tx.map(t => t.id)) });
  }
}
