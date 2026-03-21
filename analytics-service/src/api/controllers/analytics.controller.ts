import { Controller, Get, Param, Query, HttpStatus } from '@nestjs/common';
import { MongoRideAnalyticsRepository } from '../../infrastructure/persistence/mongo-ride-analytics.repository';
import { MongoDriverAnalyticsRepository } from '../../infrastructure/persistence/mongo-driver-analytics.repository';

/**
 * Analytics API Controller
 * Handles analytics queries and dashboard data
 */
@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private rideAnalyticsRepository: MongoRideAnalyticsRepository,
    private driverAnalyticsRepository: MongoDriverAnalyticsRepository
  ) {}

  @Get('rides/daily/:date')
  async getDailyRideAnalytics(@Param('date') dateStr: string) {
    const date = new Date(dateStr);
    const analytics = await this.rideAnalyticsRepository.findByDate(date);

    if (!analytics) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No analytics found for this date',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: analytics,
    };
  }

  @Get('rides/range')
  async getRideAnalyticsRange(
    @Query('start') startStr: string,
    @Query('end') endStr: string
  ) {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    const analytics = await this.rideAnalyticsRepository.findByDateRange(
      startDate,
      endDate
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: analytics.length,
        analytics,
        summary: this.calculateSummary(analytics),
      },
    };
  }

  @Get('rides/latest')
  async getLatestRideAnalytics(@Query('days') daysStr = '30') {
    const days = parseInt(daysStr, 10);
    const analytics = await this.rideAnalyticsRepository.findLatest(days);

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: analytics.length,
        analytics,
        summary: this.calculateSummary(analytics),
      },
    };
  }

  @Get('drivers/:driverId/stats')
  async getDriverStats(@Param('driverId') driverId: string) {
    const analytics = await this.driverAnalyticsRepository.findByDriver(
      driverId,
      30
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: analytics.length,
        analytics,
      },
    };
  }

  @Get('drivers/:driverId/:period')
  async getDriverStatsByPeriod(
    @Param('driverId') driverId: string,
    @Param('period') period: string,
    @Query('date') dateStr: string
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const analytics =
      await this.driverAnalyticsRepository.findByDriverAndPeriod(
        driverId,
        period,
        date
      );

    if (!analytics) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `No ${period} analytics found for driver ${driverId}`,
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: analytics,
    };
  }

  @Get('drivers/top/:period')
  async getTopDrivers(
    @Param('period') period: string,
    @Query('metric') metric = 'totalEarnings',
    @Query('limit') limitStr = '10'
  ) {
    const limit = parseInt(limitStr, 10);
    const drivers = await this.driverAnalyticsRepository.findDriversByMetric(
      metric,
      'desc',
      limit
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        period,
        metric,
        count: drivers.length,
        drivers,
      },
    };
  }

  @Get('dashboard/overview')
  async getDashboardOverview(@Query('days') daysStr = '7') {
    const days = parseInt(daysStr, 10);
    const rideAnalytics = await this.rideAnalyticsRepository.findLatest(days);

    // Get top drivers
    const topDrivers = await this.driverAnalyticsRepository.findTopDrivers(
      'daily',
      5
    );

    const summary = this.calculateSummary(rideAnalytics);

    return {
      statusCode: HttpStatus.OK,
      data: {
        period: `Last ${days} days`,
        rideSummary: summary,
        topDrivers,
        rideAnalytics,
      },
    };
  }

  @Get('dashboard/drivers/:driverId')
  async getDriverDashboard(
    @Param('driverId') driverId: string,
    @Query('period') period = 'daily',
    @Query('days') daysStr = '30'
  ) {
    const days = parseInt(daysStr, 10);
    const analytics = await this.driverAnalyticsRepository.findLatestByDriver(
      driverId,
      days
    );

    if (analytics.length === 0) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `No analytics found for driver ${driverId}`,
        data: null,
      };
    }

    const latest = analytics[0];
    const monthlyStats =
      analytics.length > 0
        ? await this.driverAnalyticsRepository.findMonthlyStats(
            driverId,
            latest.date.getFullYear(),
            latest.date.getMonth()
          )
        : [];

    return {
      statusCode: HttpStatus.OK,
      data: {
        driverId,
        period,
        currentStats: latest,
        recentAnalytics: analytics,
        monthlyStats,
      },
    };
  }

  private calculateSummary(analytics: any[]) {
    if (analytics.length === 0) {
      return {
        totalRides: 0,
        totalRevenue: 0,
        platformRevenue: 0,
        driverEarnings: 0,
        averageRideDistance: 0,
        averageRideDuration: 0,
        averageFare: 0,
        completionRate: 0,
      };
    }

    const totals = {
      totalRides: 0,
      completedRides: 0,
      totalRevenue: 0,
      platformRevenue: 0,
      driverEarnings: 0,
      totalDistance: 0,
      totalDuration: 0,
    };

    analytics.forEach((a) => {
      totals.totalRides += a.totalRides;
      totals.completedRides += a.completedRides;
      totals.totalRevenue += a.totalRevenue;
      totals.platformRevenue += a.platformRevenue;
      totals.driverEarnings += a.driverEarnings;
      totals.totalDistance += a.totalDistance;
      totals.totalDuration += a.totalDuration;
    });

    return {
      totalRides: totals.totalRides,
      totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
      platformRevenue: Math.round(totals.platformRevenue * 100) / 100,
      driverEarnings: Math.round(totals.driverEarnings * 100) / 100,
      averageRideDistance:
        Math.round(
          (totals.totalDistance / Math.max(totals.completedRides, 1)) * 100
        ) / 100,
      averageRideDuration:
        Math.round(
          (totals.totalDuration / Math.max(totals.completedRides, 1)) * 100
        ) / 100,
      averageFare:
        Math.round(
          (totals.totalRevenue / Math.max(totals.completedRides, 1)) * 100
        ) / 100,
      completionRate:
        totals.totalRides > 0
          ? Math.round((totals.completedRides / totals.totalRides) * 100)
          : 0,
    };
  }
}
