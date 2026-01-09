import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { DeviceTokenService, RegisterDeviceTokenDto } from '../app/services/device-token.service';

class RegisterDeviceTokenRequestDto {
  userId!: string;
  token!: string;
  platform!: 'IOS' | 'ANDROID' | 'WEB';
}

@ApiTags('Device Tokens')
@Controller('device-tokens')
export class DeviceTokenController {
  constructor(private readonly deviceTokenService: DeviceTokenService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a device token for push notifications',
    description: 'Registers a new FCM device token for a user. If the token already exists, it updates the user association.',
  })
  @ApiBody({ type: RegisterDeviceTokenRequestDto })
  @ApiResponse({ status: 201, description: 'Device token registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async register(@Body() dto: RegisterDeviceTokenRequestDto) {
    if (!dto.userId || !dto.token || !dto.platform) {
      throw new BadRequestException('userId, token, and platform are required');
    }

    const validPlatforms = ['IOS', 'ANDROID', 'WEB'];
    if (!validPlatforms.includes(dto.platform)) {
      throw new BadRequestException(`platform must be one of: ${validPlatforms.join(', ')}`);
    }

    const result = await this.deviceTokenService.register({
      userId: dto.userId,
      token: dto.token,
      platform: dto.platform,
    });

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      success: true,
      data: result.value,
    };
  }

  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unregister a device token',
    description: 'Deactivates a device token so it no longer receives push notifications.',
  })
  @ApiParam({ name: 'token', description: 'The FCM device token to unregister' })
  @ApiResponse({ status: 200, description: 'Device token unregistered successfully' })
  async unregister(@Param('token') token: string) {
    const result = await this.deviceTokenService.unregister(token);

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      success: true,
      message: 'Device token unregistered successfully',
    };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get all device tokens for a user',
    description: 'Returns all active device tokens registered for a specific user.',
  })
  @ApiParam({ name: 'userId', description: 'The user ID to get tokens for' })
  @ApiResponse({ status: 200, description: 'List of device tokens' })
  async getTokensForUser(@Param('userId') userId: string) {
    const tokens = await this.deviceTokenService.getTokensForUser(userId);

    return {
      success: true,
      data: tokens,
      count: tokens.length,
    };
  }

  @Delete('user/:userId/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove all device tokens for a user',
    description: 'Deactivates all device tokens for a user (useful for logout from all devices).',
  })
  @ApiParam({ name: 'userId', description: 'The user ID to remove all tokens for' })
  @ApiResponse({ status: 200, description: 'All device tokens removed' })
  async removeAllForUser(@Param('userId') userId: string) {
    const result = await this.deviceTokenService.removeAllForUser(userId);

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      success: true,
      message: `Removed ${result.value} device tokens`,
      count: result.value,
    };
  }
}
