import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  ITripRepository,
  IVehicleRepository,
  IRouteRepository,
  IScheduleRepository,
  IShipmentRepository,
  IRideRequestRepository,
  IDriverProfileRepository,
  IMaskedPhoneService,
  IWhatsAppGateway,
} from '@going-monorepo-clean/domains-transport-core';
import { IEventBus } from '@going-monorepo-clean/shared-domain';
import { MongooseTripRepository } from './mongoose-trip.repository';
import { MongooseVehicleRepository } from './mongoose-vehicle.repository';
import { MongooseRouteRepository } from './mongoose-route.repository';
import { MongooseScheduleRepository } from './mongoose-schedule.repository';
import { MongooseShipmentRepository } from './mongoose-shipment.repository';
import { MongooseRideRequestRepository } from './mongoose-ride-request.repository';
import { MongooseDriverProfileRepository } from './mongoose-driver-profile.repository';
import { LogMaskedPhoneService } from './gateways/log-masked-phone.service';
import { LogWhatsAppGateway } from './gateways/log-whatsapp.gateway';
import { NestJsEventBus } from './nestjs-event-bus';
import { TripModelSchema, TripSchema } from './schemas/trip.schema';
import { VehicleModelSchema, VehicleSchema } from './schemas/vehicle.schema';
import { RouteModelSchema, RouteSchema } from './schemas/route.schema';
import { ScheduleModelSchema, ScheduleSchema } from './schemas/schedule.schema';
import { ShipmentModelSchema, ShipmentSchema } from './schemas/shipment.schema';
import { RideRequestModelSchema, RideRequestSchema } from './schemas/ride-request.schema';
import { DriverProfileModelSchema, DriverProfileSchema } from './schemas/driver-profile.schema';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MongooseModule.forFeature([
      { name: TripModelSchema.name, schema: TripSchema },
      { name: VehicleModelSchema.name, schema: VehicleSchema },
      { name: RouteModelSchema.name, schema: RouteSchema },
      { name: ScheduleModelSchema.name, schema: ScheduleSchema },
      { name: ShipmentModelSchema.name, schema: ShipmentSchema },
      { name: RideRequestModelSchema.name, schema: RideRequestSchema },
      { name: DriverProfileModelSchema.name, schema: DriverProfileSchema },
    ]),
  ],
  providers: [
    { provide: ITripRepository, useClass: MongooseTripRepository },
    { provide: IVehicleRepository, useClass: MongooseVehicleRepository },
    { provide: IRouteRepository, useClass: MongooseRouteRepository },
    { provide: IScheduleRepository, useClass: MongooseScheduleRepository },
    { provide: IShipmentRepository, useClass: MongooseShipmentRepository },
    { provide: IRideRequestRepository, useClass: MongooseRideRequestRepository },
    { provide: IDriverProfileRepository, useClass: MongooseDriverProfileRepository },
    { provide: IMaskedPhoneService, useClass: LogMaskedPhoneService },
    { provide: IWhatsAppGateway, useClass: LogWhatsAppGateway },
    { provide: IEventBus, useClass: NestJsEventBus },
  ],
  exports: [
    ITripRepository,
    IVehicleRepository,
    IRouteRepository,
    IScheduleRepository,
    IShipmentRepository,
    IRideRequestRepository,
    IDriverProfileRepository,
    IMaskedPhoneService,
    IWhatsAppGateway,
    IEventBus,
  ],
})
export class InfrastructureModule {}
