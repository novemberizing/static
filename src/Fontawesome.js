import Dom from "./Dom.js";

const novemberizing = {
    dom: Dom
};

export default class Fontawesome {
    static gen(className) {
        return novemberizing.dom.gen("i", { className });
    }
}
