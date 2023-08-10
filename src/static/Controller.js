import Dom from "../Dom.js";

const novemberizing = {
    dom: Dom
};

export default class Controller {
    static #id = "novemberizing-static-controller";

    static #pad = 5;
    static #theme = null;
    static #frame = null;

    static #itemGen(item) {
        if(novemberizing.dom.is.primitive(item) || novemberizing.dom.is.primitive(item._value)) {
            return {
                type: "primitive",
                dom: item._node,
                value: novemberizing.dom.is.primitive(item) ? item : item._value
            };
        } else if(novemberizing.dom.is.array(item)) {
            return {
                type: "array",
                dom: item._node,
                value: item
            }
        } else if(item !== null) {
            return {
                type: "object",
                dom: item._node,
                value: item
            }
        } else {
            console.log(item);
            throw new Error();      // Check This
        }
    }

    static #toggle(e) {
        let node = e.target;
        while(node && (node.nodeType !== node.ELEMENT_NODE || node.nodeName.toLowerCase() !== "div" || !node.classList.contains("row"))) {
            node = node.parentNode;
        }

        const i = node.querySelector(".fontawesome");
        if(i.classList.contains("fa-folder-open")) {
            if(i.classList.contains("fa-regular")) {
                i.classList.replace("fa-regular", "fa-solid");
            } else if(i.classList.contains("fa-solid")) {
                i.classList.replace("fa-solid", "fa-regular");
            }
        } else if(i.classList.contains("fa-clone")) {
            if(i.classList.contains("fa-regular")) {
                i.classList.replace("fa-regular", "fa-solid");
            } else if(i.classList.contains("fa-solid")) {
                i.classList.replace("fa-solid", "fa-regular");
            }
        }

        node = node.nextSibling;
        novemberizing.dom.toggle(node);
    }

    static #focus(e, item) {
        // TODO
    }
    
    static #change(e, item) {
        const dom = item.dom;
        if(dom) {
            for(const o of dom) {
                const node = o.node;
                if(node.nodeType === node.TEXT_NODE) {
                    // 수정을 하면 ...
                    node.parentNode.style.overflowWrap = "break-word";
                    node.nodeValue = e.target.value.replace(/ /g, "\u00A0");
                } else if(node.nodeType !== node.COMMENT_NODE) {
                    const type = o.type;
                    // TODO: 링크를 찾고 링크면 변경한다.
                    if(type.startsWith("attr")) {
                        if(type === "attr") {
                            node.setAttribute(o.attr, e.target.value);
                        } else if(type === "attr:sub") {
                            const value = item.value;
                            const attr = node.getAttribute(o.attr);
                            const i = attr.indexOf(value);
                            const v = (attr.substring(0, i) + e.target.value + attr.substring(i + value.length));
                            item.value = v;
                            node.setAttribute(o.attr, v);
                        }
                    } else {
                        console.log(o);
                        throw new Error();
                    }
                }
            }
        } else {
            console.log(e, item);
            throw new Error();
        }
    }

    static #objectGen(key, item, depth) {
        return novemberizing.dom.gen("div", { className: "row" }, [
            novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${(depth + 1) * Controller.#pad}px` } }, [
                novemberizing.dom.gen("button", { onClick: Controller.#toggle, type: "button", className: "btn btn-link"}, [
                    novemberizing.dom.gen("i", { className: "fontawesome fa-regular fa-folder-open fa-xs me-1" }),
                    key
                ])
            ]),
            novemberizing.dom.gen("div", { className: "col-6" })
        ]);
    }

    static #primitiveGen(key, item, depth) {
        let icon = null;
        let value = null;
        if(typeof item.value === "string") {
            icon = novemberizing.dom.gen("i", { className: "fa-solid fa-font fa-xs me-1"});
            value = novemberizing.dom.gen("input", { onFocus: e => Controller.#focus(e, item), onChange: e => Controller.#change(e, item), onKeyUp: e => Controller.#change(e, item), className: "form-control text-truncate", value: item.value })
        } else if(typeof item.value === "number") {
            icon = novemberizing.dom.gen("i", { className: "fa-solid fa-arrow-up-1-9 fa-xs me-1"});
            value = novemberizing.dom.gen("input", { onFocus: e => Controller.#focus(e, item), onChange: e => Controller.#change(e, item), onKeyUp: e => Controller.#change(e, item), className: "form-control text-truncate", value: item.value })
        } else if(typeof item.value === "boolean") {
            icon = novemberizing.dom.gen("i", { className: "fa-solid fa-list-ol fa-xs me-1"});
            value = novemberizing.dom.gen("input", { onFocus: e => Controller.#focus(e, item), onChange: e => Controller.#change(e, item), onKeyUp: e => Controller.#change(e, item), className: "form-control text-truncate", value: item.value })
        } else {
            throw new Error();
        }
        return novemberizing.dom.gen("div", { className: "row" }, [
            novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${(depth + 1) * Controller.#pad}px` } }, [
                icon,
                key
            ]),
            novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, value)
        ]);
    }

    static #arrayItemGen(key, item, index, depth) {
        if(novemberizing.dom.is.primitive(item) || novemberizing.dom.is.primitive(item._value)) {
            return novemberizing.dom.gen("div", { className: "row" }, [
                novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${(depth + 1) * Controller.#pad}px` } }, [
                    novemberizing.dom.gen("i", { className:  "fontawesome fa-solid fa-clone fa-xs me-1" }),
                    key,
                    novemberizing.dom.gen("sup", {}, `${index}`)
                ]),
                novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, novemberizing.dom.is.primitive(item) ? item : item._value)
            ]);
        } else {
            return novemberizing.dom.gen("div", { className: "row" }, [
                novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${(depth + 1) * Controller.#pad}px` } }, [
                    novemberizing.dom.gen("button", { onClick: Controller.#toggle, type: "button", className: "btn btn-link" }, [
                        novemberizing.dom.gen("i", { className:  "fontawesome fa-solid fa-clone fa-xs me-1" }),
                        key,
                        novemberizing.dom.gen("sup", {}, `${index}`)
                    ])
                ]),
                novemberizing.dom.gen("div", { className: "col-6 text-truncate" })
            ]);
        }
    }

    static #arrayGen(key, item, depth) {
        return novemberizing.dom.gen("div", { className: "row" }, [
            novemberizing.dom.gen("div", { className: "col-6", style: { paddingLeft: `${(depth + 1) * Controller.#pad}px` } }, [
                novemberizing.dom.gen("button", { onClick: Controller.#toggle, type: "button", className: "btn btn-link" }, [
                    novemberizing.dom.gen("i", { className: "fontawesome fa-regular fa-folder-open fa-xs me-1" }),
                    key
                ])
            ])
        ]);


    }

    static #on(parent, config, depth = 0) {
        if(typeof config === "object") {
            if(config === null) throw new Error();                          // Invalid Format
            if(novemberizing.dom.is.array(config)) throw new Error();       // Invalid Format
            
            for(const key of Object.keys(config)) {
                if(key.startsWith("_")) continue;
                const item = Controller.#itemGen(config[key]);

                if(item.type === "primitive") {
                    parent.appendChild(Controller.#primitiveGen(key, item, depth));
                } else if(item.type === "object") {
                    parent.appendChild(Controller.#objectGen(key, item, depth));
                    const col = parent.appendChild(novemberizing.dom.gen("div", { className: "row" }))
                                      .appendChild(novemberizing.dom.gen("div", { className: "col" }));
                    Controller.#on(col, item.value, depth + 1);
                } else if(item.type === "array") {
                    if(item.value.length === 0) throw new Error();      // Invalid Format
                    if(!item.value[0]._node)    throw new Error();      // Invalid Format

                    parent.appendChild(Controller.#arrayGen(key, item.value, depth + 1));
                    const col = parent.appendChild(novemberizing.dom.gen("div", { className: "row" }))
                                    .appendChild(novemberizing.dom.gen("div", { className: "col" }));
                    
                    for(let i = 1; i < item.value.length; i++) {
                        if(novemberizing.dom.is.primitive(item.value[i]) || novemberizing.dom.is.primitive(item.value[i]._value)) {
                            col.appendChild(Controller.#arrayItemGen(key, item.value[i], i, depth + 2));
                        } else if(novemberizing.dom.is.array(item.value[i])) {
                            throw new Error();                      // Check This
                        } else {
                            col.appendChild(Controller.#arrayItemGen(key, item.value[i], i, depth + 2));
                            const o = col.appendChild(novemberizing.dom.gen("div", { className: "row" }))
                                         .appendChild(novemberizing.dom.gen("div", { className: "col" }));
                            Controller.#on(o, item.value[i], depth + 3);
                        }
                    }
                }
            }
        } else {
            throw new Error();      // Invalid Format
        }
    }

    static on(config, name, frame) {
        const controller = document.getElementById(Controller.#id);
        Controller.#theme = name;
        Controller.#frame = frame;

        // FIELD 
        controller.appendChild(novemberizing.dom.gen("div", { className: "row" }, 
            novemberizing.dom.gen("div", { className: "col" }, [
                novemberizing.dom.gen("div", { className: "row title" }, [
                    novemberizing.dom.gen("div", { className: "col-6 text-center fw-bold"}, "Key"),
                    novemberizing.dom.gen("div", { className: "col-6 text-center fw-bold"}, "Value")
                ])
            ])
        ));

        const parent = controller.appendChild(novemberizing.dom.gen("div", { className: "row" }))
                                 .appendChild(novemberizing.dom.gen("div", { className: "col", style: { maxHeight: '300px', overflowY: 'auto' } }));

        Controller.#on(parent, config);

        novemberizing.dom.show(controller);
    }
}