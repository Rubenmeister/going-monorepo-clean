import { Controller, Get, Post, Delete, Param, Body, Query, Logger } from '@nestjs/common';
import { SubscriptionService } from '../application/subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('me/:userId')
  getMySubscription(@Param('userId') userId: string) {
    return this.subscriptionService.getSubscription(userId);
  }

  @Post()
  subscribe(@Body() body: { userId: string; planId: string; paymentReference?: string }) {
    return this.subscriptionService.subscribe(body.userId, body.planId, body.paymentReference);
  }

  @Delete('me/:userId')
  cancel(@Param('userId') userId: string) {
    return this.subscriptionService.cancel(userId);
  }

  @Get('admin/all')
  getAllSubscriptions(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.subscriptionService.getAllSubscriptions(
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }
}
