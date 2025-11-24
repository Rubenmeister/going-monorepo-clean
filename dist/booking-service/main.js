/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const config_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/config'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const mongoose_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/mongoose'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const infrastructure_module_1 = __webpack_require__(5);
// Importa los Controladores
const booking_controller_1 = __webpack_require__(7);
// Importa los Casos de Uso
const domains_booking_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-booking-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRoot(process.env.BOOKING_DB_URL), // .env
            infrastructure_module_1.InfrastructureModule, // Importa el módulo que provee los repositorios
        ],
        controllers: [
            booking_controller_1.BookingController,
        ],
        providers: [
            // Registra los Casos de Uso como 'providers'
            domains_booking_application_1.CreateBookingUseCase,
            domains_booking_application_1.FindBookingsByUserUseCase,
        ],
    })
], AppModule);


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InfrastructureModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const mongoose_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/mongoose'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const domains_booking_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-booking-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const mongoose_booking_repository_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module './persistence/mongoose-booking.repository'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const booking_schema_1 = __webpack_require__(6);
let InfrastructureModule = class InfrastructureModule {
};
exports.InfrastructureModule = InfrastructureModule;
exports.InfrastructureModule = InfrastructureModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: booking_schema_1.BookingModelSchema.name, schema: booking_schema_1.BookingSchema },
            ]),
        ],
        providers: [
            {
                provide: domains_booking_core_1.IBookingRepository, // El Symbol/Token
                useClass: mongoose_booking_repository_1.MongooseBookingRepository, // La implementación concreta
            },
        ],
        exports: [
            domains_booking_core_1.IBookingRepository, // Exportamos el Símbolo
        ],
    })
], InfrastructureModule);


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookingSchema = exports.BookingModelSchema = void 0;
const tslib_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/mongoose'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const domains_booking_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-booking-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())); // Reemplaza con tu scope
// DTO anidado para el 'Money' Value Object
let MoneySchema = class MoneySchema {
};
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    tslib_1.__metadata("design:type", Number)
], MoneySchema.prototype, "amount", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    tslib_1.__metadata("design:type", String)
], MoneySchema.prototype, "currency", void 0);
MoneySchema = tslib_1.__decorate([
    (0, mongoose_1.Schema)({ _id: false })
], MoneySchema);
let BookingModelSchema = class BookingModelSchema {
};
exports.BookingModelSchema = BookingModelSchema;
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    tslib_1.__metadata("design:type", String)
], BookingModelSchema.prototype, "id", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    tslib_1.__metadata("design:type", String)
], BookingModelSchema.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    tslib_1.__metadata("design:type", String)
], BookingModelSchema.prototype, "serviceId", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['transport', 'accommodation', 'tour', 'experience'] }),
    tslib_1.__metadata("design:type", typeof (_a = typeof domains_booking_core_1.ServiceType !== "undefined" && domains_booking_core_1.ServiceType) === "function" ? _a : Object)
], BookingModelSchema.prototype, "serviceType", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, type: MoneySchema }),
    tslib_1.__metadata("design:type", MoneySchema)
], BookingModelSchema.prototype, "totalPrice", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['pending', 'confirmed', 'cancelled', 'completed'] }),
    tslib_1.__metadata("design:type", typeof (_b = typeof domains_booking_core_1.BookingStatus !== "undefined" && domains_booking_core_1.BookingStatus) === "function" ? _b : Object)
], BookingModelSchema.prototype, "status", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], BookingModelSchema.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    tslib_1.__metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], BookingModelSchema.prototype, "startDate", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)(),
    tslib_1.__metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], BookingModelSchema.prototype, "endDate", void 0);
exports.BookingModelSchema = BookingModelSchema = tslib_1.__decorate([
    (0, mongoose_1.Schema)({ timestamps: true, _id: false })
], BookingModelSchema);
exports.BookingSchema = mongoose_1.SchemaFactory.createForClass(BookingModelSchema);
// Índices
exports.BookingSchema.index({ userId: 1, status: 1 });
exports.BookingSchema.index({ serviceId: 1, serviceType: 1 });


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookingController = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const domains_booking_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-booking-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const shared_domain_1 = __webpack_require__(8);
let BookingController = class BookingController {
    constructor(
    // Inyecta los Casos de Uso
    createBookingUseCase, findBookingsByUserUseCase) {
        this.createBookingUseCase = createBookingUseCase;
        this.findBookingsByUserUseCase = findBookingsByUserUseCase;
    }
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    async createBooking(dto) {
        // const userId = req.user.id; // Obtener userId del token
        return this.createBookingUseCase.execute(dto);
    }
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    async getBookingsByUser(userId) {
        return this.findBookingsByUserUseCase.execute(userId);
    }
};
exports.BookingController = BookingController;
tslib_1.__decorate([
    (0, common_1.Post)()
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    ,
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof domains_booking_application_1.CreateBookingDto !== "undefined" && domains_booking_application_1.CreateBookingDto) === "function" ? _c : Object]),
    tslib_1.__metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], BookingController.prototype, "createBooking", null);
tslib_1.__decorate([
    (0, common_1.Get)('user/:userId')
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    ,
    tslib_1.__param(0, (0, common_1.Param)('userId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_e = typeof shared_domain_1.UUID !== "undefined" && shared_domain_1.UUID) === "function" ? _e : Object]),
    tslib_1.__metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], BookingController.prototype, "getBookingsByUser", null);
exports.BookingController = BookingController = tslib_1.__decorate([
    (0, common_1.Controller)('bookings'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof domains_booking_application_1.CreateBookingUseCase !== "undefined" && domains_booking_application_1.CreateBookingUseCase) === "function" ? _a : Object, typeof (_b = typeof domains_booking_application_1.FindBookingsByUserUseCase !== "undefined" && domains_booking_application_1.FindBookingsByUserUseCase) === "function" ? _b : Object])
], BookingController);


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.err = exports.ok = exports.Result = void 0;
const tslib_1 = __webpack_require__(3);
// Exporta los Value Objects
tslib_1.__exportStar(__webpack_require__(9), exports);
tslib_1.__exportStar(__webpack_require__(11), exports);
tslib_1.__exportStar(__webpack_require__(13), exports);
// Exporta los DTOs compartidos
tslib_1.__exportStar(__webpack_require__(14), exports);
// Re-exporta 'neverthrow' para que todos los dominios
// lo importen desde este único lugar
var neverthrow_1 = __webpack_require__(12);
Object.defineProperty(exports, "Result", ({ enumerable: true, get: function () { return neverthrow_1.Result; } }));
Object.defineProperty(exports, "ok", ({ enumerable: true, get: function () { return neverthrow_1.ok; } }));
Object.defineProperty(exports, "err", ({ enumerable: true, get: function () { return neverthrow_1.err; } }));


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UUID = void 0;
const uuid_1 = __webpack_require__(10);
// Un namespace/objeto para las funciones de utilidad
exports.UUID = {
    generate: () => {
        return (0, uuid_1.v4)();
    },
    isValid: (id) => {
        return (0, uuid_1.validate)(id);
    }
};


/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Money = void 0;
const neverthrow_1 = __webpack_require__(12);
class Money {
    constructor(props) {
        this.amount = props.amount;
        this.currency = props.currency;
    }
    static create(amount, currency) {
        const upperCurrency = currency.toUpperCase();
        if (upperCurrency !== 'USD') {
            return (0, neverthrow_1.err)(new Error('Invalid currency'));
        }
        if (amount < 0) {
            return (0, neverthrow_1.err)(new Error('Amount cannot be negative'));
        }
        if (!Number.isInteger(amount)) {
            return (0, neverthrow_1.err)(new Error('Amount must be in cents (an integer)'));
        }
        return (0, neverthrow_1.ok)(new Money({ amount, currency: upperCurrency }));
    }
    isPositive() {
        return this.amount > 0;
    }
    // --- Métodos de Persistencia ---
    toPrimitives() {
        return {
            amount: this.amount,
            currency: this.currency,
        };
    }
    static fromPrimitives(props) {
        return new Money(props);
    }
}
exports.Money = Money;


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("neverthrow");

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Location = void 0;
const neverthrow_1 = __webpack_require__(12);
class Location {
    constructor(props) {
        this.address = props.address;
        this.city = props.city;
        this.country = props.country;
        this.latitude = props.latitude;
        this.longitude = props.longitude;
    }
    static create(props) {
        if (!props.address || props.address.length === 0) {
            return (0, neverthrow_1.err)(new Error('Address is required'));
        }
        if (props.latitude < -90 || props.latitude > 90) {
            return (0, neverthrow_1.err)(new Error('Invalid latitude'));
        }
        if (props.longitude < -180 || props.longitude > 180) {
            return (0, neverthrow_1.err)(new Error('Invalid longitude'));
        }
        return (0, neverthrow_1.ok)(new Location(props));
    }
    // --- Métodos de Persistencia ---
    toPrimitives() {
        return { ...this };
    }
    static fromPrimitives(props) {
        return new Location(props);
    }
}
exports.Location = Location;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocationDto = exports.MoneyDto = void 0;
const tslib_1 = __webpack_require__(3);
const class_validator_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'class-validator'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
// DTO para el Value Object 'Money'
class MoneyDto {
}
exports.MoneyDto = MoneyDto;
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    tslib_1.__metadata("design:type", Number)
], MoneyDto.prototype, "amount", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['USD']),
    tslib_1.__metadata("design:type", String)
], MoneyDto.prototype, "currency", void 0);
// DTO para el Value Object 'Location'
class LocationDto {
}
exports.LocationDto = LocationDto;
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], LocationDto.prototype, "address", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], LocationDto.prototype, "city", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], LocationDto.prototype, "country", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsLatitude)(),
    tslib_1.__metadata("design:type", Number)
], LocationDto.prototype, "latitude", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsLongitude)(),
    tslib_1.__metadata("design:type", Number)
], LocationDto.prototype, "longitude", void 0);


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const app_module_1 = __webpack_require__(2);
const common_1 = __webpack_require__(4);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = process.env.PORT || 3010; // Puerto para este microservicio
    // Habilita la validación global de DTOs
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(port);
    common_1.Logger.log(`🚀 Booking-Service está corriendo en http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;