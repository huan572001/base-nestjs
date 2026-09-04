import { ApiProperty } from '@nestjs/swagger';
export enum TaskStatusEnum {
  JOIN_TELEGRAM_CHANNEL = 'joinTelegramChannel',
  JOIN_TELEGRAM_GROUP = 'joinTelegramGroup',
  SHARE_REFERRAL_LINK = 'shareReferralLink',
  DEPOSIT = 'deposit',
  CHECK_IN = 'checkIn',
  CHECK_OUT_X = 'checkOutX',
}
export class UpdateTasksDto {
  @ApiProperty({ description: 'ID', type: Number })
  id: number;

  @ApiProperty({ description: 'Type tasks', enum: TaskStatusEnum, isArray: true })
  typeTask: TaskStatusEnum[];
}
