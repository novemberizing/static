import StaticException from "../Exception.js";

export default class StaticExceptionInvalid extends StaticException {
    constructor(message, original) {
        super(message, original);
    }
}
