"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Route", {
    enumerable: true,
    get: function() {
        return Route;
    }
});
const _extends = require("@swc/helpers/_/_extends");
const _shareddomain = require("@going-monorepo-clean/shared-domain");
const _neverthrow = require("neverthrow");
let Route = class Route {
    static create(props) {
        // Ejemplo de validación de dominio
        if (props.basePrice <= 0) {
            return (0, _neverthrow.err)(new Error('Base price must be positive.'));
        }
        const route = new Route(_extends._({}, props, {
            id: new _shareddomain.UUID(),
            status: 'active'
        }));
        return (0, _neverthrow.ok)(route);
    }
    constructor(props){
        // Inicialización de campos
        this.id = props.id;
        // ...
        this.status = props.status;
    }
};

//# sourceMappingURL=route.entity.js.map