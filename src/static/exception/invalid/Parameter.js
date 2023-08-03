import StaticExceptionInvalid from "../Invalid.js";

export default class StaticExceptionInvalidParameter extends StaticExceptionInvalid {
    constructor(message, original) {
        super(message, original);
    }
}
