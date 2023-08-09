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
    static #license = "novemberizing-modal";

    static get license(){ return Static.#license; }

    static {
        if(typeof bootstrap !== "undefined") {
            Static.#license = new bootstrap.Modal(document.getElementById(Static.#license), {});
        }
    }

    static #append(destinaton, source) {
        const nodes = [];
        for(const node of source) nodes.push(node);
        for(const node of nodes) destinaton.appendChild(node);

        return destinaton;
    }

    static off() {

    }
 

    static #controllerOn(config) {
        const controller = document.getElementById(Static.#controller);

        novemberizing.show(controller);

        // FIELD 
        controller.appendChild(novemberizing.dom.gen("div", { className: "row" }, 
            novemberizing.dom.gen("div", { className: "col" }, [
                novemberizing.dom.gen("div", { className: "row title" }, [
                    novemberizing.dom.gen("div", { className: "col-6 text-center fw-bold"}, "Key"),
                    novemberizing.dom.gen("div", { className: "col-6 text-center fw-bold"}, "Value")
                ])
            ])
        ));
        let body = null;
        controller.appendChild(novemberizing.dom.gen("div", { className: "row" }, [
            body = novemberizing.dom.gen("div", { className: "col", style: { maxHeight: '300px', overflowY: 'auto' } }, [])
        ]));

        function isPrimitive(v){ return (typeof v === "string" || typeof v === "number" || typeof v === "boolean")}

        const padding = 5;
        function configGen(config, depth = 0) {
            if(typeof config === "object") {
                if(config === null) return;
                if(Array.isArray(config)) throw new Error();
                for(const key of Object.keys(config)) {
                    if(key.startsWith("_")) continue;
                    if(Array.isArray(config[key])){
                        if(config[key].length === 0) throw new Error();;
                        for(let i = 1; i < config[key].length; i++) {
                            body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
                                novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${padding * (depth + 2)}px` } }, [
                                    key,
                                    novemberizing.dom.gen("sup", { style: { fontSize: ".3rem" } }, `${i - 1}`)
                                ]),
                                novemberizing.dom.gen("div", { className: "col-6" }, '')
                            ]));
                            configGen(config[key][i], depth + 2);
                        }
                        continue;
                    }

                    const node = config[key]._node;
                    const value = config[key]._value;
                    const children = config[key]._children;

                    if(node) {
                        if(isPrimitive(value)) {
                            body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
                                novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${padding * (depth + 1)}px` } }, key),
                                novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, value)
                            ]));
                            continue;
                        } else {
                            if(typeof value === "object") {
                                if(value === null) continue;
                                if(Array.isArray(value)) throw new Error();
                                body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
                                    novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${padding * (depth + 1)}px` } }, key),
                                    novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, '-')
                                ]));
                                configGen(value, depth + 1);
                                continue;
                            }
                            throw new Error();
                        }
                    }
                    throw new Error();  // ?
                }
            }
        }

        configGen(config);

        

        // novemberizing.show(controller);
    }

    static async on(name) {
        const html = await fetch(`${name}/`);
        const config = await fetch(`${name}.json`);
        Static.#config = await config.json();

        const frame = document.getElementById(Static.#view);
        

        // TODO: ALL FILE PARSING
        const output = novemberizing.dom.render(await html.text(), Static.#config["index.html"], name, frame.contentWindow.document);

        Static.#dom = output.dom;

        const modal = new bootstrap.Modal(document.getElementById(Static.#loading), {});
        

        Static.#append(frame.contentWindow.document.head, Static.#dom.head.childNodes);
        Static.#append(frame.contentWindow.document.body, Static.#dom.body.childNodes);

        for(const attribute of Static.#dom.body.attributes) {
            frame.contentWindow.document.body.setAttribute(attribute.name, attribute.value);
        }

        // SCRIPT 처리
        let length = 0;
        const scripts = frame.contentWindow.document.getElementsByTagName("script");
        for(const node of scripts) {
            const script = document.createElement("script");
            for(const attribute of node.attributes) {
                script.setAttribute(attribute.name, attribute.value);
            }
            script.textContent = node.textContent;
            script.async = false;
            script.addEventListener("load", e => {
                // 스크립트가 다 로드되면 강제적으로 WINDOWS LOAD 를 수행한다.
                length = length + 1;
                if(length >= scripts.length) {
                    // 강제적으로 로딩을 한다.
                    frame.contentWindow.dispatchEvent(new Event("load"));
                }
                
            });

            const parent = node.parentNode;
            parent.insertBefore(script, node);
            parent.removeChild(node);
        }
        // LINK 처리
        const links = frame.contentWindow.document.body.getElementsByTagName("a");
        for(const link of links) {
            link.addEventListener("click", e => {
                let target = e.target;
                while(target.tagName.toLowerCase() !== 'a') {
                    target = target.parentNode;
                }
                if(target.getAttribute("href")) {
                    const href = target.getAttribute("href").trim();
                    if(href === '#') {
                        frame.contentWindow.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: "smooth"
                        });
                    } else if(href.startsWith('http')) {
                        location.href = href;
                    }
                    e.preventDefault();
                }
            });
        }

        function callback(mutations, observer) {
            observer.disconnect();
        }

        const observer = new MutationObserver(callback);

        observer.observe(frame.contentWindow.document.body, { attributes: true, childList: true, subtree: true });

        const comment = novemberizing.dom.gen("div", { style: { width: '100%', height: '0px' } }, document.createComment("developed by novemberizing. : )"));

        frame.contentWindow.document.body.appendChild(comment);

        function load(e) {
            // CALCULATE SCREEN WITH, SCREEN HEIGHT
            frame.width = window.innerWidth;
            frame.height = window.innerHeight;

            novemberizing.show(frame);

            setTimeout(() => modal.hide(), 500);    // DEBUG

            Static.#controllerOn(Static.#config["index.html"]);

            // setTimeout(() => modal.hide(), 500);
        }

        // 스크롤바가 2개 생긴다.
        document.body.style.overflow = "hidden";

        document.getElementById(Static.#loading).addEventListener("shown.bs.modal", load, { once: true });
        modal.show();   
    }
}


