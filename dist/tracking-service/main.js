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
const config_1 = __webpack_require__(5);
const infrastructure_module_1 = __webpack_require__(6);
const tracking_controller_1 = __webpack_require__(10);
const tracking_gateway_1 = __webpack_require__(11);
const domains_tracking_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-tracking-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            infrastructure_module_1.InfrastructureModule,
        ],
        controllers: [
            tracking_controller_1.TrackingController,
        ],
        providers: [
            tracking_gateway_1.TrackingGateway,
            domains_tracking_application_1.UpdateLocationUseCase,
            domains_tracking_application_1.GetActiveDriversUseCase,
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
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InfrastructureModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const cache_manager_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/cache-manager'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const cache_manager_redis_yet_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'cache-manager-redis-yet'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const config_1 = __webpack_require__(5);
const domains_tracking_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-tracking-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const redis_tracking_repository_1 = __webpack_require__(7);
const socket_io_tracking_gateway_1 = __webpack_require__(9);
let InfrastructureModule = class InfrastructureModule {
};
exports.InfrastructureModule = InfrastructureModule;
exports.InfrastructureModule = InfrastructureModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    store: await (0, cache_manager_redis_yet_1.redisStore)({
                        url: configService.get('REDIS_URL'), // .env
                    }),
                }),
                isGlobal: true,
            }),
        ],
        providers: [
            {
                provide: domains_tracking_core_1.ITrackingRepository,
                useClass: redis_tracking_repository_1.RedisTrackingRepository,
            },
            {
                provide: domains_tracking_core_1.ITrackingGateway,
                useClass: socket_io_tracking_gateway_1.SocketIoTrackingGateway,
            },
            socket_io_tracking_gateway_1.SocketIoTrackingGateway,
        ],
        exports: [
            domains_tracking_core_1.ITrackingRepository,
            domains_tracking_core_1.ITrackingGateway,
        ],
    })
], InfrastructureModule);


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisTrackingRepository = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const cache_manager_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/cache-manager'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const cache_manager_2 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'cache-manager'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const neverthrow_1 = __webpack_require__(8);
const domains_tracking_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-tracking-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const DRIVER_KEY_PREFIX = 'driver:location:';
const ACTIVE_DRIVERS_SET = 'drivers:active';
const KEY_TTL_SECONDS = 60 * 1000; // 60 segundos en milisegundos
let RedisTrackingRepository = class RedisTrackingRepository {
    constructor(cache) {
        this.cache = cache;
    }
    async save(location) {
        try {
            const key = `${DRIVER_KEY_PREFIX}${location.driverId}`;
            const primitives = location.toPrimitives();
            await this.cache.set(key, primitives, KEY_TTL_SECONDS);
            const redisClient = this.cache.store.getClient();
            await redisClient.sAdd(ACTIVE_DRIVERS_SET, location.driverId);
            return (0, neverthrow_1.ok)(undefined);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async findByDriverId(driverId) {
        try {
            const key = `${DRIVER_KEY_PREFIX}${driverId}`;
            const primitives = await this.cache.get(key);
            return (0, neverthrow_1.ok)(primitives ? domains_tracking_core_1.DriverLocation.fromPrimitives(primitives) : null);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async findAllActive() {
        try {
            const redisClient = this.cache.store.getClient();
            const driverIds = await redisClient.sMembers(ACTIVE_DRIVERS_SET);
            if (!driverIds || driverIds.length === 0) {
                return (0, neverthrow_1.ok)([]);
            }
            const keys = driverIds.map(id => `${DRIVER_KEY_PREFIX}${id}`);
            const results = await this.cache.store.mGet(keys);
            const locations = results
                .filter(res => !!res)
                .map(loc => domains_tracking_core_1.DriverLocation.fromPrimitives(JSON.parse(loc)));
            return (0, neverthrow_1.ok)(locations);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
};
exports.RedisTrackingRepository = RedisTrackingRepository;
exports.RedisTrackingRepository = RedisTrackingRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof cache_manager_2.Cache !== "undefined" && cache_manager_2.Cache) === "function" ? _a : Object])
], RedisTrackingRepository);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("neverthrow");

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SocketIoLocationGateway = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const tracking_gateway_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '../api/tracking.gateway'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let SocketIoLocationGateway = class SocketIoLocationGateway {
    constructor(trackingGateway) {
        this.trackingGateway = trackingGateway;
    }
    async broadcastLocation(location) {
        // Llama al método del gateway para emitir la actualización
        this.trackingGateway.emitLocationUpdate(location);
    }
};
exports.SocketIoLocationGateway = SocketIoLocationGateway;
exports.SocketIoLocationGateway = SocketIoLocationGateway = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof tracking_gateway_1.TrackingGateway !== "undefined" && tracking_gateway_1.TrackingGateway) === "function" ? _a : Object])
], SocketIoLocationGateway);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrackingController = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const domains_tracking_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-tracking-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let TrackingController = class TrackingController {
    constructor(getActiveDriversUseCase) {
        this.getActiveDriversUseCase = getActiveDriversUseCase;
    }
    async getActiveDrivers() {
        return this.getActiveDriversUseCase.execute();
    }
};
exports.TrackingController = TrackingController;
tslib_1.__decorate([
    (0, common_1.Get)('active-drivers'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)
], TrackingController.prototype, "getActiveDrivers", null);
exports.TrackingController = TrackingController = tslib_1.__decorate([
    (0, common_1.Controller)('tracking'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof domains_tracking_application_1.GetActiveDriversUseCase !== "undefined" && domains_tracking_application_1.GetActiveDriversUseCase) === "function" ? _a : Object])
], TrackingController);


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var TrackingGateway_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrackingGateway = void 0;
const tslib_1 = __webpack_require__(3);
const websockets_1 = __webpack_require__(12);
const common_1 = __webpack_require__(4);
const domains_tracking_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-tracking-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let TrackingGateway = TrackingGateway_1 = class TrackingGateway {
    constructor(updateLocationUseCase) {
        this.updateLocationUseCase = updateLocationUseCase;
        this.logger = new common_1.Logger(TrackingGateway_1.name);
        this.validationPipe = new common_1.ValidationPipe({ whitelist: true });
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleUpdateLocation(payload) {
        try {
            const dto = new domains_tracking_application_1.UpdateLocationDto();
            dto.driverId = payload.driverId;
            dto.latitude = payload.latitude;
            dto.longitude = payload.longitude;
            await this.validationPipe.transform(dto, { type: 'body' });
            await this.updateLocationUseCase.execute(dto);
        }
        catch (error) {
            this.logger.warn(`Invalid location data from socket: ${error.message}`);
        }
    }
};
exports.TrackingGateway = TrackingGateway;
tslib_1.__decorate([
    (0, websockets_1.SubscribeMessage)('updateLocation'),
    tslib_1.__param(0, (0, websockets_1.MessageBody)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)
], TrackingGateway.prototype, "handleUpdateLocation", null);
exports.TrackingGateway = TrackingGateway = TrackingGateway_1 = tslib_1.__decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof domains_tracking_application_1.UpdateLocationUseCase !== "undefined" && domains_tracking_application_1.UpdateLocationUseCase) === "function" ? _a : Object])
], TrackingGateway);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

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
    const port = process.env.PORT || 3008;
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(port);
    common_1.Logger.log(`🚀 Tracking-Service (HTTP y WebSocket) está corriendo en http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;