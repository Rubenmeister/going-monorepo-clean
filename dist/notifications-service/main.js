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
const notification_controller_1 = __webpack_require__(13);
const domains_notification_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-notification-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRoot(process.env.NOTIFICATION_DB_URL), // .env
            infrastructure_module_1.InfrastructureModule,
        ],
        controllers: [
            notification_controller_1.NotificationController,
        ],
        providers: [
            domains_notification_application_1.SendNotificationUseCase,
            domains_notification_application_1.GetUserNotificationsUseCase,
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
const domains_notification_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-notification-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const mongoose_notification_repository_1 = __webpack_require__(8);
const notification_schema_1 = __webpack_require__(11);
const log_notification_gateway_1 = __webpack_require__(12);
let InfrastructureModule = class InfrastructureModule {
};
exports.InfrastructureModule = InfrastructureModule;
exports.InfrastructureModule = InfrastructureModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: notification_schema_1.NotificationModelSchema.name, schema: notification_schema_1.NotificationSchema },
            ]),
        ],
        providers: [
            {
                provide: domains_notification_core_1.INotificationRepository,
                useClass: mongoose_notification_repository_1.MongooseNotificationRepository,
            },
            {
                provide: domains_notification_core_1.INotificationGateway,
                useClass: log_notification_gateway_1.LogNotificationGateway,
            },
        ],
        exports: [
            domains_notification_core_1.INotificationRepository,
            domains_notification_core_1.INotificationGateway,
        ],
    })
], InfrastructureModule);


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MongooseNotificationRepository = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const mongoose_1 = __webpack_require__(6);
const mongoose_2 = __webpack_require__(9);
const neverthrow_1 = __webpack_require__(10);
const domains_notification_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-notification-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const notification_schema_1 = __webpack_require__(11);
let MongooseNotificationRepository = class MongooseNotificationRepository {
    constructor(model) {
        this.model = model;
    }
    async save(notification) {
        try {
            const primitives = notification.toPrimitives();
            const newDoc = new this.model(primitives);
            await newDoc.save();
            return (0, neverthrow_1.ok)(undefined);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async update(notification) {
        try {
            const primitives = notification.toPrimitives();
            await this.model.updateOne({ id: notification.id }, { $set: primitives }).exec();
            return (0, neverthrow_1.ok)(undefined);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async findById(id) {
        try {
            const doc = await this.model.findOne({ id }).exec();
            return (0, neverthrow_1.ok)(doc ? this.toDomain(doc) : null);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async findByUserId(userId, limit) {
        try {
            const docs = await this.model
                .find({ userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .exec();
            return (0, neverthrow_1.ok)(docs.map(this.toDomain));
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async findPendingByChannel(channel) {
        try {
            const docs = await this.model.find({ channel: channel.toPrimitives(), status: 'PENDING' }).exec();
            return (0, neverthrow_1.ok)(docs.map(this.toDomain));
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    toDomain(doc) {
        return domains_notification_core_1.Notification.fromPrimitives(doc.toObject());
    }
};
exports.MongooseNotificationRepository = MongooseNotificationRepository;
exports.MongooseNotificationRepository = MongooseNotificationRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, mongoose_1.InjectModel)(notification_schema_1.NotificationModelSchema.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], MongooseNotificationRepository);


/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("neverthrow");

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationSchema = exports.NotificationModelSchema = void 0;
const tslib_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(6);
const domains_notification_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-notification-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let NotificationModelSchema = class NotificationModelSchema {
};
exports.NotificationModelSchema = NotificationModelSchema;
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    tslib_1.__metadata("design:type", String)
], NotificationModelSchema.prototype, "id", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    tslib_1.__metadata("design:type", String)
], NotificationModelSchema.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(domains_notification_core_1.NotificationChannelType) }),
    tslib_1.__metadata("design:type", String)
], NotificationModelSchema.prototype, "channel", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    tslib_1.__metadata("design:type", String)
], NotificationModelSchema.prototype, "title", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    tslib_1.__metadata("design:type", String)
], NotificationModelSchema.prototype, "body", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['PENDING', 'SENT', 'FAILED', 'READ'] }),
    tslib_1.__metadata("design:type", String)
], NotificationModelSchema.prototype, "status", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)(),
    tslib_1.__metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], NotificationModelSchema.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)(),
    tslib_1.__metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], NotificationModelSchema.prototype, "sentAt", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], NotificationModelSchema.prototype, "readAt", void 0);
exports.NotificationModelSchema = NotificationModelSchema = tslib_1.__decorate([
    (0, mongoose_1.Schema)({ timestamps: true, _id: false })
], NotificationModelSchema);
exports.NotificationSchema = mongoose_1.SchemaFactory.createForClass(NotificationModelSchema);


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var LogNotificationGateway_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogNotificationGateway = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const neverthrow_1 = __webpack_require__(10);
/**
 * Adaptador Simulado. Reemplazar por FirebaseGateway, SendGridGateway, etc.
 */
let LogNotificationGateway = LogNotificationGateway_1 = class LogNotificationGateway {
    constructor() {
        this.logger = new common_1.Logger(LogNotificationGateway_1.name);
    }
    async send(notification) {
        const props = notification.toPrimitives();
        this.logger.log(`--- NUEVA NOTIFICACIÓN [${props.channel}] ---
       TO: ${props.userId}
       TITLE: ${props.title}
       BODY: ${props.body}
       --------------------------------------`);
        return (0, neverthrow_1.ok)(undefined);
    }
};
exports.LogNotificationGateway = LogNotificationGateway;
exports.LogNotificationGateway = LogNotificationGateway = LogNotificationGateway_1 = tslib_1.__decorate([
    (0, common_1.Injectable)()
], LogNotificationGateway);


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationController = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const domains_notification_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-notification-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const shared_domain_1 = __webpack_require__(14);
let NotificationController = class NotificationController {
    constructor(sendNotificationUseCase, getUserNotificationsUseCase) {
        this.sendNotificationUseCase = sendNotificationUseCase;
        this.getUserNotificationsUseCase = getUserNotificationsUseCase;
    }
    async sendNotification(dto) {
        const result = await this.sendNotificationUseCase.execute(dto);
        if (result.isErr()) {
            throw new common_1.BadRequestException(result.error.message);
        }
        return result.value;
    }
    async getNotifications(userId) {
        return this.getUserNotificationsUseCase.execute(userId);
    }
};
exports.NotificationController = NotificationController;
tslib_1.__decorate([
    (0, common_1.Post)('send'),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_c = typeof domains_notification_application_1.CreateNotificationDto !== "undefined" && domains_notification_application_1.CreateNotificationDto) === "function" ? _c : Object]),
    tslib_1.__metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], NotificationController.prototype, "sendNotification", null);
tslib_1.__decorate([
    (0, common_1.Get)('user/:userId'),
    tslib_1.__param(0, (0, common_1.Param)('userId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_e = typeof shared_domain_1.UUID !== "undefined" && shared_domain_1.UUID) === "function" ? _e : Object]),
    tslib_1.__metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], NotificationController.prototype, "getNotifications", null);
exports.NotificationController = NotificationController = tslib_1.__decorate([
    (0, common_1.Controller)('notifications'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof domains_notification_application_1.SendNotificationUseCase !== "undefined" && domains_notification_application_1.SendNotificationUseCase) === "function" ? _a : Object, typeof (_b = typeof domains_notification_application_1.GetUserNotificationsUseCase !== "undefined" && domains_notification_application_1.GetUserNotificationsUseCase) === "function" ? _b : Object])
], NotificationController);


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.err = exports.ok = exports.Result = void 0;
const tslib_1 = __webpack_require__(3);
// Exporta los Value Objects
tslib_1.__exportStar(__webpack_require__(15), exports);
tslib_1.__exportStar(__webpack_require__(17), exports);
tslib_1.__exportStar(__webpack_require__(18), exports);
// Exporta los DTOs compartidos
tslib_1.__exportStar(__webpack_require__(19), exports);
// Re-exporta 'neverthrow' para que todos los dominios
// lo importen desde este único lugar
var neverthrow_1 = __webpack_require__(10);
Object.defineProperty(exports, "Result", ({ enumerable: true, get: function () { return neverthrow_1.Result; } }));
Object.defineProperty(exports, "ok", ({ enumerable: true, get: function () { return neverthrow_1.ok; } }));
Object.defineProperty(exports, "err", ({ enumerable: true, get: function () { return neverthrow_1.err; } }));


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UUID = void 0;
const uuid_1 = __webpack_require__(16);
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
/* 16 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Money = void 0;
const neverthrow_1 = __webpack_require__(10);
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
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Location = void 0;
const neverthrow_1 = __webpack_require__(10);
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
/* 19 */
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
    const port = process.env.PORT || 3007;
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(port);
    common_1.Logger.log(`🚀 Notifications-Service está corriendo en http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;