import Dom from "./Dom.js";
import Novemberizing from "./Novemberizing.js";
// import * as bootstrap from "bootstrap";

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
        const output = novemberizing.dom.render(await html.text(), Static.#config["index.html"], name);
        Static.#dom = output.dom;

        if(bootstrap === undefined) throw new Error();
        const modal = new bootstrap.Modal(document.getElementById(Static.#loading), {});

        function shownLoad(e) {
            const frame = document.getElementById(Static.#view);

            if(!document) throw new Error();

            let nodes =  [];
            for(let i = 0; i < Static.#dom.head.childNodes.length; i++) {
                nodes.push(Static.#dom.head.childNodes[i]);
            }
            for(const node of nodes) {
                frame.contentWindow.document.head.appendChild(node);
            }

            nodes =  [];
            for(let i = 0; i < Static.#dom.body.childNodes.length; i++) {
                nodes.push(Static.#dom.body.childNodes[i]);
            }
            for(const node of nodes) {
                frame.contentWindow.document.body.appendChild(node);
            }
            // TODO: SCRIPTS CREATE
            const array = frame.contentWindow.document.getElementsByTagName("script");
            const scripts = [];
            for(const script of array) scripts.push(script);
            for(const script of scripts) {
                const o = document.createElement("script");
                for(const attribute of script.attributes) {
                    o.setAttribute(attribute.name, attribute.value);
                }
                o.textContent = script.textContent;
                const parent = script.parentNode;
                const next = script.previousSibling;
                parent.removeChild(script);
                parent.insertBefore(o, next);
            }

            function callback(mutations, observer) {
                const node = mutations[0].addedNodes[0];        // TODO: ERROR HANDLING
                const rect = node.getBoundingClientRect();

                frame.height = parseInt(rect.y);

                modal.hide();

                observer.disconnect();
            }
            const observer = new MutationObserver(callback);

            observer.observe(frame.contentWindow.document.body, { attributes: true, childList: true, subtree: true });

            const o = novemberizing.dom.gen("div", { style: { width: '0px', height: '0px' } }, document.createComment("developed by novemberizing. : )"));
            frame.contentWindow.document.body.appendChild(o);

            const links = frame.contentWindow.document.getElementsByTagName("a");
            for(const link of links) {
                link.addEventListener("click", e => {
                    let node = e.target;
                    while(node && node.tagName.toUpperCase() !== 'A') {
                        node = node.parentNode;
                    }
                    if(node) {
                        if(node.href === '#') {
                            location.href = node.href;
                        } else if(node.href) {
                            if(node.href.startsWith("http")) {
                                location.href = node.href;
                            }
                        }
                    }
                    e.preventDefault();
                });
            }

            novemberizing.show(frame);
        }

        document.getElementById(Static.#loading).addEventListener("shown.bs.modal", shownLoad, { once: true });
        // modal
        modal.show();   
    }
}

