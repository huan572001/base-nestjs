import { ApiProperty } from '@nestjs/swagger';

export class GetPnlByAddressAndPoolIdDto {
  @ApiProperty({ description: 'Wallet address' })
  address: string;

  @ApiProperty({ description: 'Pool ID' })
  poolId: string;
}
export class GetPnlByAddressDto {
  @ApiProperty({ description: 'Wallet address' })
  address: string;
}
