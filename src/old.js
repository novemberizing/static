const novemberizing = {

                
    loading: new bootstrap.Modal(document.getElementById("novemberizing-modal-loading")),
    /** {{#license}} */
    modal: new bootstrap.Modal(document.getElementById('novemberizing-modal')),
    /** {{/license}} */
    /** {{^license}} */
    modal: { show: () => (undefined) },
    /** {{/license}} */
    move: addr => (location.href = addr),
    static: {

        view: {
            preprocess: (dom, context = [], generatedConfig = {}) => {
                let currentConfig = context.reduce((accumulator, key) => accumulator = accumulator[key], generatedConfig);
                
                for(const node of dom.childNodes) {
                    if(node.nodeType === Node.COMMENT_NODE) {
                        const value = node.nodeValue.trim();
                        if(value.startsWith("\{\{") && value.endsWith("\}\}")) {
                            if(value.startsWith("\{\{\#")) {
                                const name = value.substring(3, value.length - 2).trim();
                                currentConfig[name] = {};
                                context.push(name);
                            } else if(value.startsWith("\{\{\/")) {
                                context.pop();
                                currentConfig = context.reduce((accumulator, key) => accumulator = accumulator[key], generatedConfig);
                            } else {
                                throw new Error();
                            }
                        }
                    } else if(node.nodeType === Node.TEXT_NODE) {
                        let value = node.nodeValue.trim();
                        while(value) {
                            if(value.startsWith("\{\{") && value.endsWith("\}\}")) {
                                if(value.startsWith("\{\{\#")) {
                                    const name = value.substring(3, value.length - 2).trim();
                                    currentConfig[name] = {};
                                    context.push(name);
                                } else if(value.startsWith("\{\{\/")) {
                                    context.pop();
                                    currentConfig = context.reduce((accumulator, key) => accumulator = accumulator[key], generatedConfig);
                                    const index = value.indexOf("\}\}");
                                    value = value.substring(index + 2)
                                                 .trim();
                                    continue;
                                } else {
                                    const key = value.substring(2, value.length - 2).trim();
                                    if(key === ".") {
                                        currentConfig[key] = ["--", "novemberizing", "static", ...context].join("-");
                                        node.parentNode.setAttribute("name", currentConfig[key]);
                                    } else {
                                        currentConfig[key] = ["--", "novemberizing", "static", ...context, key].join("-");
                                        node.parentNode.setAttribute("name", currentConfig[key]);
                                    }
                                }
                            }
                            break;
                        }
                        
                    } else if(node.nodeType === Node.ELEMENT_NODE) {
                        const clone = node.cloneNode();
                        const pattern = /.*\{\{.*\}\}.*/;
                        if(clone.outerHTML.match(pattern)) {
                            // TODO: MULTIPLE 로 정의되어 있으면,... 
                            let mustache = clone.outerHTML.substring(clone.outerHTML.indexOf("\{\{") + 2, clone.outerHTML.indexOf("\}\}"));
                            if(mustache.startsWith("\{")) {
                                mustache = mustache.substring(1);
                            }
                            const key = mustache.trim();
                            if(key === ".") {
                                currentConfig[key] = ["--", "novemberizing", "static", ...context].join("-");
                                node.setAttribute("name", currentConfig[key]);
                            } else {
                                currentConfig[key] = ["--", "novemberizing", "static", ...context, key].join("-");
                                node.setAttribute("name", currentConfig[key]);
                            }
                        }
                    } else {
                    }
                    if(node.hasChildNodes()) {
                        novemberizing.static.view.preprocess(node, context, generatedConfig);
                    }
                }
                // console.log(generatedConfig);
                return {dom, generatedConfig};
            },
            on: async link => {
                novemberizing.loading.show();
                // GET DOCUMENT
                const frame = document.getElementById("novemberizing-static-view");
                // LOAD DOM
                const { dom, generatedConfig } = novemberizing.static.view.preprocess(await novemberizing.static.dom(link));
                // console.log(dom.cloneNode(true));
                const config = await novemberizing.static.config(`${link}.json`);

                // LOAD HEAD
                dom.head.innerHTML = Mustache.render(dom.head.innerHTML, config.o["index.html"]);
                dom.head = novemberizing.static.adjust(dom.head, `${link}/`);

                frame.contentWindow.document.head.innerHTML = "";
                for(const node of dom.head.children) {
                    if(node.tagName && node.tagName.toUpperCase() === "SCRIPT") {
                        const script = document.createElement("script");
                        if(node.src) script.src = node.src;
                        script.defer = true;
                        const o = frame.contentWindow.document.head.appendChild(script);
                        o.addEventListener("load", e => {
                            console.log(e);
                        });
                    } else {
                        frame.contentWindow.document.head.appendChild(node.cloneNode(true));
                    }
                }
                // LOAD BODY

                dom.body.innerHTML = Mustache.render(dom.body.innerHTML, config.o["index.html"]);
                dom.body = novemberizing.static.adjust(dom.body, `${link}/`);

                frame.contentWindow.document.body.innerHTML = "";
                for(const node of dom.body.children) {
                    if(node.tagName && node.tagName.toUpperCase() === "SCRIPT") {
                        const script = document.createElement("script");
                        if(node.src) script.src = node.src;
                        script.defer = true;
                        const o = frame.contentWindow.document.body.appendChild(script);
                        o.addEventListener("load", e => {
                            
                            console.log(e, script.src, e.currentTarget);
                        });
                    } else {
                        frame.contentWindow.document.body.appendChild(node.cloneNode(true));
                    }
                }
                // SET CLICK HOOKING
                frame.contentWindow.document.addEventListener("click", e => {
                    if(e.target.tagName === "A") {
                        if(e.target.href.trim() === "#") {
                            e.preventDefault();
                            location.href = `${location.href}${location.href.substring(0, location.href.indexOf('#'))}${e.target.href.trim()}`;
                        } else if(e.target.href.startsWith("#")) {

                        } else {
                            e.preventDefault();
                            location.href = e.target.href;
                        }
                    } else if(e.target.parentNode.tagName === "A") {
                        if(e.target.parentNode.href.trim() === "#") {
                            e.preventDefault();
                            location.href = `${location.href}${location.href.substring(0, location.href.indexOf('#'))}${e.target.parentNode.href.trim()}`;
                        } else if(e.target.parentNode.href.startsWith("#")) {

                        } else {
                            e.preventDefault();
                            location.href = e.target.parentNode.href;
                        }
                    }
                });
                // LOAD COMMENT
                const observer = new MutationObserver((mutations, observer) => {
                    setTimeout(() => {
                        frame.height = frame.contentWindow.document.body.scrollHeight;
                        novemberizing.loading.hide();
                        setTimeout(() => {
                            frame.height = frame.contentWindow.document.body.scrollHeight;
                        }, 1000);
                    }, 1000);
                    
                    frame.height = frame.contentWindow.document.body.scrollHeight;
                    observer.disconnect();
                });
                observer.observe(frame.contentWindow.document.body, { attributes: true, childList: true, subtree: true });
                const comment = document.createComment("novemberizing <novemberizing@gmail.com>");
                frame.contentWindow.document.body.appendChild(comment);

                // DISPLAY
                window.addEventListener("resize", novemberizing.static.onResizeBody);
                novemberizing.show(frame);

                return { dom, config, generatedConfig };
            },
            off: async () => {
                novemberizing.hide('novemberizing-static-view');
                window.removeEventListener("resize", novemberizing.static.onResizeBody);
            }
        },
        controller: {
            gen: (config, parent, depth = 0, context = [], parentClass = "dir") => {
                const elements = {};
                for(const key of Object.keys(config)) {
                    const o = config[key];
                    context.push(key);
                    let icon = "fa-regular fa-circle-dot";
                    let comments = null;
                    let types = null;
                    let value = null;
                    let element = null;
                    let attr = null;
                    let classification = parentClass !== "dir" ? typeof o : "dir";

                    if(typeof o === "string") {
                        comments = o.split(/[^\\(=?\|)]\||^\|/).map(v => v.trim());
                        value = comments[1];
                        types = comments[2].split(",");
                        attr = comments[3];
                        // TODO: REFACTOR THIS
                        if(types.includes("file")) {
                            icon = "fa-solid fa-file";
                        } else if(types.includes("dir")) {
                            icon = "fa-solid fa-folder-closed";
                        } else if(types.includes("date")) {
                            icon = "fa-regular fa-calendar";
                        } else if(types.includes("text")) {
                            icon = "fa-solid fa-font";
                        } else if(types.includes("img")) {
                            icon = "fa-regular fa-image";
                        } else if(types.includes("facebook")) {
                            icon = "fa-brands fa-facebook";
                        } else if(types.includes("twitter")) {
                            icon = "fa-brands fa-twitter";
                        } else if(types.includes("instagram")) {
                            icon = "fa-brands fa-instagram";
                        } else if(types.includes("linkedin")) {
                            icon = "fa-brands fa-linkedin";
                        } else if(types.includes("email")) {
                            icon = "fa-solid fa-at";
                        } else if(types.includes("phone")) {
                            icon = "fa-solid fa-phone";
                        } else if(types.includes("map")) {
                            icon = "fa-solid fa-map";
                        } else if(types.includes("credit")) {
                            icon = "fa-regular fa-credit-card";
                        } else if(types.includes("license")) {
                            icon = "fa-regular fa-copyright";
                        } else if(types.includes("url")) {
                            icon = "fa-solid fa-earth-asia";
                        }
                        // TODO: REFACTOR THIS
                    } else if(typeof o === "object") {
                        icon = "fa-solid fa-folder-open";
                        if(!Array.isArray(o)) {
                            const supports = [".html"];

                            if(supports.find(extension => key.endsWith(extension))) {
                                icon = "fa-solid fa-file";
                                classification = "file";
                            }
                        }
                    } else {
                        console.log(o);
                        throw new Error("unsupported");
                    }

                    const marginLeft = `${8 * (depth + 1)}px`;
                    const paddingLeft = `${8 * (depth + 1)}px`;

                    function toggle(e) {
                        let element = e.target.parentNode.parentNode.nextSibling;
                        while(element) {
                            if(element.classList.contains("show")) {
                                element.classList.replace("show", "hide");
                            } else if(element.classList.contains("hide")) {
                                element.classList.replace("hide", "show");
                            } else {
                                element.classList.add("hide");
                            }
                            element = element.nextSibling;
                        }
                    }
                    const cur = JSON.parse(JSON.stringify(context));
                    const captureAttr = attr ? JSON.parse(JSON.stringify(attr)) : attr;
                    function change(e) {
                        if(e.target.type === "file") {
                            e.target.previousSibling.previousSibling.value = e.target.value.split("\\").pop();
                        }

                        const log = document.getElementById("novemberizing-static-controller-console");
                        
                        log.innerHTML = "";

                        const o = cur.slice(1).filter(v => isNaN(parseInt(v)));
                        const frame = document.getElementById("novemberizing-static-view");
                        let name = "---novemberizing-static";
                        let node = frame.contentWindow.document;
                        let n = NaN;
                        console.log(cur);
                        console.log(captureAttr);
                        for(let i = 1; i < cur.length && node; i++) {
                            const index = parseInt(cur[i]);
                            if(isNaN(index)) {
                                name += `-${cur[i]}`;
                                if(i + 1 === cur.length || !isNaN(n)) {
                                    node = node.getElementsByName(name);
                                    console.log(node);
                                    if(!isNaN(n)) {
                                        node = [node[n]];
                                        n = NaN;
                                    }
                                    console.log(node);
                                }
                                continue;
                            }
                            n = index;
                        }
                        if(node.length > 0) {
                            const value = e.target.value.trim();
                            console.log(node);
                            for(const child of node) {
                                if(child) {
                                    const rect= child.getBoundingClientRect();
                                    window.scrollTo({
                                        top: rect.top - 32,
                                        left: 0,
                                        behavior: "smooth",
                                    });
                                    if(captureAttr) {
                                        child.setAttribute(captureAttr, value);
                                    } else {
                                        while(child.firstChild) {
                                            child.removeChild(child.lastChild);
                                        }
                                        child.style.overflowWrap = "anywhere";
                                        child.appendChild(document.createTextNode(value.replace(/ /g, '\u00A0')));
                                    }
                                    if(child.parentNode && child.parentNode.tagName.toUpperCase() === "HEAD") {
                                        log.style.color = "var(--bs-danger)";
                                        log.innerHTML = "[Notice] &lt;head&gt; is not display. <i class=\"fa-solid fa-bug\"></i>";
                                    }
                                } else {
                                    log.style.color = "var(--bs-danger)";
                                    log.innerHTML = "[Warning] Not yet supported. <i class=\"fa-solid fa-bug\"></i>";
                                }
                            }
                        } else {
                            log.style.color = "var(--bs-danger)";
                            log.innerHTML = "[Warning] Not yet supported. <i class=\"fa-solid fa-bug\"></i>";
                        }
                    }

                    function open(e) {
                        e.target.parentNode.nextSibling.click();
                    }

                    function bootstrapIcon(e) {
                        e.target.parentNode.parentNode.parentNode.parentNode.firstChild.value = e.target.className;
                        e.target.parentNode.parentNode.parentNode.style.display = "none";
                        change({ target: e.target.parentNode.parentNode.parentNode.parentNode.firstChild });
                    }

                    function bootstrapIconToggle(e) {
                        console.log(e);
                        if(e.target.parentNode.nextSibling.style.display === "none") {
                            console.log(e.target.parentNode.nextSibling);
                            const nodes = document.querySelectorAll(".row.novemberizing.bootstrap.icon.view");
                            console.log(nodes);
                            for(const node of nodes) {
                                if(node.parentNode.style.display !== "none") {
                                    node.parentNode.style.display = "none";
                                }
                                node.parentNode.removeChild(node);
                            }
                            e.target.parentNode.nextSibling.appendChild(novemberizing.bootstrap.icon.all(null, bootstrapIcon));
                            e.target.parentNode.nextSibling.style.display = "block";
                        } else {
                            while(e.target.parentNode.nextSibling.firstChild) {
                                e.target.parentNode.nextSibling.removeChild(e.target.parentNode.nextSibling.lastChild);
                            }
                            e.target.parentNode.nextSibling.style.display = "none";
                        }
                    }

                    if((classification!=="file" && classification!=="dir") || o === "index.html") {
                        parent.append(novemberizing.dom.gen("div", { className: "row", style: { "border-bottom": types === null ? "" : "1px solid #cfcfcf" } }, 
                            types === null ? [
                                element = novemberizing.dom.gen("div", { className: "col-12" }, [
                                    novemberizing.dom.gen("div", { className: "row", style: { "border-bottom": "1px solid #cfcfcf" } }, [
                                        novemberizing.dom.gen("div", { className: "col-6", style: { "border-right": "1px solid #cfcfcf", padding: '0px', paddingLeft } }, [
                                            icon.startsWith("fa-solid fa-folder") || (typeof o === "object" && Object.keys(o).length > 0) ?
                                                novemberizing.dom.gen("button", { onClick: toggle, className: "btn btn-link" }, [
                                                    novemberizing.fontawesome.gen(`${icon} pe-1`),
                                                    key
                                                ]) :
                                                novemberizing.dom.gen("span", {}, [ novemberizing.fontawesome.gen(`${icon} pe-1`), key ])
                                        ]),
                                        novemberizing.dom.gen("div", { className: "col-6" }, [])
                                    ])
                                ])
                            ] : [
                                novemberizing.dom.gen("div", { className: "col-6", style: { padding: '0px', paddingLeft, "border-right": "1px solid #cfcfcf" } }, [
                                    novemberizing.fontawesome.gen(`${icon} pe-1`),
                                    key
                                ]),
                                novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: '4px', paddingRight: '4px' } }, [
                                    types.includes("boolean") &&
                                        novemberizing.dom.gen("div", { className: "dropdown novemberizing static controller-dropdown"}, [
                                            novemberizing.dom.gen("button", { type: "button", className: "btn btn-link dropdown-toggle", id: "helloworld", "data-bs-toggle": "dropdown", "aria-expanded": false }, [ value ]),
                                            novemberizing.dom.gen("ul", {className: "dropdown-menu", "aria-labelledby": "helloworld"}, [
                                                novemberizing.dom.gen("li", {}, [ novemberizing.dom.gen("button", { onClick: e=> { e.target.parentNode.parentNode.previousSibling.innerText = "true"; change(e); }, className: "dropdown-item"}, [ "true" ]) ]),
                                                novemberizing.dom.gen("li", {}, [ novemberizing.dom.gen("button", { onClick: e=> { e.target.parentNode.parentNode.previousSibling.innerText = "false"; change(e); }, className: "dropdown-item"}, [ "false" ]) ])
                                            ])
                                        ]),
                                    (types.includes("img") && 
                                        novemberizing.dom.gen("div", { className: "input-group", style: { padding: "0px", margin: "0px" } }, [
                                            novemberizing.dom.gen("input", { type: "text", onKeyup: change, onChange: change, className: "novemberizing static controller-input form-control text-truncate input-file", style: { paddingRight: '8px' }, value }, []),
                                            novemberizing.dom.gen("button", { onClick: open, className: "btn btn-link", type: "button" }, [
                                                novemberizing.fontawesome.gen("fa-solid fa-ellipsis")
                                            ]),
                                            novemberizing.dom.gen("input", { type: "file", onChange: change, className: "novemberizing static controller-input form-control text-truncate", style: { display: "none" }}, [])
                                        ])
                                    ),
                                    (types.includes("bootstrap.icon") &&
                                        novemberizing.dom.gen("div", { className: "input-group", style: { padding: "0px", margin: "0px" } }, [
                                            novemberizing.dom.gen("input", { type: "text", onKeyup: change, onChange: change, className: "novemberizing static controller-input form-control text-truncate", disabled: true, style: { paddingRight: '8px' }, value }, []),
                                            novemberizing.dom.gen("button", { onClick: bootstrapIconToggle, className: "btn btn-link", type: "button" }, [
                                                novemberizing.fontawesome.gen("fa-solid fa-ellipsis")
                                            ]),
                                            novemberizing.dom.gen("div", { style: { backgroundColor: '#F0F0F0', border: "1px solid #909090", paddingTop: '8px', paddingBottom: '8px', opacity: 1, position: 'absolute', top: '20px', left: '0px', width: '100%', display: "none" }}, [
                                                // novemberizing.bootstrap.icon.all(null, bootstrapIcon)
                                            ])
                                        ])
                                    ),
                                    (types.includes("text") || types.includes("date") || types.includes("url")) && !types.includes("img") &&
                                        novemberizing.dom.gen("input", { onKeyup: change, onChange: change, type: "text", className: "novemberizing static controller-input form-control text-truncate", value}, [])
                                ])
                            ]
                        ));
                    } else {
                        element = parent;
                    }

                    if(typeof o === "object") {
                        if(Array.isArray(o)) {
                            novemberizing.static.controller.gen(config[key], element, depth + 1, context, classification);
                        } else {
                            novemberizing.static.controller.gen(config[key], element, depth + 1, context, classification);
                            
                        }
                    }
                    context.pop();
                }
            },
            on: async (link, config) => {
                const controller = document.getElementById("novemberizing-static-controller");
                controller.innerHTML = "";
                // controller.style.top = '120px';
                
                controller.appendChild(novemberizing.dom.gen("div", { className: "row title" }, [
                    novemberizing.dom.gen("div", { className: "col-6"}, [ "Field" ]),
                    novemberizing.dom.gen("div", { className: "col-6"}, [ "Detail"]),
                ]));

                const content = controller.appendChild(novemberizing.dom.gen("div", { className: "novemberizing static controller-body" }, [

                ]));

                novemberizing.static.controller.gen(config, content);

                controller.appendChild(novemberizing.dom.gen("div", { className: "row footer" }, [
                    novemberizing.dom.gen("div", { className: "col-12 p-0 text-center"}, [
                        novemberizing.dom.gen("sub", { className: "px-2", id: "novemberizing-static-controller-console"}, [])
                    ]),
                    novemberizing.dom.gen("div", { className: "col-12"}, [
                        novemberizing.dom.gen("sub", { className: "px-2", style: { fontSize: ".7rem", fontWeight: "normal" }}, [
                            "if you re-open control bar click",
                            novemberizing.fontawesome.gen("fa-solid fa-list ps-1")
                        ]),
                        novemberizing.dom.gen("button", { onClick: e => novemberizing.hide(controller), className: "btn btn-link", style: { fontWeight: "bold", fontSize: '1rem' }}, [
                            novemberizing.fontawesome.gen("fa-solid fa-circle-xmark")
                        ])
                    ]),
                ]));

                novemberizing.show("novemberizing-static-controller");
            },
            off: async () => {
                novemberizing.hide("novemberizing-static-controller");
            }
        },
        link: {
            on: async link => {
                novemberizing.show(document.querySelectorAll(".nav-item.novemberizing.static.link"));
            },
            off: async () => {
                novemberizing.hide(document.querySelectorAll(".nav-item.novemberizing.static.link"));
            }
        },
        adjust: (dom, link) => {
            for(const node of dom.children) {
                if(node.tagName) {
                    if(node.hasAttribute("href")) {
                        const href = node.getAttribute("href");
                        if(!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("/") && !href.startsWith("\{\{") && !href.startsWith("#") && href!=="") {
                            node.setAttribute("href", `${link}${href}`);
                        }
                        novemberizing.static.adjust(node, link);
                        continue;
                    } else if(node.hasAttribute("src")) {
                        const src = node.getAttribute("src");
                        if(!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("/") && !src.startsWith("\{\{") && !src.startsWith("#") && src!=="") {
                            node.setAttribute("src", `${link}${src}`);
                        }
                        novemberizing.static.adjust(node, link);
                        continue;
                    }

                    const image = node.style.backgroundImage;
                    if(image) {
                        if(!image.startsWith("url(\"http://") && !image.startsWith("url(\"https://") && !image.startsWith("url(\"/") && !image.startsWith("url(\"\{\{") && !image.startsWith("#") && image!=="url(\"") {
                            node.style["backgroundImage"] = `url(\"${link}${image.substring(5)}`;
                        }
                    }
                }
                novemberizing.static.adjust(node, link);
            }
            return dom;
        },
        dom: async url => {
            const res = await fetch(`${url}/`);
            const text = await res.text();
            const parser = new DOMParser();

            return parser.parseFromString(text, "text/html");
        },
        config: async (url) => {
            const res = await fetch(url);
            const json = await res.json();

            function deserialize(o) {
                const keys = Object.keys(o);
                for(let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const obj = o[key];

                    if(typeof obj === "string") {
                        if(obj.startsWith("|") && obj.endsWith("|")) {
                            const pattern = /[^\\(=?\|)]\||^\|/;
                            const fields = obj.split(pattern)
                                              .map(v => v.trim());
                            
                            o[key] = fields[1].replace(/\\\|/g, "|");
                                                  
                            continue;
                        }
                    } else if(typeof obj=== "object") {
                        if(obj === null) {
                            throw new Error('');
                            continue;
                        }
                        o[keys[i]] = deserialize(o[keys[i]]);
                    } else {
                        // throw new Error('');
                    }
                }
                return o;
            }

            const o = deserialize(JSON.parse(JSON.stringify(json)));

            return { json, o };
        },
        onResizeBody: e => {
            const frame = document.getElementById("novemberizing-static-view");
            // TODO: 크기가 줄어 들 때, 그 크기가 커진 상태에서 줄어들지 않는다.
            const rect = frame.contentWindow.document.body.querySelector("footer").getBoundingClientRect(); 
            frame.height = parseInt(rect.y + rect.height);
            
        },
        on: async link => {
            const { config } = await novemberizing.static.view.on(link);
            await novemberizing.static.controller.on(link, config.json);
            await novemberizing.static.link.on(link);
        },
        off: async () => {
            await novemberizing.static.view.off();
            await novemberizing.static.controller.off();
            await novemberizing.static.link.off();
        }
    }
}