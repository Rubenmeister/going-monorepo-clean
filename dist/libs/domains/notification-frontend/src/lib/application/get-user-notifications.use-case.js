"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GetUserNotificationsUseCase", {
    enumerable: true,
    get: function() {
        return GetUserNotificationsUseCase;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _common = require("@nestjs/common");
const _neverthrow = require("neverthrow");
const _notificationapiclient = require("@going-monorepo-clean/notification-api-client");
const _domainsuserfrontendcore = require("@going-monorepo-clean/domains-user-frontend-core");
let GetUserNotificationsUseCase = class GetUserNotificationsUseCase {
    async execute(userId) {
        const sessionResult = await this.authRepository.loadSession();
        if (sessionResult.isErr() || !sessionResult.value) {
            return (0, _neverthrow.err)(new Error('No estás autenticado.'));
        }
        const token = sessionResult.value.token;
        // 1. Llamar al Adaptador (API Client)
        const result = await this.apiClient.getByUserId(userId, token);
        if (result.isErr()) {
            return (0, _neverthrow.err)(result.error);
        }
        // 2. Mapear DTOs simples a View Models (Transformación)
        const viewModels = result.value.map((dto)=>({
                id: dto.id,
                title: dto.title,
                body: dto.body,
                isRead: dto.status === 'READ',
                timeAgo: 'Justo ahora'
            }));
        return (0, _neverthrow.ok)(viewModels);
    }
    constructor(authRepository/* La inyección real de tu provider */ ){
        this.apiClient = new _notificationapiclient.NotificationApiClient();
        this.authRepository = authRepository;
    }
};
GetUserNotificationsUseCase = _ts_decorate._([
    (0, _common.Injectable)(),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof _domainsuserfrontendcore.IAuthRepository === "undefined" ? Object : _domainsuserfrontendcore.IAuthRepository
    ])
], GetUserNotificationsUseCase);

//# sourceMappingURL=get-user-notifications.use-case.js.map