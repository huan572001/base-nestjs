import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PointService } from './point.service';

@ApiTags('points')
@Controller({
  path: 'points',
})
export class PointController {
  constructor(private readonly pointService: PointService) {}
  @Post('/update-point/:walletAddress')
  async updatePointsForUser(@Param('walletAddress') walletAddress: string) {
    return await this.pointService.updatePointsForUser(walletAddress);
  }
}
