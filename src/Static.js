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

        const frame = document.getElementById(Static.#view);

        // TODO: ALL FILE PARSING
        const output = novemberizing.dom.render(await html.text(), Static.#config["index.html"], name, frame.contentWindow.document);
        Static.#dom = output.dom;

        if(bootstrap === undefined) throw new Error();
        const modal = new bootstrap.Modal(document.getElementById(Static.#loading), {});

        function shownLoad(e) {
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

            const comment = novemberizing.dom.gen("div", { style: { width: '0px', height: '0px' } }, document.createComment("developed by novemberizing. : )"));

            const delay = 200;
            function delayOpen() {
                setTimeout(() => {
                    const node = comment;
                    const rect = node.getBoundingClientRect();
                    frame.height = rect.y;
                    setTimeout(() => {
                        modal.hide();
                    }, delay);
                }, delay);
            }
            // TODO: 스크립트의 순차적 로딩
            let length = 0;
            for(const script of scripts) {
                const o = document.createElement("script");
                for(const attribute of script.attributes) {
                    o.setAttribute(attribute.name, attribute.value);
                }
                o.textContent = script.textContent;
                o.async = false;
                const parent = script.parentNode;
                const next = script.previousSibling;
                parent.removeChild(script);
                parent.insertBefore(o, next);
                o.addEventListener("load", e => {
                    length = length + 1;
                    // TODO: 빈 스크립트의 경우 동작하지 않는다.
                    // 강제적으로 이벤트를 발생 시킨다.
                    if(length >= scripts.length) {
                        frame.contentWindow.dispatchEvent(new Event('load'));
                        console.log("windows. load");
                        delayOpen();
                    }
                }, { once: true });
            }

            function callback(mutations, observer) {
                console.log("mutations load");
                if(scripts.length === 0) delayOpen();
                observer.disconnect();
            }
            const observer = new MutationObserver(callback);

            observer.observe(frame.contentWindow.document.body, { attributes: true, childList: true, subtree: true });

            frame.contentWindow.document.body.appendChild(comment);

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

