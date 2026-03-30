import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IoTService } from './iot.service';

@Controller('iot')
export class IoTController {
  private readonly logger = new Logger(IoTController.name);

  constructor(private readonly iotService: IoTService) {}

  /** GET /iot/devices */
  @Get('devices')
  getDevices(@Query('status') status?: string) {
    return this.iotService.getDevices(status as any);
  }

  /** GET /iot/devices/:deviceId */
  @Get('devices/:deviceId')
  getDevice(@Param('deviceId') deviceId: string) {
    const device = this.iotService.getDevice(deviceId);
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  /** POST /iot/devices */
  @Post('devices')
  registerDevice(@Body() body: { deviceId: string; type: any; name: string; vehicleId?: string; metadata?: any }) {
    if (!body.deviceId || !body.type || !body.name) {
      throw new BadRequestException('deviceId, type, and name are required');
    }
    return this.iotService.registerDevice(body.deviceId, body.type, body.name, body.vehicleId, body.metadata);
  }

  /** PUT /iot/devices/:deviceId/status */
  @Put('devices/:deviceId/status')
  updateDeviceStatus(@Param('deviceId') deviceId: string, @Body() body: { status: string }) {
    return this.iotService.updateDeviceStatus(deviceId, body.status as any);
  }

  /** POST /iot/readings */
  @Post('readings')
  submitReading(@Body() body: any) {
    if (!body.deviceId || body.value === undefined) {
      throw new BadRequestException('deviceId and value are required');
    }
    return this.iotService.processReading({ ...body, timestamp: new Date() });
  }

  /** GET /iot/readings/:deviceId */
  @Get('readings/:deviceId')
  getReadings(@Param('deviceId') deviceId: string, @Query('limit') limit?: string) {
    // getReadings(deviceId, type?, limit) — omit type filter here
    return this.iotService.getReadings(deviceId, undefined, limit ? parseInt(limit) : 100);
  }

  /** GET /iot/alerts */
  @Get('alerts')
  getAlerts(@Query('deviceId') deviceId?: string, @Query('severity') severity?: string) {
    return this.iotService.getAlerts(deviceId, severity as any);
  }

  /** PUT /iot/alerts/:alertId/resolve */
  @Put('alerts/:alertId/resolve')
  resolveAlert(@Param('alertId') alertId: string) {
    return this.iotService.resolveAlert(alertId);
  }

  /** GET /iot/telemetry/live */
  @Get('telemetry/live')
  getLiveTelemetry(@Query('deviceId') deviceId: string) {
    if (!deviceId) throw new BadRequestException('deviceId is required');
    return this.iotService.getLiveTelemetry(deviceId);
  }
}
