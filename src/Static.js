// import fs from "fs/promises";
// import path from "path";
// import mustache from "mustache";
// import _ from "lodash";

// import Log from "@novemberizing/log";

// import StaticExceptionInvalidParameter from "./static/exception/invalid/Parameter.js";

import Dom from "./Dom.js";
import Novemberizing from "./Novemberizing.js";
import Bootstrap from "./Bootstrap.js";

const novemberizing = Object.assign(Novemberizing, {
    dom: Dom,
});

export default class Static {
    static #dom = null;
    static #config = null;

    static #view = "novemberizing-static-view";
    static #controller = "novemberizing-static-controller";
    static #loading = "novemberizing-modal-loading";

    static off() {

    }
    static async on(name) {
        const html = await fetch(`${name}/`);
        const config = await fetch(`${name}.json`);
        Static.#config = await config.json();

        // TODO: ALL FILE PARSING
        const output = novemberizing.dom.render(await html.text(), Static.#config["index.html"]);
        Static.#dom = output.dom;

        const myModal = new Bootstrap.Modal(Static.#loading, {});
        console.log(myModal);

        novemberizing.show(Static.#loading);
    }
}
