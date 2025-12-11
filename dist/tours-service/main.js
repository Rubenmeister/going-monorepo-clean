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



;// external "neverthrow"
const external_neverthrow_namespaceObject = require("neverthrow");
;// ./libs/domains/tour/core/src/lib/entities/tour.entity.ts

class Tour {
    constructor(props) {
        this.id = props.id;
        this.hostId = props.hostId;
        this.title = props.title;
        this.description = props.description;
        this.status = props.status;
        this.pricePerPerson = props.pricePerPerson;
        this.currency = props.currency;
        this.maxCapacity = props.maxCapacity;
        this.durationHours = props.durationHours;
        this.location = props.location;
        this.meetingPoint = props.meetingPoint;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    // Factory method para crear nuevo tour
    static create(props) {
        // Validaciones de negocio
        if (!props.hostId || props.hostId.length === 0) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('hostId is required'));
        }
        if (!props.title || props.title.length < 3) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Title must be at least 3 characters'));
        }
        if (!props.description || props.description.length < 10) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Description must be at least 10 characters'));
        }
        if (props.pricePerPerson <= 0) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Price per person must be greater than 0'));
        }
        if (props.maxCapacity <= 0) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Max capacity must be greater than 0'));
        }
        if (props.durationHours <= 0) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Duration must be greater than 0 hours'));
        }
        if (!props.location || props.location.length < 3) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Location must be at least 3 characters'));
        }
        const tour = new Tour(Object.assign(Object.assign({ id: crypto.randomUUID() }, props), { currency: props.currency || 'USD', status: 'draft', createdAt: new Date(), updatedAt: new Date() }));
        return (0,external_neverthrow_namespaceObject.ok)(tour);
    }
    // Lógica de negocio: Publicar tour
    publish() {
        if (this.status !== 'draft') {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Only draft tours can be published'));
        }
        return (0,external_neverthrow_namespaceObject.ok)(new Tour(Object.assign(Object.assign({}, this), { status: 'published', updatedAt: new Date() })));
    }
    // Lógica de negocio: Archivar tour
    archive() {
        if (this.status === 'archived') {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Tour is already archived'));
        }
        return (0,external_neverthrow_namespaceObject.ok)(new Tour(Object.assign(Object.assign({}, this), { status: 'archived', updatedAt: new Date() })));
    }
    // Lógica de negocio: Actualizar información
    updateInfo(props) {
        var _a, _b, _c, _d, _e, _f;
        if (this.status === 'archived') {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Cannot update archived tour'));
        }
        // Validaciones
        if (props.title !== undefined && props.title.length < 3) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Title must be at least 3 characters'));
        }
        if (props.description !== undefined && props.description.length < 10) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Description must be at least 10 characters'));
        }
        if (props.pricePerPerson !== undefined && props.pricePerPerson <= 0) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Price per person must be greater than 0'));
        }
        if (props.maxCapacity !== undefined && props.maxCapacity <= 0) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Max capacity must be greater than 0'));
        }
        if (props.durationHours !== undefined && props.durationHours <= 0) {
            return (0,external_neverthrow_namespaceObject.err)(new Error('Duration must be greater than 0 hours'));
        }
        return (0,external_neverthrow_namespaceObject.ok)(new Tour(Object.assign(Object.assign({}, this), { title: (_a = props.title) !== null && _a !== void 0 ? _a : this.title, description: (_b = props.description) !== null && _b !== void 0 ? _b : this.description, pricePerPerson: (_c = props.pricePerPerson) !== null && _c !== void 0 ? _c : this.pricePerPerson, maxCapacity: (_d = props.maxCapacity) !== null && _d !== void 0 ? _d : this.maxCapacity, durationHours: (_e = props.durationHours) !== null && _e !== void 0 ? _e : this.durationHours, location: (_f = props.location) !== null && _f !== void 0 ? _f : this.location, updatedAt: new Date() })));
    }
    // Serialización para persistencia
    toPrimitives() {
        return {
            id: this.id,
            hostId: this.hostId,
            title: this.title,
            description: this.description,
            status: this.status,
            pricePerPerson: this.pricePerPerson,
            currency: this.currency,
            maxCapacity: this.maxCapacity,
            durationHours: this.durationHours,
            location: this.location,
            meetingPoint: this.meetingPoint,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    // Deserialización desde persistencia
    static fromPrimitives(props) {
        return new Tour(props);
    }
}

;// ./libs/domains/tour/core/src/lib/ports/itour.repository.ts
const I_TOUR_REPOSITORY = Symbol('ITourRepository');
class ITourRepository {
}

;// ./libs/domains/tour/core/src/index.ts



;// ./tours-service/src/infrastructure/persistence/prisma-tour.repository.ts
var _a;





let PrismaTourRepository = class PrismaTourRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    save(tour) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            try {
                const primitives = tour.toPrimitives();
                yield this.prisma.tour.create({
                    data: {
                        id: primitives.id,
                        hostId: primitives.hostId,
                        title: primitives.title,
                        description: primitives.description,
                        pricePerPerson: primitives.pricePerPerson,
                        currency: primitives.currency,
                        maxCapacity: primitives.maxCapacity,
                        durationHours: primitives.durationHours,
                        location: primitives.location,
                        meetingPoint: primitives.location, // Default to location
                        createdAt: primitives.createdAt,
                        updatedAt: primitives.updatedAt,
                    },
                });
                return (0,external_neverthrow_namespaceObject.ok)(undefined);
            }
            catch (error) {
                return (0,external_neverthrow_namespaceObject.err)(new Error(`Failed to save tour: ${error.message}`));
            }
        });
    }
    findById(id) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            try {
                const record = yield this.prisma.tour.findUnique({
                    where: { id },
                });
                if (!record) {
                    return (0,external_neverthrow_namespaceObject.ok)(null);
                }
                return (0,external_neverthrow_namespaceObject.ok)(this.toDomain(record));
            }
            catch (error) {
                return (0,external_neverthrow_namespaceObject.err)(new Error(`Failed to find tour: ${error.message}`));
            }
        });
    }
    findByHostId(hostId) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            try {
                const records = yield this.prisma.tour.findMany({
                    where: { hostId },
                    orderBy: { createdAt: 'desc' },
                });
                return (0,external_neverthrow_namespaceObject.ok)(records.map((r) => this.toDomain(r)));
            }
            catch (error) {
                return (0,external_neverthrow_namespaceObject.err)(new Error(`Failed to find tours by host: ${error.message}`));
            }
        });
    }
    update(tour) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            try {
                const primitives = tour.toPrimitives();
                yield this.prisma.tour.update({
                    where: { id: primitives.id },
                    data: {
                        title: primitives.title,
                        description: primitives.description,
                        pricePerPerson: primitives.pricePerPerson,
                        maxCapacity: primitives.maxCapacity,
                        durationHours: primitives.durationHours,
                        location: primitives.location,
                        updatedAt: new Date(),
                    },
                });
                return (0,external_neverthrow_namespaceObject.ok)(undefined);
            }
            catch (error) {
                return (0,external_neverthrow_namespaceObject.err)(new Error(`Failed to update tour: ${error.message}`));
            }
        });
    }
    findByStatus(status) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            try {
                const records = yield this.prisma.tour.findMany({
                    where: { status: status },
                    orderBy: { createdAt: 'desc' },
                });
                return (0,external_neverthrow_namespaceObject.ok)(records.map((r) => this.toDomain(r)));
            }
            catch (error) {
                return (0,external_neverthrow_namespaceObject.err)(new Error(`Failed to find tours by status: ${error.message}`));
            }
        });
    }
    toDomain(record) {
        return Tour.fromPrimitives({
            id: record.id,
            hostId: record.hostId,
            title: record.title,
            description: record.description,
            status: record.status,
            pricePerPerson: Number(record.pricePerPerson),
            currency: record.currency,
            maxCapacity: record.maxCapacity,
            durationHours: record.durationHours,
            location: record.location,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
};
PrismaTourRepository = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Injectable)(),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], PrismaTourRepository);


;// ./tours-service/src/infrastructure/infrastructure.module.ts



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
                provide: ITourRepository,
                useClass: PrismaTourRepository,
            },
            PrismaTourRepository,
        ],
        exports: [ITourRepository, PrismaTourRepository],
    })
], InfrastructureModule);


;// ./libs/domains/tour/application/src/lib/use-cases/create-tour.use-case.ts
var create_tour_use_case_a;



let CreateTourUseCase = class CreateTourUseCase {
    constructor(tourRepo) {
        this.tourRepo = tourRepo;
    }
    execute(dto) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            const tourResult = Tour.create({
                hostId: dto.hostId,
                title: dto.title,
                description: dto.description,
                pricePerPerson: dto.pricePerPerson,
                currency: dto.currency,
                maxCapacity: dto.maxCapacity,
                durationHours: dto.durationHours,
                location: dto.location,
                meetingPoint: dto.meetingPoint,
            });
            if (tourResult.isErr()) {
                throw tourResult.error;
            }
            const tour = tourResult.value;
            yield this.tourRepo.save(tour);
            return { id: tour.id };
        });
    }
};
CreateTourUseCase = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Injectable)(),
    (0,external_tslib_namespaceObject.__param)(0, (0,common_namespaceObject.Inject)(ITourRepository)),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (create_tour_use_case_a = typeof ITourRepository !== "undefined" && ITourRepository) === "function" ? create_tour_use_case_a : Object])
], CreateTourUseCase);


;// ./libs/domains/tour/application/src/lib/tour-application.module.ts



// Import other use cases if needed
let TourApplicationModule = class TourApplicationModule {
};
TourApplicationModule = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Module)({
        providers: [
            CreateTourUseCase,
        ],
        exports: [
            CreateTourUseCase,
        ],
    })
], TourApplicationModule);


;// external "class-validator"
const external_class_validator_namespaceObject = require("class-validator");
;// ./libs/domains/tour/application/src/lib/dto/create-tour.dto.ts


class CreateTourDto {
}
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], CreateTourDto.prototype, "hostId", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], CreateTourDto.prototype, "title", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], CreateTourDto.prototype, "description", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsNumber)(),
    (0,external_class_validator_namespaceObject.Min)(0),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Number)
], CreateTourDto.prototype, "pricePerPerson", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsIn)(['USD', 'EUR']),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], CreateTourDto.prototype, "currency", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsNumber)(),
    (0,external_class_validator_namespaceObject.Min)(1),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Number)
], CreateTourDto.prototype, "maxCapacity", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsNumber)(),
    (0,external_class_validator_namespaceObject.Min)(1),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Number)
], CreateTourDto.prototype, "durationHours", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], CreateTourDto.prototype, "location", void 0);
(0,external_tslib_namespaceObject.__decorate)([
    (0,external_class_validator_namespaceObject.IsNotEmpty)(),
    (0,external_class_validator_namespaceObject.IsString)(),
    (0,external_tslib_namespaceObject.__metadata)("design:type", String)
], CreateTourDto.prototype, "meetingPoint", void 0);

;// ./libs/domains/tour/application/src/index.ts




;// ./tours-service/src/api/tours.controller.ts
var tours_controller_a, _b;



let ToursController = class ToursController {
    constructor(createTourUseCase) {
        this.createTourUseCase = createTourUseCase;
    }
    createTour(dto) {
        return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
            return this.createTourUseCase.execute(dto);
        });
    }
};
(0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Post)(),
    (0,external_tslib_namespaceObject.__param)(0, (0,common_namespaceObject.Body)()),
    (0,external_tslib_namespaceObject.__metadata)("design:type", Function),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (_b = typeof CreateTourDto !== "undefined" && CreateTourDto) === "function" ? _b : Object]),
    (0,external_tslib_namespaceObject.__metadata)("design:returntype", Promise)
], ToursController.prototype, "createTour", null);
ToursController = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Controller)('tours'),
    (0,external_tslib_namespaceObject.__metadata)("design:paramtypes", [typeof (tours_controller_a = typeof CreateTourUseCase !== "undefined" && CreateTourUseCase) === "function" ? tours_controller_a : Object])
], ToursController);


;// ./tours-service/src/app.module.ts






let AppModule = class AppModule {
};
AppModule = (0,external_tslib_namespaceObject.__decorate)([
    (0,common_namespaceObject.Module)({
        imports: [
            config_namespaceObject.ConfigModule.forRoot({ isGlobal: true }),
            InfrastructureModule,
            TourApplicationModule,
        ],
        controllers: [ToursController],
        providers: [],
    })
], AppModule);


;// ./tours-service/src/main.ts




function bootstrap() {
    return (0,external_tslib_namespaceObject.__awaiter)(this, void 0, void 0, function* () {
        const app = yield core_namespaceObject.NestFactory.create(AppModule);
        const port = process.env.PORT || 3009;
        app.enableCors();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new common_namespaceObject.ValidationPipe({ whitelist: true, transform: true }));
        yield app.listen(port);
        common_namespaceObject.Logger.log(`🚀 Tours-Service está corriendo en http://localhost:${port}/api`, 'Bootstrap');
    });
}
bootstrap();

/******/ })()
;
//# sourceMappingURL=main.js.map