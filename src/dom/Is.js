
export default class Is {
    static primitive(o) {
        if(typeof o === "string" || typeof o === "number" || typeof o === "boolean") {
            return true;
        }
        return false;
    }

    static array = Array.isArray;
}