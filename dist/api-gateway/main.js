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
const auth_module_1 = __webpack_require__(5);
const proxy_module_1 = __webpack_require__(7);
const tracking_module_1 = __webpack_require__(9);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            auth_module_1.AuthModule, // Módulo que maneja la validación de JWT
            proxy_module_1.ProxyModule, // Módulo que reenvía las peticiones HTTP
            tracking_module_1.TrackingModule, // Módulo que maneja los WebSockets
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
exports.AuthModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const passport_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/passport'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const jwt_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/jwt'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const config_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/config'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const jwt_strategy_1 = __webpack_require__(6);
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET'), // El MISMO secreto que user-auth-service
                    signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
                }),
            }),
        ],
        providers: [jwt_strategy_1.JwtStrategy], // Provee la estrategia para validar tokens
        exports: [passport_1.PassportModule],
    })
], AuthModule);


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtStrategy = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const passport_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/passport'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const passport_jwt_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'passport-jwt'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const config_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/config'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.configService = configService;
    }
    // Esto se ejecuta después de validar el token
    // El 'payload' es el contenido del JWT (id, email, roles)
    // NestJS lo inyectará en 'req.user'
    async validate(payload) {
        return {
            userId: payload.sub,
            email: payload.email,
            roles: payload.roles,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], JwtStrategy);


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProxyModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const config_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/config'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const http_proxy_middleware_1 = __webpack_require__(8);
const passport = tslib_1.__importStar(__webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'passport'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()))); // Necesario para el middleware de Auth
let ProxyModule = class ProxyModule {
    constructor(configService) {
        this.configService = configService;
    }
    configure(consumer) {
        // Lista de microservicios y sus URLs (del .env)
        const services = {
            auth: this.configService.get('USER_AUTH_SERVICE_URL'), // ej. http://localhost:3009
            transport: this.configService.get('TRANSPORT_SERVICE_URL'), // ej. http://localhost:3006
            payments: this.configService.get('PAYMENT_SERVICE_URL'), // ej. http://localhost:3001
            tours: this.configService.get('TOURS_SERVICE_URL'), // ej. http://localhost:3005
            accommodations: this.configService.get('ANFITRIONES_SERVICE_URL'), // ej. http://localhost:3003
            experiences: this.configService.get('EXPERIENCIAS_SERVICE_URL'), // ej. http://localhost:3004
            parcels: this.configService.get('ENVIOS_SERVICE_URL'), // ej. http://localhost:3007
            notifications: this.configService.get('NOTIFICATIONS_SERVICE_URL'), // ej. http://localhost:3008
            tracking: this.configService.get('TRACKING_SERVICE_URL'), // ej. http://localhost:3009
            bookings: this.configService.get('BOOKING_SERVICE_URL'), // ej. http://localhost:3010
        };
        // --- RUTAS PÚBLICAS (ej. login, register) ---
        consumer
            .apply((0, http_proxy_middleware_1.createProxyMiddleware)({
            target: services.auth,
            changeOrigin: true,
            pathRewrite: { '^/api/auth': '/' }, // Quita /api/auth
        }))
            .forRoutes('auth'); // Aplica a /api/auth/*
        // --- RUTAS PROTEGIDAS (Todas las demás) ---
        // Aplica el guardia de JWT primero, y luego el proxy
        const applyAuthProxy = (path, targetService) => {
            consumer
                .apply(passport.authenticate('jwt', { session: false }), // 1. Valida el JWT
            (0, http_proxy_middleware_1.createProxyMiddleware)({
                target: targetService,
                changeOrigin: true,
                pathRewrite: { [`^/api/${path}`]: '/' },
            }))
                .forRoutes(path); // Aplica a /api/{path}/*
        };
        // Aplica el proxy protegido a cada microservicio
        applyAuthProxy('transport', services.transport);
        applyAuthProxy('payments', services.payments);
        applyAuthProxy('tours', services.tours);
        applyAuthProxy('accommodations', services.accommodations);
        applyAuthProxy('experiences', services.experiences);
        applyAuthProxy('parcels', services.parcels);
        applyAuthProxy('notifications', services.notifications);
        applyAuthProxy('tracking', services.tracking);
        applyAuthProxy('bookings', services.bookings);
    }
};
exports.ProxyModule = ProxyModule;
exports.ProxyModule = ProxyModule = tslib_1.__decorate([
    (0, common_1.Module)({}),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], ProxyModule);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("http-proxy-middleware");

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrackingModule = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const axios_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/axios'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const tracking_gateway_1 = __webpack_require__(10);
let TrackingModule = class TrackingModule {
};
exports.TrackingModule = TrackingModule;
exports.TrackingModule = TrackingModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule], // Necesita HttpModule para llamar al tracking-service
        providers: [tracking_gateway_1.TrackingGateway],
    })
], TrackingModule);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var TrackingGateway_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrackingGateway = void 0;
const tslib_1 = __webpack_require__(3);
const websockets_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/websockets'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const axios_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/axios'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const common_1 = __webpack_require__(4);
const config_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@nestjs/config'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const socket_io_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'socket.io'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const rxjs_1 = __webpack_require__(11);
let TrackingGateway = TrackingGateway_1 = class TrackingGateway {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(TrackingGateway_1.name);
        // URL del endpoint HTTP del tracking-service
        this.trackingServiceHttpUrl = `${this.configService.get('TRACKING_SERVICE_URL')}/tracking`;
    }
    handleConnection(client) {
        this.logger.log(`Cliente conectado al Gateway: ${client.id}`);
        // Aquí puedes manejar la autenticación del socket
        // (ej. recibir un token JWT y unirse a una "sala")
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }
    /**
     * Escucha el evento 'updateLocation' enviado por el conductor
     * y lo reenvía al tracking-service vía HTTP POST.
     */
    async handleUpdateLocation(payload) {
        try {
            // Reenvía el payload al endpoint HTTP del microservicio de tracking
            // (que a su vez llama al UpdateLocationUseCase)
            // ESTO ES MÁS ROBUSTO QUE UN WEBSOCKET AL WEBSOCKET
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.trackingServiceHttpUrl}/update-location-internal`, payload));
        }
        catch (error) {
            this.logger.error('Error reenviando ubicación al tracking-service', error.message);
        }
    }
};
exports.TrackingGateway = TrackingGateway;
tslib_1.__decorate([
    (0, websockets_1.WebSocketServer)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _c : Object)
], TrackingGateway.prototype, "server", void 0);
tslib_1.__decorate([
    (0, websockets_1.SubscribeMessage)('updateLocation'),
    tslib_1.__param(0, (0, websockets_1.MessageBody)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], TrackingGateway.prototype, "handleUpdateLocation", null);
exports.TrackingGateway = TrackingGateway = TrackingGateway_1 = tslib_1.__decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], TrackingGateway);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("rxjs");

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
    const port = process.env.PORT || 3000; // Puerto principal del Gateway
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    // Habilitar CORS para que los frontends se conecten
    app.enableCors();
    await app.listen(port);
    common_1.Logger.log(`🚀 API Gateway está corriendo en http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;