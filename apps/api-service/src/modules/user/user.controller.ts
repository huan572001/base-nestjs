import { Controller, Get, Body, Patch, Query } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { UserService } from 'apps/api-service/src/modules/user/user.service';
import { UpdateTelegramDto } from './dtos/update-telegram-id.dto';
import { AddReferralDto, DeleteUserIdSocialDto } from './dtos/user.dto';

@ApiTags('user')
@Controller({
  path: 'user',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  getMe(@Query('walletAddress') walletAddress: string) {
    return this.userService.getOrCreateByAddress(walletAddress);
  }
  @Get('/checkRefCode')
  getRefCode(@Query('walletAddress') walletAddress: string) {
    return this.userService.checkRefCode(walletAddress);
  }

  @Patch('/telegram')
  @ApiBody({ type: UpdateTelegramDto })
  updateTelegramId(@Body() body: UpdateTelegramDto) {
    return this.userService.updateTelegramId(body.walletAddress, body.telegramId);
  }

  @Patch('/refby')
  @ApiBody({ type: AddReferralDto })
  refBy(@Body() body: AddReferralDto) {
    return this.userService.addReferral(body);
  }

  @Patch('/deleteTelegramId')
  @ApiBody({ type: DeleteUserIdSocialDto })
  deleteTelegramId(@Body() body: DeleteUserIdSocialDto) {
    return this.userService.deleteTelegramId(body.id);
  }
}
