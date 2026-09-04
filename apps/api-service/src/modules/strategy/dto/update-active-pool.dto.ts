import { ApiProperty } from '@nestjs/swagger';

export class UpdateActivePoolDto {
  @ApiProperty()
  poolId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  clmmPoolId: string;
}
