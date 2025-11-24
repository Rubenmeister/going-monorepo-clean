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
const transport_controller_1 = __webpack_require__(6);
const domains_transport_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-transport-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRoot(process.env.TRANSPORT_DB_URL), // .env
            infrastructure_module_1.InfrastructureModule,
        ],
        controllers: [
            transport_controller_1.TransportController,
        ],
        providers: [
            domains_transport_application_1.RequestTripUseCase,
            domains_transport_application_1.AcceptTripUseCase,
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
const domains_transport_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-transport-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const mongoose_trip_repository_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module './persistence/mongoose-trip.repository'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const trip_schema_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module './persistence/schemas/trip.schema'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let InfrastructureModule = class InfrastructureModule {
};
exports.InfrastructureModule = InfrastructureModule;
exports.InfrastructureModule = InfrastructureModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: trip_schema_1.TripModelSchema.name, schema: trip_schema_1.TripSchema },
            ]),
        ],
        providers: [
            {
                provide: domains_transport_core_1.ITripRepository,
                useClass: mongoose_trip_repository_1.MongooseTripRepository,
            },
        ],
        exports: [domains_transport_core_1.ITripRepository],
    })
], InfrastructureModule);


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TransportController = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const domains_transport_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-transport-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const shared_domain_1 = __webpack_require__(7);
let TransportController = class TransportController {
    constructor(requestTripUseCase, acceptTripUseCase) {
        this.requestTripUseCase = requestTripUseCase;
        this.acceptTripUseCase = acceptTripUseCase;
    }
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    async requestTrip(dto) {
        return this.requestTripUseCase.execute(dto);
    }
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    async acceptTrip(tripId, driverId) {
        await this.acceptTripUseCase.execute(tripId, driverId);
        return { message: 'Trip accepted' };
    }
};
exports.TransportController = TransportController;
tslib_1.__decorate([
    (0, common_1.Post)('request')
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    ,
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof domains_transport_application_1.RequestTripDto !== "undefined" && domains_transport_application_1.RequestTripDto) === "function" ? _c : Object]),
    tslib_1.__metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], TransportController.prototype, "requestTrip", null);
tslib_1.__decorate([
    (0, common_1.Patch)(':tripId/accept')
    // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
    ,
    tslib_1.__param(0, (0, common_1.Param)('tripId')),
    tslib_1.__param(1, (0, common_1.Body)('driverId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_e = typeof shared_domain_1.UUID !== "undefined" && shared_domain_1.UUID) === "function" ? _e : Object, typeof (_f = typeof shared_domain_1.UUID !== "undefined" && shared_domain_1.UUID) === "function" ? _f : Object]),
    tslib_1.__metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TransportController.prototype, "acceptTrip", null);
exports.TransportController = TransportController = tslib_1.__decorate([
    (0, common_1.Controller)('transport'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof domains_transport_application_1.RequestTripUseCase !== "undefined" && domains_transport_application_1.RequestTripUseCase) === "function" ? _a : Object, typeof (_b = typeof domains_transport_application_1.AcceptTripUseCase !== "undefined" && domains_transport_application_1.AcceptTripUseCase) === "function" ? _b : Object])
], TransportController);


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.err = exports.ok = exports.Result = void 0;
const tslib_1 = __webpack_require__(3);
// Exporta los Value Objects
tslib_1.__exportStar(__webpack_require__(8), exports);
tslib_1.__exportStar(__webpack_require__(10), exports);
tslib_1.__exportStar(__webpack_require__(12), exports);
// Exporta los DTOs compartidos
tslib_1.__exportStar(__webpack_require__(13), exports);
// Re-exporta 'neverthrow' para que todos los dominios
// lo importen desde este único lugar
var neverthrow_1 = __webpack_require__(11);
Object.defineProperty(exports, "Result", ({ enumerable: true, get: function () { return neverthrow_1.Result; } }));
Object.defineProperty(exports, "ok", ({ enumerable: true, get: function () { return neverthrow_1.ok; } }));
Object.defineProperty(exports, "err", ({ enumerable: true, get: function () { return neverthrow_1.err; } }));


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UUID = void 0;
const uuid_1 = __webpack_require__(9);
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
/* 9 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Money = void 0;
const neverthrow_1 = __webpack_require__(11);
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
/* 11 */
/***/ ((module) => {

module.exports = require("neverthrow");

/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Location = void 0;
const neverthrow_1 = __webpack_require__(11);
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
/* 13 */
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
    const port = process.env.PORT || 3006;
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(port);
    common_1.Logger.log(`🚀 Transport-Service está corriendo en http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;