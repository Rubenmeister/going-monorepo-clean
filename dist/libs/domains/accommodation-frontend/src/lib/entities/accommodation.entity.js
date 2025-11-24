"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Accommodation", {
    enumerable: true,
    get: function() {
        return Accommodation;
    }
});
const _extends = require("@swc/helpers/_/_extends");
const _shareddomain = require("@going-monorepo-clean/shared-domain");
let Accommodation = class Accommodation {
    static fromPrimitives(props) {
        return new Accommodation(_extends._({}, props, {
            location: _shareddomain.Location.fromPrimitives(props.location),
            pricePerNight: _shareddomain.Money.fromPrimitives(props.pricePerNight)
        }));
    }
    constructor(props){
        this.id = props.id;
        this.title = props.title;
        this.description = props.description;
        this.location = props.location;
        this.pricePerNight = props.pricePerNight;
        this.images = props.images;
        this.rating = props.rating;
    }
};

//# sourceMappingURL=accommodation.entity.js.map