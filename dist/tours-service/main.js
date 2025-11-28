/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const config_1 = __webpack_require__(5);
const mongoose_1 = __webpack_require__(6);
const infrastructure_module_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module './infrastructure/infrastructure.module'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const tour_controller_1 = __webpack_require__(7);
const domains_tour_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-tour-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRoot(process.env.TOURS_DB_URL), // .env
            infrastructure_module_1.InfrastructureModule,
        ],
        controllers: [tour_controller_1.TourController],
        providers: [
            domains_tour_application_1.CreateTourUseCase,
            // (Aquí añadirías más Casos de Uso)
        ],
    })
], AppModule);


/***/ }),
/* 3 */
/***/ ((module) => {

"use strict";
module.exports = require("tslib");

/***/ }),
/* 4 */
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/common");

/***/ }),
/* 5 */
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/config");

/***/ }),
/* 6 */
/***/ ((module) => {

"use strict";
module.exports = require("@nestjs/mongoose");

/***/ }),
/* 7 */
/***/ (() => {



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
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const app_module_1 = __webpack_require__(2);
const common_1 = __webpack_require__(4);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = process.env.PORT || 3005; // Puerto para este microservicio
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(port);
    common_1.Logger.log(`🚀 Tours-Service está corriendo en http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;