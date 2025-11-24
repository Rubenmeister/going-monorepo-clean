"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HttpParcelRepository", {
    enumerable: true,
    get: function() {
        return HttpParcelRepository;
    }
});
const _neverthrow = require("neverthrow");
const _domainsparcelfrontendcore = require("@going-monorepo-clean/domains-parcel-frontend-core");
const API_GATEWAY_URL = 'http://localhost:3000/api';
let HttpParcelRepository = class HttpParcelRepository {
    async create(data, token) {
        try {
            const body = {
                userId: data.userId,
                origin: data.origin.toPrimitives(),
                destination: data.destination.toPrimitives(),
                description: data.description,
                price: data.price.toPrimitives()
            };
            const response = await fetch(`${API_GATEWAY_URL}/parcels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const responseData = await response.json();
            if (!response.ok) {
                return (0, _neverthrow.err)(new Error(responseData.message || 'Error al crear el envío'));
            }
            const parcel = _domainsparcelfrontendcore.Parcel.fromPrimitives(responseData);
            return (0, _neverthrow.ok)(parcel);
        } catch (error) {
            return (0, _neverthrow.err)(new Error(error.message || 'Error de red al crear el envío'));
        }
    }
    async getByUser(userId, token) {
        try {
            const response = await fetch(`${API_GATEWAY_URL}/parcels/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const responseData = await response.json();
            if (!response.ok) {
                return (0, _neverthrow.err)(new Error(responseData.message || 'Error al obtener los envíos'));
            }
            const parcels = responseData.map((data)=>_domainsparcelfrontendcore.Parcel.fromPrimitives(data));
            return (0, _neverthrow.ok)(parcels);
        } catch (error) {
            return (0, _neverthrow.err)(new Error('Error de red al obtener los envíos'));
        }
    }
    async getTrackingStatus(parcelId, token) {
        try {
            const response = await fetch(`${API_GATEWAY_URL}/parcels/${parcelId}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const responseData = await response.json();
            if (!response.ok) {
                return (0, _neverthrow.err)(new Error(responseData.message || 'Error al obtener el estado'));
            }
            const parcel = _domainsparcelfrontendcore.Parcel.fromPrimitives(responseData);
            return (0, _neverthrow.ok)(parcel);
        } catch (error) {
            return (0, _neverthrow.err)(new Error('Error de red al obtener el tracking'));
        }
    }
};

//# sourceMappingURL=http-parcel.repository.js.map