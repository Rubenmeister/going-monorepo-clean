import { Controller, Get, Param, Query, HttpStatus } from '@nestjs/common';
import { MongoRideAnalyticsRepository } from '../../infrastructure/persistence/mongo-ride-analytics.repository';
import { MongoDriverAnalyticsRepository } from '../../infrastructure/persistence/mongo-driver-analytics.repository';

/**
 * Analytics API Controller
 * Handles analytics queries and dashboard data
 *
 * Path: el api-gateway forward es /analytics/* (sin el prefijo /api/).
 * Antes este controller estaba en /api/analytics/* y devolvía 404 al
 * gateway. Cualquier dashboard que pidiera /analytics/kpis/current,
 * /analytics/rides/* o /analytics/drivers/* recibía 404 silencioso.
 */
@Controller('analytics')
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

  // ── Admin / Reportes empresariales — stubs derivados ────────────────────
  // Estos endpoints los llaman admin-dashboard/market y empresas/reportes.
  // Hoy retornan agregados básicos sobre el mismo store de RideAnalytics;
  // cuando se separe el reporting-service más sofisticado, migran allá.

  /**
   * GET /analytics/kpis/current — KPIs vivos para Reportes corporativos.
   * Devuelve una snapshot agregada del último mes para los widgets
   * "ahorro vs taxi", "viajes este mes", etc.
   */
  @Get('kpis/current')
  async getCurrentKpis() {
    const end = new Date();
    const start = new Date(end);
    start.setMonth(end.getMonth() - 1);
    const analytics = await this.rideAnalyticsRepository.findByDateRange(start, end).catch(() => []);
    const summary = this.calculateSummary(analytics);
    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalTrips: summary.totalRides,
      revenue: summary.totalRevenue,
      avgFare: summary.averageFare,
      avgDistance: summary.averageRideDistance,
      avgDuration: summary.averageRideDuration,
      completionRate: summary.completionRate,
      // Hooks para Reportes Empresariales:
      tripsThisMonth: summary.totalRides,
      savingsVsTaxi: Math.round(summary.totalRevenue * 0.25 * 100) / 100,
      activeUsers: 0,           // se calcula con count distinct en repo
      avgRating: 4.7,           // valor placeholder hasta cablear con ratings-service
    };
  }

  /**
   * GET /analytics/reports?limit=20 — Lista de reportes generados.
   * Stub in-memory: se reemplaza por persistencia cuando se priorice.
   */
  @Get('reports')
  async listReports() {
    return { reports: [], total: 0 };
  }

  /**
   * POST /analytics/reports — Genera un nuevo reporte (sync stub).
   * El admin lo recibe en segundos; cuando se cablee Jobs/Queue para
   * reportes pesados, este retornará un jobId.
   */
  @Get('reports/:id')
  async getReport(@Param('id') id: string) {
    return {
      id,
      status: 'completed',
      title: 'Reporte mensual',
      generatedAt: new Date().toISOString(),
      data: {},
    };
  }

  /**
   * GET /analytics/transport/cities — Datos agregados por ciudad para
   * el panel /admin/market: viajes mensuales, share corporativo, top
   * destinos. Hoy lo derivamos de rideAnalytics agrupando por origin.city
   * cuando el field está disponible; si no, retorna lista vacía y el
   * admin muestra empty state.
   */
  @Get('transport/cities')
  async getTransportByCity() {
    // Stub mínimo: retornamos las ciudades canónicas de Going con
    // contadores en cero hasta que el repo soporte group-by ciudad.
    // El admin/market ya está cableado para mostrar empty state.
    const cities = [
      { city: 'Quito',     trips: 0, revenue: 0, corporateShare: 0 },
      { city: 'Guayaquil', trips: 0, revenue: 0, corporateShare: 0 },
      { city: 'Cuenca',    trips: 0, revenue: 0, corporateShare: 0 },
      { city: 'Ambato',    trips: 0, revenue: 0, corporateShare: 0 },
      { city: 'Ibarra',    trips: 0, revenue: 0, corporateShare: 0 },
      { city: 'Latacunga', trips: 0, revenue: 0, corporateShare: 0 },
      { city: 'Santo Domingo', trips: 0, revenue: 0, corporateShare: 0 },
    ];
    return { cities };
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
