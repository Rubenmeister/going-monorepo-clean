import { Controller, Get, Post, Param, Body, Query, Logger } from '@nestjs/common';
import { BlockchainService } from '../application/blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  private readonly logger = new Logger(BlockchainController.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('trips')
  recordTrip(@Body() body: {
    rideId: string; userId: string; driverId: string;
    fromAddress: string; toAddress: string;
    distanceKm?: number; durationSeconds?: number;
    fare?: number; paymentMethod?: string; completedAt?: string;
  }) {
    return this.blockchainService.recordTrip({
      ...body,
      completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
    });
  }

  @Get('trips/:rideId')
  getTrip(@Param('rideId') rideId: string) {
    return this.blockchainService.getTrip(rideId);
  }

  @Get('verify/:hash')
  verify(@Param('hash') hash: string) {
    return this.blockchainService.verify(hash);
  }

  @Get('chain')
  getChainStats() {
    return this.blockchainService.getChainStats();
  }

  @Get('blocks')
  getBlocks(@Query('limit') limit?: string) {
    return this.blockchainService.getRecentBlocks(limit ? parseInt(limit) : 10);
  }

  @Post('mine')
  mine() {
    return this.blockchainService.mineBlock();
  }
}
