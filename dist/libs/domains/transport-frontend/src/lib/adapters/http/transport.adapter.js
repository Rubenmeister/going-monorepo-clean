"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HttpTransportAdapter", {
    enumerable: true,
    get: function() {
        return HttpTransportAdapter;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _common = require("@nestjs/common");
let HttpTransportAdapter = class HttpTransportAdapter {
    async save(trip) {
        // Lógica para llamar a transport-service
        await fetch('/api/transport/create', {
            method: 'POST',
            body: JSON.stringify(trip)
        });
    }
};
HttpTransportAdapter = _ts_decorate._([
    (0, _common.Injectable)()
], HttpTransportAdapter);

//# sourceMappingURL=transport.adapter.js.map