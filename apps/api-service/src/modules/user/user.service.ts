import { Logger } from '@libs/common/loggers';
import { UserRepository } from '@libs/infra/postgres/repositories';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserEntity } from '@libs/infra/postgres/entities/user.entity';
import { Ed25519PublicKey, Ed25519Signature } from '@aptos-labs/ts-sdk';
import { AddReferralDto, SignatureDto, SocialResponse } from './dtos/user.dto';
import { AptosService } from '@libs/infra/aptos/aptos.service';
import { EEnvKey } from '@libs/constants/env.constant';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { TicketService } from '../ticket/ticket.service';
@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  private readonly APPLICATION_SOCIAL: string;
  constructor(
    private readonly _aptosService: AptosService,
    private readonly userRepository: UserRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly ticketService: TicketService,
  ) {
    this.APPLICATION_SOCIAL = this.configService.get<string>(EEnvKey.APPLICATION_SOCIAL);
  }

  async getOrCreateByAddress(walletAddress: string): Promise<UserEntity> {
    try {
      let user = await this.userRepository.findOne({ where: { walletAddress } });
      if (user) {
        if (!user?.userIdSocial) {
          user.userIdSocial = await this.createUserSocial(walletAddress);
          await this.userRepository.save(user);
        }
        return user;
      }
      const refCode = await this.generateUniqueRefCode();
      const userIdSocial = await this.createUserSocial(walletAddress);
      user = await this.userRepository.create({ walletAddress, refCode, userIdSocial });
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      this.logger.error('Error in getOrCreateByAddress:', error);
      throw new BadRequestException('Error retrieving or creating user');
    }
  }

  async updateTelegramId(walletAddress: string, telegramId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { walletAddress } });
    if (!user) throw new Error('User not found');
    if (await this.userRepository.findOne({ where: { telegramId } })) {
      throw new Error('Telegram ID already exists');
    }
    const urlSocial = `${this.configService.get<string>(EEnvKey.SOCIAL_URL)}/api/telegram/connect?application=${
      this.APPLICATION_SOCIAL
    }&telegramId=${telegramId}&address=${user.walletAddress}'`;
    const { data: response } = await lastValueFrom(this.httpService.get<SocialResponse<any>>(urlSocial));
    if (response.success === false) {
      throw new BadRequestException('Telegram connection is not complete');
    }
    user.telegramId = telegramId;
    await this.userRepository.save(user);
    return user;
  }

  async addReferral(addReferralDto: AddReferralDto): Promise<UserEntity> {
    try {
      const { refCode, walletAddress } = addReferralDto;
      const referer = await this.userRepository.findOne({ where: { refCode } });
      if (!referer) {
        throw new BadRequestException('Not found referer');
      }
      let user = await this.userRepository.findOne({ where: { walletAddress: walletAddress } });
      if (!user) {
        const refCodeNew = await this.generateUniqueRefCode();
        user = await this.userRepository.create({ walletAddress, refCode: refCodeNew });
        user = await this.userRepository.save(user);
      }
      if (user.refBy) {
        throw new BadRequestException('Already ref by someone');
      }

      if (user.refCode === refCode) {
        throw new BadRequestException('Cannot ref by yourself');
      }
      await this.verifySignature(addReferralDto);
      user.refBy = referer.refCode;
      await this.userRepository.save(user);

      await this.ticketService.checkAndCreateTicketReferral(referer.walletAddress);
      return user;
    } catch (error) {
      this.logger.warn('addReferral', error);
      throw new BadRequestException('Invalid signature or referral code');
    }
  }

  async checkRefCode(refCode: string) {
    const user = await this.userRepository.findOne({
      where: {
        refCode: refCode,
      },
    });
    return {
      isExist: !!user,
    };
  }
  private async generateUniqueRefCode(): Promise<string> {
    const codes = Array.from({ length: 5 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());

    const existing = await this.userRepository.find({
      where: codes.map(code => ({ refCode: code })),
    });

    const existingCodes = new Set(existing.map(u => u.refCode));

    const unique = codes.find(code => !existingCodes.has(code));

    if (unique) return unique;

    return this.generateUniqueRefCode();
  }
  async verifySignature(signatureDto: SignatureDto) {
    try {
      const { walletAddress, publicKey, signature, message } = signatureDto;
      const isAptosKeylessAcc = publicKey.startsWith('0x03') && publicKey.length >= 66;
      let additionalPublicKey;
      let additionalAccountAddress;
      if (isAptosKeylessAcc) {
        additionalPublicKey = await this._aptosService.generateKeylessPubkeyFromPublickey(publicKey);
        additionalAccountAddress = this._aptosService
          .getAccountAddressFromPublicKeyKeyLess(additionalPublicKey)
          .toString();
      } else {
        additionalPublicKey = new Ed25519PublicKey(publicKey);
        additionalAccountAddress = this._aptosService.getAccountAddressFromPublicKey(additionalPublicKey).toString();
      }

      if (additionalAccountAddress !== walletAddress) {
        throw new BadRequestException('Public key and walletAddress mismatch');
      }

      let isVerify = false;

      if (isAptosKeylessAcc === true) {
        const keylessSignature = await this._aptosService.generateKeylessSignFromSignature(signature);
        isVerify = await this._aptosService.verifyKeylessMessage(additionalPublicKey, keylessSignature, message);
      } else {
        const ed25519Signature = new Ed25519Signature(signature);
        isVerify = await this._aptosService.verifyEd25519Message(additionalPublicKey, ed25519Signature, message);
      }

      if (!isVerify) {
        throw new BadRequestException('Invalid signature');
      }
    } catch (e) {
      this.logger.warn('verifySignature', e);
      throw new BadRequestException('Invalid signature');
    }
  }

  async createUserSocial(walletAddress: string): Promise<string> {
    try {
      const urlSocial = `${this.configService.get<string>(EEnvKey.SOCIAL_URL)}/api/user/create`;
      const { data: response } = await lastValueFrom(
        this.httpService.post<
          AxiosResponse<{
            id: string;
          }>
        >(
          urlSocial,
          {
            address: walletAddress,
            application: this.APPLICATION_SOCIAL,
          },
          {
            headers: {
              'x-api-key': this.configService.get<string>(EEnvKey.SOCIAL_API_KEY),
            },
          },
        ),
      );
      return response.data.id;
    } catch (error) {
      this.logger.warn('createUserSocial', error);
    }
  }

  async deleteTelegramId(userIdSocial: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { userIdSocial: userIdSocial } });
    if (!user) throw new BadRequestException('User not found');
    user.userIdSocial = null;
    await this.userRepository.save(user);
  }
}
