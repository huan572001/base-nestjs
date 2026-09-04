import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Account, AccountAddress, Ed25519PrivateKey, Hex, Serializable, Serializer, U64 } from '@aptos-labs/ts-sdk';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@libs/constants/env.constant';
import { TicketRepository, UserRepository } from '@libs/infra/postgres/repositories';
import { In } from 'typeorm';
import { TicketType } from '@libs/infra/postgres/entities/ticket.entity';
import { TicketSummary } from './dtos/GetTicketSummaryDto';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  private readonly verifierAccount: Account;
  private REQUIRED_REF_COUNT: number;
  constructor(
    public readonly configService: ConfigService,
    private readonly ticketRepository: TicketRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.verifierAccount = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(this.configService.get<string>(EEnvKey.SNAXFI_TICKET_VERIFIER_PK)),
    });
    this.REQUIRED_REF_COUNT = this.configService.get<number>(EEnvKey.REQUIRED_REF_COUNT);
  }

  async getTicket(userAddressHex: string) {
    return await this.ticketRepository.find({
      where: { walletAddress: userAddressHex, isClaim: false },
    });
  }
  async setClaimedTicket(ticketIds: number[], userAddress: string): Promise<void> {
    try {
      const tickets = await this.ticketRepository.find({
        where: { id: In(ticketIds), walletAddress: userAddress, isClaim: false },
      });

      if (tickets.length === 0) {
        throw new NotFoundException(`No tickets found for user: ${userAddress}`);
      }

      await this.ticketRepository.update(
        { id: In(ticketIds), walletAddress: userAddress, isClaim: false },
        { isClaim: true },
      );
    } catch (error) {
      throw new Error(`Failed to set claim ticket: ${error.message}`);
    }
  }

  async signClaimTicket(userAddress: string, ticketIds: number[]): Promise<{ signature: string; publicKey: string }> {
    try {
      const tickets = await this.ticketRepository.find({
        where: { walletAddress: userAddress, isClaim: false, id: In(ticketIds) },
      });
      if (!tickets) {
        throw new NotFoundException(`No tickets found for user: ${userAddress}`);
      }

      const payload = new ClaimTicket({
        user: new AccountAddress(Hex.fromHexString(userAddress).toUint8Array()),
        ticket_ids: ticketIds.map(id => new U64(id)),
      });

      const serializer = new Serializer();
      serializer.serialize(payload);

      const signature = this.verifierAccount.sign(serializer.toUint8Array());
      return {
        signature: new Hex(signature.toUint8Array()).toString(),
        publicKey: new Hex(this.verifierAccount.publicKey.toUint8Array()).toString(),
      };
    } catch (error) {
      this.logger.error(`Failed to sign claim ticket for user: ${userAddress}`, error.stack);
      throw new Error(`Failed to sign claim ticket: ${error.message}`);
    }
  }

  async checkAndCreateTicketReferral(walletAddress: string) {
    try {
      const user = await this.userRepository.findOne({ where: { walletAddress } });
      const countTicket = await this.ticketRepository.count({
        where: { walletAddress, type: TicketType.REF },
      });
      const countReferral = await this.userRepository.count({
        where: { refBy: user.refCode },
        skip: countTicket * this.REQUIRED_REF_COUNT,
      });
      const totalTicketCreate = Math.floor(countReferral / this.REQUIRED_REF_COUNT);
      if (totalTicketCreate > 0) {
        const tickets = await Promise.all(
          Array.from({ length: totalTicketCreate }, () =>
            this.ticketRepository.create({
              walletAddress,
              type: TicketType.REF,
              isClaim: false,
            }),
          ),
        );

        await this.ticketRepository.save(tickets as any);
      }
    } catch (error) {
      this.logger.error('Error in checkCreateTicketReferral:', error);
    }
  }
  async getCountTicketByType(walletAddress: string, type: TicketType): Promise<TicketSummary[]> {
    return await this.ticketRepository.getTicketSummary(walletAddress, type);
  }
}
class ClaimTicket extends Serializable {
  public readonly user: AccountAddress;
  public readonly ticket_ids: U64[];

  constructor(args: { user: AccountAddress; ticket_ids: U64[] }) {
    super();
    this.user = args.user;
    this.ticket_ids = args.ticket_ids;
  }

  serialize(serializer: Serializer) {
    serializer.serialize(this.user);
    serializer.serializeVector(this.ticket_ids);
  }
}
