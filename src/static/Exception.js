
export default class StaticException extends Error {
    #original = null;

    constructor(message, original) {
        super(message);
        
        this.#original = original;
    }
}