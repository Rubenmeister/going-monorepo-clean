/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// external "tslib"
const external_tslib_namespaceObject = require("tslib");
;// external "@nestjs/core"
const core_namespaceObject = require("@nestjs/core");
;// external "@nestjs/common"
const common_namespaceObject = require("@nestjs/common");
;// external "@nestjs/config"
const config_namespaceObject = require("@nestjs/config");
;// external "@prisma/client"
const client_namespaceObject = require("@prisma/client");
;// ./libs/shared/prisma-client/src/lib/prisma.service.ts
var PrismaService_1;



let PrismaService = PrismaService_1 = class PrismaService extends client_namespaceObject.PrismaClient {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
        this.logger = new common_namespaceObject.Logger(PrismaService_1.name);
    }
    onModuleInit() {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            try {
                yield this.$connect();
                this.logger.log('Connected to PostgreSQL database');
            }
            catch (error) {
                this.logger.error('Failed to connect to PostgreSQL database', error);
                throw error;
            }
        });
    }
    onModuleDestroy() {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            yield this.$disconnect();
            this.logger.log('Disconnected from PostgreSQL database');
        });
    }
    /**
     * Execute operations within a transaction
     * All operations succeed or all fail together
     */
    executeTransaction(fn) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            return this.$transaction(fn);
        });
    }
    /**
     * Clean database for testing purposes
     * WARNING: This deletes all data!
     */
    cleanDatabase() {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            if (process.env.NODE_ENV !== 'test') {
                throw new Error('cleanDatabase can only be used in test environment');
            }
            const tablenames = yield this.$queryRaw `
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
            for (const { tablename } of tablenames) {
                if (tablename !== '_prisma_migrations') {
                    yield this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
                }
            }
        });
    }
};
PrismaService = PrismaService_1 = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Injectable)(),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [])
], PrismaService);


;// ./libs/shared/prisma-client/src/lib/prisma.module.ts



let PrismaModule = class PrismaModule {
};
PrismaModule = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Global)(),
    (0,common_namespaceObject.Module)({
        providers: [PrismaService],
        exports: [PrismaService],
    })
], PrismaModule);


;// ./libs/shared/prisma-client/src/index.ts
// Prisma Client re-exports

// NestJS integration



;// ./libs/domains/transport/core/src/libs/entities/trip.entity.ts
class Trip {
    constructor(props) {
        this.id = props.id;
        this.driverId = props.driverId;
        this.vehicleType = props.vehicleType;
        this.mode = props.mode;
        this.status = props.status;
        this.passengers = props.passengers;
        this.originCity = props.originCity;
        this.originAddress = props.originAddress;
        this.destCity = props.destCity;
        this.destAddress = props.destAddress;
        this.stationOrigin = props.stationOrigin;
        this.stationDest = props.stationDest;
        this.departureTime = props.departureTime;
        this.estimatedArrivalTime = props.estimatedArrivalTime;
        this.basePrice = props.basePrice;
        this.pricePerPassenger = props.pricePerPassenger;
        this.currency = props.currency;
        this.createdAt = props.createdAt;
    }
    static create(props) {
        const estimatedArrivalTime = new Date(props.departureTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
        return new Trip(Object.assign(Object.assign({ id: crypto.randomUUID() }, props), { status: 'SCHEDULED', passengers: [], estimatedArrivalTime, pricePerPassenger: props.basePrice, createdAt: new Date() }));
    }
    static fromPrimitives(props) {
        return new Trip(props);
    }
    toPrimitives() {
        return {
            id: this.id,
            driverId: this.driverId,
            vehicleType: this.vehicleType,
            mode: this.mode,
            status: this.status,
            passengers: this.passengers,
            originCity: this.originCity,
            originAddress: this.originAddress,
            destCity: this.destCity,
            destAddress: this.destAddress,
            stationOrigin: this.stationOrigin,
            stationDest: this.stationDest,
            departureTime: this.departureTime,
            estimatedArrivalTime: this.estimatedArrivalTime,
            basePrice: this.basePrice,
            pricePerPassenger: this.pricePerPassenger,
            currency: this.currency,
            createdAt: this.createdAt,
        };
    }
    getMaxCapacity() {
        return this.vehicleType === 'VAN' ? 7 : 3;
    }
    getAvailableSeats() {
        return this.getMaxCapacity() - this.passengers.length;
    }
    addPassenger(passenger) {
        if (this.getAvailableSeats() <= 0) {
            throw new Error('No seats available.');
        }
        if (this.vehicleType === 'SUV' && passenger.frontSeat && this.passengers.some(p => p.frontSeat)) {
            throw new Error('Only one passenger can have the front seat in SUV.');
        }
        this.passengers.push(Object.assign(Object.assign({}, passenger), { pricePaid: this.pricePerPassenger, currency: this.currency }));
        if (this.passengers.length > 1) {
            this.recalculatePricePerPassenger();
        }
        if (this.getAvailableSeats() === 0) {
            this.status = 'WAITING_PASSENGERS';
        }
    }
    recalculatePricePerPassenger() {
        const shareDiscount = this.passengers.length === 2 ? 0.6 : this.passengers.length === 3 ? 0.45 : 1.0;
        this.pricePerPassenger = this.basePrice * shareDiscount;
        for (const p of this.passengers) {
            p.pricePaid = this.pricePerPassenger;
        }
    }
    assignDriver(driverId) {
        if (this.status !== 'SCHEDULED') {
            throw new Error('Cannot assign driver to a trip that is not scheduled.');
        }
        this.driverId = driverId;
    }
    start() {
        if (this.status !== 'SCHEDULED' && this.status !== 'WAITING_PASSENGERS') {
            throw new Error('Cannot start trip in current state.');
        }
        this.status = 'IN_TRANSIT';
    }
    complete() {
        if (this.status !== 'IN_TRANSIT') {
            throw new Error('Only in-transit trips can be completed.');
        }
        this.status = 'COMPLETED';
    }
    cancel() {
        if (this.status === 'COMPLETED' || this.status === 'CANCELLED') {
            throw new Error('Cannot cancel completed or already cancelled trip.');
        }
        this.status = 'CANCELLED';
    }
}

;// ./libs/domains/transport/core/src/libs/ports/itrip.repository.ts
const ITripRepository = Symbol('ITripRepository');

;// ./libs/domains/transport/core/src/index.ts
// Transport Core Domain



;// ./transport-service/src/infrastructure/persistence/prisma-transport.repository.ts
var _a;




let PrismaTransportRepository = class PrismaTransportRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    save(trip) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            const primitives = trip.toPrimitives();
            yield this.prisma.transport.upsert({
                where: { id: primitives.id },
                create: {
                    id: primitives.id,
                    driverId: primitives.driverId,
                    vehicleType: primitives.vehicleType,
                    mode: primitives.mode,
                    licensePlate: 'PENDING', // Default, can be updated later
                    capacity: trip.getMaxCapacity(),
                    pricePerKm: primitives.basePrice,
                    pricePerPassenger: primitives.pricePerPassenger,
                    currency: primitives.currency,
                    status: primitives.status.toUpperCase(), // Cast to any to avoid Enum mismatch during build
                    originCity: primitives.originCity,
                    originAddress: primitives.originAddress,
                    destCity: primitives.destCity,
                    destAddress: primitives.destAddress,
                    stationOrigin: primitives.stationOrigin,
                    stationDest: primitives.stationDest,
                    departureTime: primitives.departureTime,
                    arrivalTime: primitives.estimatedArrivalTime,
                    passengers: primitives.passengers,
                },
                update: {
                    status: primitives.status.toUpperCase(),
                    pricePerKm: primitives.basePrice,
                    pricePerPassenger: primitives.pricePerPassenger,
                    departureTime: primitives.departureTime,
                    arrivalTime: primitives.estimatedArrivalTime,
                    originCity: primitives.originCity,
                    originAddress: primitives.originAddress,
                    destCity: primitives.destCity,
                    destAddress: primitives.destAddress,
                    stationOrigin: primitives.stationOrigin,
                    stationDest: primitives.stationDest,
                    passengers: primitives.passengers,
                },
            });
        });
    }
    findById(id) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            const record = yield this.prisma.transport.findUnique({
                where: { id: id },
            });
            if (!record)
                return null;
            return this.toDomain(record);
        });
    }
    findAvailableSharedTrips(origin, dest, vehicleType) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            const records = yield this.prisma.transport.findMany({
                where: {
                    status: 'SCHEDULED',
                    vehicleType: vehicleType,
                    originCity: origin.city,
                    destCity: dest.city,
                },
            });
            return records.map(r => this.toDomain(r));
        });
    }
    findTripsByDriverId(driverId) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            const records = yield this.prisma.transport.findMany({
                where: { driverId },
            });
            return records.map(r => this.toDomain(r));
        });
    }
    update(trip) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            yield this.save(trip);
        });
    }
    toDomain(record) {
        // Parse passengers from JSON
        const passengers = Array.isArray(record.passengers)
            ? record.passengers
            : (typeof record.passengers === 'string' ? JSON.parse(record.passengers) : []);
        return Trip.fromPrimitives({
            id: record.id,
            driverId: record.driverId,
            vehicleType: record.vehicleType,
            mode: record.mode,
            status: record.status.toLowerCase(),
            passengers: passengers,
            originCity: record.originCity,
            originAddress: record.originAddress,
            destCity: record.destCity,
            destAddress: record.destAddress,
            stationOrigin: record.stationOrigin,
            stationDest: record.stationDest,
            departureTime: new Date(record.departureTime),
            estimatedArrivalTime: new Date(record.arrivalTime),
            basePrice: Number(record.pricePerKm),
            pricePerPassenger: Number(record.pricePerPassenger),
            currency: record.currency,
            createdAt: record.createdAt,
        });
    }
};
PrismaTransportRepository = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Injectable)(),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], PrismaTransportRepository);


;// ./transport-service/src/infrastructure/infrastructure.module.ts



// Shared Prisma Module

// Domain Ports

// Repository Implementation

let InfrastructureModule = class InfrastructureModule {
};
InfrastructureModule = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Global)(),
    (0,common_namespaceObject.Module)({
        imports: [
            config_namespaceObject.ConfigModule.forRoot({ isGlobal: true }),
            PrismaModule,
        ],
        providers: [
            {
                provide: ITripRepository,
                useClass: PrismaTransportRepository,
            },
            PrismaTransportRepository,
        ],
        exports: [ITripRepository, PrismaTransportRepository],
    })
], InfrastructureModule);


;// external "class-transformer"
const external_class_transformer_namespaceObject = require("class-transformer");
;// external "class-validator"
const external_class_validator_namespaceObject = require("class-validator");
;// ./libs/domains/transport/application/src/lib/dto/request-trip.dto.ts



class PriceDto {
}
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsNumber)(),
    (0,external_class_validator_namespaceObject.Min)(0),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Number)
], PriceDto.prototype, "amount", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsIn)(['USD']),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], PriceDto.prototype, "currency", void 0);
class LocationDto {
}
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], LocationDto.prototype, "city", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], LocationDto.prototype, "address", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsLatitude)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Number)
], LocationDto.prototype, "latitude", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsLongitude)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Number)
], LocationDto.prototype, "longitude", void 0);
class RequestTripDto {
}
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsUUID)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], RequestTripDto.prototype, "userId", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsOptional)(),
    (0,external_class_validator_namespaceObject.IsUUID)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], RequestTripDto.prototype, "driverId", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsOptional)(),
    (0,external_class_validator_namespaceObject.IsIn)(['SUV', 'VAN']),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], RequestTripDto.prototype, "vehicleType", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsOptional)(),
    (0,external_class_validator_namespaceObject.IsIn)(['DOOR_TO_DOOR', 'POINT_TO_POINT']),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], RequestTripDto.prototype, "mode", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsDateString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], RequestTripDto.prototype, "departureTime", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.ValidateNested)(),
    (0,external_class_transformer_namespaceObject.Type)(() => LocationDto),
    (0,external_tslib_namespaceObject.__metadata)("design:type", LocationDto)
], RequestTripDto.prototype, "origin", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.ValidateNested)(),
    (0,external_class_transformer_namespaceObject.Type)(() => LocationDto),
    (0,external_tslib_namespaceObject.__metadata)("design:type", LocationDto)
], RequestTripDto.prototype, "destination", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.ValidateNested)(),
    (0,external_class_transformer_namespaceObject.Type)(() => PriceDto),
    (0,external_tslib_namespaceObject.__metadata)("design:type", PriceDto)
], RequestTripDto.prototype, "price", void 0);

;// ./libs/domains/transport/application/src/lib/use-cases/request-trip.use-case.ts
var request_trip_use_case_a;



let RequestTripUseCase = class RequestTripUseCase {
    constructor(tripRepo) {
        this.tripRepo = tripRepo;
    }
    execute(dto) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            // Assuming DTO has necessary fields, mapping them to entity creation
            // Note: The DTO might need updates to match new Trip entity props
            const trip = Trip.create({
                driverId: dto.driverId || 'PENDING', // Needs logic
                vehicleType: dto.vehicleType || 'SUV',
                mode: dto.mode || 'POINT_TO_POINT',
                originCity: dto.origin.city,
                originAddress: dto.origin.address,
                destCity: dto.destination.city,
                destAddress: dto.destination.address,
                departureTime: new Date(dto.departureTime),
                basePrice: dto.price.amount,
                currency: dto.price.currency,
            });
            yield this.tripRepo.save(trip);
            return { id: trip.id };
        });
    }
};
RequestTripUseCase = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Injectable)(),
    (0,external_tslib_namespaceObject.__param)(0, (0,common_namespaceObject.Inject)(ITripRepository)),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (request_trip_use_case_a = typeof ITripRepository !== "undefined" && ITripRepository) === "function" ? request_trip_use_case_a : Object])
], RequestTripUseCase);


;// ./libs/domains/transport/application/src/lib/use-cases/accept-trip.use-case.ts
var accept_trip_use_case_a;



let AcceptTripUseCase = class AcceptTripUseCase {
    constructor(tripRepo) {
        this.tripRepo = tripRepo;
    }
    execute(tripId, driverId) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            try {
                // UUID is string alias, so use it directly
                const trip = yield this.tripRepo.findById(tripId);
                if (!trip) {
                    throw new common_namespaceObject.NotFoundException(`Trip with id ${tripId} not found`);
                }
                try {
                    trip.assignDriver(driverId);
                }
                catch (error) {
                    throw new common_namespaceObject.PreconditionFailedException(error.message);
                }
                yield this.tripRepo.update(trip);
            }
            catch (error) {
                if (error instanceof common_namespaceObject.NotFoundException || error instanceof common_namespaceObject.PreconditionFailedException) {
                    throw error;
                }
                throw new common_namespaceObject.InternalServerErrorException(error.message);
            }
        });
    }
};
AcceptTripUseCase = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Injectable)(),
    (0,external_tslib_namespaceObject.__param)(0, (0,common_namespaceObject.Inject)(ITripRepository)),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (accept_trip_use_case_a = typeof ITripRepository !== "undefined" && ITripRepository) === "function" ? accept_trip_use_case_a : Object])
], AcceptTripUseCase);


;// ./libs/domains/transport/application/src/lib/transport-application.module.ts




// Import other use cases if needed
let TransportApplicationModule = class TransportApplicationModule {
};
TransportApplicationModule = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Module)({
        providers: [
            AcceptTripUseCase,
            RequestTripUseCase,
        ],
        exports: [
            AcceptTripUseCase,
            RequestTripUseCase,
        ],
    })
], TransportApplicationModule);


;// ./libs/domains/transport/application/src/index.ts





;// ./transport-service/src/api/transport.controller.ts
var transport_controller_a, _b, _c;



let TransportController = class TransportController {
    constructor(requestTripUseCase, acceptTripUseCase) {
        this.requestTripUseCase = requestTripUseCase;
        this.acceptTripUseCase = acceptTripUseCase;
    }
    requestTrip(dto) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            return this.requestTripUseCase.execute(dto);
        });
    }
    acceptTrip(id, driverId) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            // Assuming UUID validation happens in VO or Pipe, but here we cast string to UUID type alias
            // In a real scenario, we might want a DTO for the body or a ParseUUIDPipe
            return this.acceptTripUseCase.execute(id, driverId);
        });
    }
};
(0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Post)('request'),
    (0,external_tslib_namespaceObject.__param)(0, (0,common_namespaceObject.Body)()),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Function),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (_c = typeof RequestTripDto !== "undefined" && RequestTripDto) === "function" ? _c : Object]),
    (0,external_tslib_namespaceObject.__metadata)("design:returntype", Promise)
], TransportController.prototype, "requestTrip", null);
(0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Patch)(':id/accept'),
    (0,external_tslib_namespaceObject.__param)(0, (0,common_namespaceObject.Param)('id')),
    (0,external_tslib_namespaceObject.__param)(1, (0,common_namespaceObject.Body)('driverId')),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Function),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [String, String]),
    (0,external_tslib_namespaceObject.__metadata)("design:returntype", Promise)
], TransportController.prototype, "acceptTrip", null);
TransportController = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Controller)('transport'),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (transport_controller_a = typeof RequestTripUseCase !== "undefined" && RequestTripUseCase) === "function" ? transport_controller_a : Object, typeof (_b = typeof AcceptTripUseCase !== "undefined" && AcceptTripUseCase) === "function" ? _b : Object])
], TransportController);


;// ./transport-service/src/app.module.ts






let AppModule = class AppModule {
};
AppModule = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Module)({
        imports: [
            config_namespaceObject.ConfigModule.forRoot({ isGlobal: true }),
            InfrastructureModule,
            TransportApplicationModule,
        ],
        controllers: [TransportController],
        providers: [],
    })
], AppModule);


;// ./transport-service/src/main.ts




function bootstrap() {
    return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
        const app = yield core_namespaceObject.NestFactory.create(AppModule);
        const port = process.env.PORT || 3006;
        app.enableCors();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new common_namespaceObject.ValidationPipe({ whitelist: true, transform: true }));
        yield app.listen(port);
        common_namespaceObject.Logger.log(`🚀 Transport-Service está corriendo en http://localhost:${port}/api`, 'Bootstrap');
    });
}
bootstrap();

/******/ })()
;
//# sourceMappingURL=main.js.map