"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SearchAccommodationsUseCase", {
    enumerable: true,
    get: function() {
        return SearchAccommodationsUseCase;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _ts_param = require("@swc/helpers/_/_ts_param");
const _common = require("@nestjs/common");
const _domainsaccommodationfrontendcore = require("@going-monorepo-clean/domains-accommodation-frontend-core");
let SearchAccommodationsUseCase = class SearchAccommodationsUseCase {
    async execute(filters) {
        return this.repository.search(filters);
    }
    constructor(repository){
        this.repository = repository;
    }
};
SearchAccommodationsUseCase = _ts_decorate._([
    (0, _common.Injectable)(),
    _ts_param._(0, (0, _common.Inject)(_domainsaccommodationfrontendcore.IAccommodationRepository)),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof _domainsaccommodationfrontendcore.IAccommodationRepository === "undefined" ? Object : _domainsaccommodationfrontendcore.IAccommodationRepository
    ])
], SearchAccommodationsUseCase);

//# sourceMappingURL=search-accommodations.use-case.js.map