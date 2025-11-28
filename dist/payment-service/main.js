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
const payment_controller_1 = __webpack_require__(14);
const webhook_controller_1 = __webpack_require__(15);
const domains_payment_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-payment-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRoot(process.env.PAYMENT_DB_URL), // .env
            infrastructure_module_1.InfrastructureModule,
        ],
        controllers: [
            payment_controller_1.PaymentController,
            webhook_controller_1.WebhookController,
        ],
        providers: [
            domains_payment_application_1.CreatePaymentIntentUseCase,
            domains_payment_application_1.HandleStripeEventUseCase,
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
const config_1 = __webpack_require__(5);
const mongoose_1 = __webpack_require__(6);
const domains_payment_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-payment-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const mongoose_transaction_repository_1 = __webpack_require__(8);
const transaction_schema_1 = __webpack_require__(11);
const stripe_gateway_1 = __webpack_require__(12);
let InfrastructureModule = class InfrastructureModule {
};
exports.InfrastructureModule = InfrastructureModule;
exports.InfrastructureModule = InfrastructureModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forFeature([
                { name: transaction_schema_1.TransactionModelSchema.name, schema: transaction_schema_1.TransactionSchema },
            ]),
        ],
        providers: [
            {
                provide: domains_payment_core_1.ITransactionRepository,
                useClass: mongoose_transaction_repository_1.MongooseTransactionRepository,
            },
            {
                provide: domains_payment_core_1.IPaymentGateway,
                useClass: stripe_gateway_1.StripeGateway,
            },
        ],
        exports: [
            domains_payment_core_1.ITransactionRepository,
            domains_payment_core_1.IPaymentGateway,
        ],
    })
], InfrastructureModule);


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MongooseTransactionRepository = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const mongoose_1 = __webpack_require__(6);
const mongoose_2 = __webpack_require__(9);
const neverthrow_1 = __webpack_require__(10);
const domains_payment_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-payment-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const transaction_schema_1 = __webpack_require__(11);
let MongooseTransactionRepository = class MongooseTransactionRepository {
    constructor(model) {
        this.model = model;
    }
    async save(transaction) {
        try {
            const primitives = transaction.toPrimitives();
            const newDoc = new this.model(primitives);
            await newDoc.save();
            return (0, neverthrow_1.ok)(undefined);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async update(transaction) {
        try {
            const primitives = transaction.toPrimitives();
            await this.model.updateOne({ id: transaction.id }, { $set: primitives }).exec();
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
    async findByPaymentIntentId(paymentIntentId) {
        try {
            const doc = await this.model.findOne({ paymentIntentId }).exec();
            return (0, neverthrow_1.ok)(doc ? this.toDomain(doc) : null);
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    toDomain(doc) {
        return domains_payment_core_1.Transaction.fromPrimitives(doc.toObject());
    }
};
exports.MongooseTransactionRepository = MongooseTransactionRepository;
exports.MongooseTransactionRepository = MongooseTransactionRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.TransactionModelSchema.name)),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], MongooseTransactionRepository);


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


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TransactionSchema = exports.TransactionModelSchema = void 0;
const tslib_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(6);
const domains_payment_core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-payment-core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
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
let TransactionModelSchema = class TransactionModelSchema {
};
exports.TransactionModelSchema = TransactionModelSchema;
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    tslib_1.__metadata("design:type", String)
], TransactionModelSchema.prototype, "id", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    tslib_1.__metadata("design:type", String)
], TransactionModelSchema.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    tslib_1.__metadata("design:type", String)
], TransactionModelSchema.prototype, "referenceId", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    tslib_1.__metadata("design:type", String)
], TransactionModelSchema.prototype, "paymentIntentId", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, type: MoneySchema }),
    tslib_1.__metadata("design:type", MoneySchema)
], TransactionModelSchema.prototype, "amount", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['pending', 'succeeded', 'failed'] }),
    tslib_1.__metadata("design:type", typeof (_a = typeof domains_payment_core_1.TransactionStatus !== "undefined" && domains_payment_core_1.TransactionStatus) === "function" ? _a : Object)
], TransactionModelSchema.prototype, "status", void 0);
tslib_1.__decorate([
    (0, mongoose_1.Prop)(),
    tslib_1.__metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TransactionModelSchema.prototype, "createdAt", void 0);
exports.TransactionModelSchema = TransactionModelSchema = tslib_1.__decorate([
    (0, mongoose_1.Schema)({ timestamps: true, _id: false })
], TransactionModelSchema);
exports.TransactionSchema = mongoose_1.SchemaFactory.createForClass(TransactionModelSchema);


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var StripeGateway_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StripeGateway = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const config_1 = __webpack_require__(5);
const stripe_1 = tslib_1.__importDefault(__webpack_require__(13));
const neverthrow_1 = __webpack_require__(10);
let StripeGateway = StripeGateway_1 = class StripeGateway {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StripeGateway_1.name);
        const secretKey = this.configService.get('STRIPE_SECRET_KEY');
        this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!secretKey || !this.webhookSecret) {
            this.logger.error('Stripe keys not configured');
            throw new Error('Stripe keys not configured');
        }
        this.stripe = new stripe_1.default(secretKey, { apiVersion: '2024-06-20' });
    }
    async createPaymentIntent(amount) {
        try {
            const intent = await this.stripe.paymentIntents.create({
                amount: amount.amount,
                currency: amount.currency,
            });
            if (!intent.client_secret) {
                return (0, neverthrow_1.err)(new Error('Failed to create Stripe Payment Intent'));
            }
            return (0, neverthrow_1.ok)({
                clientSecret: intent.client_secret,
                paymentIntentId: intent.id,
            });
        }
        catch (error) {
            return (0, neverthrow_1.err)(new Error(error.message));
        }
    }
    async constructWebhookEvent(payload, signature) {
        try {
            const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
            return (0, neverthrow_1.ok)(event);
        }
        catch (err) {
            this.logger.error(`Stripe signature verification failed: ${err.message}`);
            return err(new Error(`Webhook Error: ${err.message}`));
        }
    }
};
exports.StripeGateway = StripeGateway;
exports.StripeGateway = StripeGateway = StripeGateway_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], StripeGateway);


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("stripe");

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaymentController = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@myorg/domains/payment/application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const application_2 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@myorg/domains/payment/application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const application_3 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@myorg/domains/payment/application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())); // Añadir import
const money_vo_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@myorg/shared/domain/money.vo'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())); // Añadir import
const core_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@myorg/domains/payment/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())); // Añadir import
let PaymentController = class PaymentController {
    constructor(createPaymentIntentUseCase, confirmPaymentUseCase, requestRefundUseCase) {
        this.createPaymentIntentUseCase = createPaymentIntentUseCase;
        this.confirmPaymentUseCase = confirmPaymentUseCase;
        this.requestRefundUseCase = requestRefundUseCase;
    }
    async createPaymentIntent(dto) {
        const command = {
            userId: dto.userId,
            tripId: dto.tripId,
            amount: money_vo_1.MoneyVO.fromCents(dto.amount), // Asumiendo que MoneyVO tiene este método
            paymentMethod: new core_1.PaymentMethodVO(dto.paymentMethod.type, dto.paymentMethod.token),
        };
        return this.createPaymentIntentUseCase.execute(command);
    }
    async confirmPayment(transactionId) {
        const command = { transactionId };
        return this.confirmPaymentUseCase.execute(command);
    }
    // --- Añadir este método aquí ---
    async requestRefund(dto) {
        const command = {
            transactionId: dto.transactionId,
            amount: dto.amount ? money_vo_1.MoneyVO.fromCents(dto.amount) : undefined,
            reason: dto.reason,
        };
        return this.requestRefundUseCase.execute(command);
    }
    // --- Fin del nuevo método ---
    // Endpoint para webhooks (Stripe, etc.)
    async handleWebhook(payload) {
        // Lógica para manejar eventos de pago (éxito, fracaso, etc.)
        // Puede llamar a un caso de uso como `HandlePaymentWebhookUseCase`
    }
};
exports.PaymentController = PaymentController;
tslib_1.__decorate([
    (0, common_1.Post)('create-intent'),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], PaymentController.prototype, "createPaymentIntent", null);
tslib_1.__decorate([
    (0, common_1.Post)('confirm'),
    tslib_1.__param(0, (0, common_1.Body)('transactionId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], PaymentController.prototype, "confirmPayment", null);
tslib_1.__decorate([
    (0, common_1.Post)('refund'),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], PaymentController.prototype, "requestRefund", null);
tslib_1.__decorate([
    (0, common_1.Post)('webhook'),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
exports.PaymentController = PaymentController = tslib_1.__decorate([
    (0, common_1.Controller)('payment'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof application_1.CreatePaymentIntentUseCase !== "undefined" && application_1.CreatePaymentIntentUseCase) === "function" ? _a : Object, typeof (_b = typeof application_2.ConfirmPaymentUseCase !== "undefined" && application_2.ConfirmPaymentUseCase) === "function" ? _b : Object, typeof (_c = typeof application_3.RequestRefundUseCase !== "undefined" && application_3.RequestRefundUseCase) === "function" ? _c : Object])
], PaymentController);


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebhookController = void 0;
const tslib_1 = __webpack_require__(3);
const common_1 = __webpack_require__(4);
const domains_payment_application_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@going-monorepo-clean/domains-payment-application'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let WebhookController = class WebhookController {
    constructor(handleStripeEventUseCase) {
        this.handleStripeEventUseCase = handleStripeEventUseCase;
    }
    async handleStripeWebhook(signature, req) {
        if (!signature) {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        if (!req.rawBody) {
            throw new common_1.BadRequestException('Raw body missing. Ensure rawBody: true in main.ts');
        }
        try {
            await this.handleStripeEventUseCase.execute(req.rawBody, signature);
            return { received: true };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.WebhookController = WebhookController;
tslib_1.__decorate([
    (0, common_1.Post)('stripe'),
    tslib_1.__param(0, (0, common_1.Headers)('stripe-signature')),
    tslib_1.__param(1, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, typeof (_b = typeof common_1.RawBodyRequest !== "undefined" && common_1.RawBodyRequest) === "function" ? _b : Object]),
    tslib_1.__metadata("design:returntype", Promise)
], WebhookController.prototype, "handleStripeWebhook", null);
exports.WebhookController = WebhookController = tslib_1.__decorate([
    (0, common_1.Controller)('webhooks'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof domains_payment_application_1.HandleStripeEventUseCase !== "undefined" && domains_payment_application_1.HandleStripeEventUseCase) === "function" ? _a : Object])
], WebhookController);


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
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true, // ¡ESENCIAL PARA STRIPE!
    });
    const port = process.env.PORT || 3001;
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(port);
    common_1.Logger.log(`🚀 Payment-Service está corriendo en http://localhost:${port}`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;