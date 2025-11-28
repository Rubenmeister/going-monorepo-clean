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
const mongoose_1 = __webpack_require__(6);
const infrastructure_module_1 = __webpack_require__(7);
const transport_controller_1 = __webpack_require__(8);
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
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/mongoose");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InfrastructureModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const mongoose_1 = __webpack_require__(6);
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
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TransportController = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
let TransportController = class TransportController {
    // ... otros métodos
    async obtenerHorarios(query) {
        // Lógica para calcular horarios fijos o dinámicos basados en la ruta
        // Por ejemplo, VAN de Quito a Ambato sale cada 5 horas
        const frecuenciaMinutos = query.tipoVehiculo === 'VAN' ? 300 : 60; // 5h o 1h
        const ahora = new Date();
        const horarios = [];
        for (let i = 0; i < 5; i++) { // Próximas 5 salidas
            const proxima = new Date(ahora.getTime() + (frecuenciaMinutos * i * 60000));
            horarios.push(proxima);
        }
        return { horarios };
    }
};
exports.TransportController = TransportController;
tslib_1.__decorate([
    (0, common_1.Get)('schedules'),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)
], TransportController.prototype, "obtenerHorarios", null);
exports.TransportController = TransportController = tslib_1.__decorate([
    (0, common_1.Controller)('transport')
], TransportController);


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