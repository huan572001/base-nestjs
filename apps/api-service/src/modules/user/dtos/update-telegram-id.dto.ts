import { ApiProperty } from '@nestjs/swagger';

export class UpdateTelegramDto {
  @ApiProperty({ description: 'Wallet address của user' })
  walletAddress: string;

  @ApiProperty({ description: 'Telegram ID của user' })
  telegramId: string;
}
