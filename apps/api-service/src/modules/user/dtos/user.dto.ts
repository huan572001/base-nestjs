import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SignatureDto {
  @ApiProperty()
  @MinLength(1)
  @MaxLength(3000)
  @IsString()
  public message: string;

  @ApiProperty()
  @MinLength(1)
  @MaxLength(3000)
  @IsString()
  publicKey: string;

  @ApiProperty()
  @MinLength(1)
  @MaxLength(3000)
  @IsString()
  signature: string;

  @ApiProperty()
  @MinLength(1)
  @MaxLength(3000)
  @IsString()
  walletAddress: string;
}
export class AddReferralDto extends SignatureDto {
  @ApiProperty()
  @MinLength(1)
  @MaxLength(10)
  @IsString()
  refCode: string;
}

export interface SocialResponse<T = any> {
  data: T;
  statusCode: number;
  message: string;
  success: boolean;
  errorCode: string;
  requestId?: string;
}

export class DeleteUserIdSocialDto {
  @ApiProperty()
  @MinLength(1)
  @MaxLength(10)
  @IsString()
  id: string;
}
