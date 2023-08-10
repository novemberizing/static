import Dom from "../Dom.js";

const novemberizing = {
    dom: Dom
};

export default class View {
    static #id = "novemberizing-static-view";
    static #dom = null;

    static #append(destinaton, source) {
        const nodes = [];
        for(const node of source) nodes.push(node);
        for(const node of nodes) destinaton.appendChild(node);

        return destinaton;
    }

    // await html.text(), Static.#config["index.html"], name
    static on(html, config, name, loading, controller) {
        const frame = document.getElementById(View.#id);

        const output = novemberizing.dom.render(html, config, name, frame.contentWindow.document);

        View.#dom = output.dom;

        View.#append(frame.contentWindow.document.head, View.#dom.head.childNodes);
        View.#append(frame.contentWindow.document.body, View.#dom.body.childNodes);
        for(const attribute of View.#dom.body.attributes) {
            frame.contentWindow.document.body.setAttribute(attribute.name, attribute.value);
        }

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

        // OBSERVER 처리
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

            novemberizing.dom.show(frame);

            setTimeout(() => loading.hide(), 500);    // DEBUG

            controller.on(config, name, frame);
        }

        // 스크롤바가 2개 생긴다.
        document.body.style.overflow = "hidden";

        // TODO: REFACTOR THIS novemberizing-modal-loading 를 나이스하게 가지고 오는 방법
        document.getElementById("novemberizing-modal-loading").addEventListener("shown.bs.modal", load, { once: true });

        loading.show();
    }
}