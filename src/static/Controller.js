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
        console.log(e);
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
        console.log(e, item);
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
                } else {
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
                        throw new Error();
                    }

                }
            }
        } else {
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




    // static #controllerOn(config) {
    //     const controller = document.getElementById(Static.#controller);

    //     novemberizing.show(controller);

    //     // FIELD 
    //     controller.appendChild(novemberizing.dom.gen("div", { className: "row" }, 
    //         novemberizing.dom.gen("div", { className: "col" }, [
    //             novemberizing.dom.gen("div", { className: "row title" }, [
    //                 novemberizing.dom.gen("div", { className: "col-6 text-center fw-bold"}, "Key"),
    //                 novemberizing.dom.gen("div", { className: "col-6 text-center fw-bold"}, "Value")
    //             ])
    //         ])
    //     ));
    //     let body = null;
    //     controller.appendChild(novemberizing.dom.gen("div", { className: "row" }, [
    //         body = novemberizing.dom.gen("div", { className: "col", style: { maxHeight: '300px', overflowY: 'auto' } }, [])
    //     ]));

    //     function isPrimitive(v){ return (typeof v === "string" || typeof v === "number" || typeof v === "boolean")}
    //     function onClick(e) {
    //         console.log(e);
    //         let node = e.target.parentNode.parentNode;
    //         console.log("begin", node);
    //         const depth = node.getAttribute("data-nov-depth");
    //         while((node = node.nextSibling) && node.getAttribute("data-nov-depth") !== depth) {
    //             if(node.classList.contains("")) {

    //             }
    //             console.log(node);
    //         }
    //     }
    //     function titleGen(key, type, depth, value, index = undefined) {
    //         if(type === "array") {
    //             return novemberizing.dom.gen("div", { "data-nov-depth": depth, className: "col-6", style: { paddingLeft: `${padding * (depth + 1 + (index !== undefined ? 1 : 0))}px`}}, [
    //                 novemberizing.dom.gen("button", { type: "button", className: "btn btn-link", onClick}, [
    //                     novemberizing.dom.gen("i", { className: 'fa-regular fa-folder-open fa-xs', style: { paddingRight: '5px' } }),
    //                     key,
    //                     index !== undefined ? novemberizing.dom.gen("sup", { style: { paddingLeft: '3px' } }, `${index}`) : null
    //                 ])
    //             ]);
    //         } else if(type === "primitive") {
    //             if(typeof value === "string") {
    //                 return novemberizing.dom.gen("div", { "data-nov-depth": depth, className: "col-6", style: { paddingLeft: `${padding * (depth + 1 + (index !== undefined ? 1 : 0))}px`}}, [
    //                     novemberizing.dom.gen("i", { className: 'fa-solid fa-font fa-xs', style: { paddingRight: '5px' } }),
    //                     key
    //                 ]);
    //             } else if(typeof value === "number") {
    //                 return novemberizing.dom.gen("div", { "data-nov-depth": depth, className: "col-6", style: { paddingLeft: `${padding * (depth + 1 + (index !== undefined ? 1 : 0))}px`}}, [
    //                     novemberizing.dom.gen("i", { className: 'fa-solid fa-arrow-up-1-9 fa-xs', style: { paddingRight: '5px' } }),
    //                     key
    //                 ]);
    //             } else if(typeof value === "boolean") {
    //                 return novemberizing.dom.gen("div", { "data-nov-depth": depth, className: "col-6", style: { paddingLeft: `${padding * (depth + 1 + (index !== undefined ? 1 : 0))}px`}}, [
    //                     novemberizing.dom.gen("i", { className: 'fa-solid fa-list-ol fa-xs', style: { paddingRight: '5px' } }),
    //                     key
    //                 ]);
    //             } else {
    //                 throw new Error();
    //             }

    //         } else if(type === "object") {
    //             return novemberizing.dom.gen("div", { "data-nov-depth": depth, className: "col-6", style: { paddingLeft: `${padding * (depth + 1 + (index !== undefined ? 1 : 0))}px`}}, [
    //                 novemberizing.dom.gen("button", { type: "button", className: "btn btn-link", onClick}, [
    //                     novemberizing.dom.gen("i", { className: 'fa-regular fa-folder-open fa-xs', style: { paddingRight: '5px' } }),
    //                     key
    //                 ])
    //             ]);
    //         } else {
    //             throw new Error();
    //         }

    //     }

    //     const padding = 5;
    //     function configGen(config, depth = 0) {
    //         if(typeof config === "object") {
    //             if(config === null) return;
    //             if(Array.isArray(config)) throw new Error();
    //             for(const key of Object.keys(config)) {
    //                 if(key.startsWith("_")) continue;
    //                 if(typeof config[key] === "object") {
    //                     if(Array.isArray(config[key])){
    //                         if(config[key].length === 0) throw new Error();;
    //                         for(let i = 1; i < config[key].length; i++) {
    //                             body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
    //                                 titleGen(key, "array", depth, null, i),
    //                                 novemberizing.dom.gen("div", { className: "col-6" }, '')
    //                             ]));
    //                             configGen(config[key][i], depth + 2);
    //                         }
    //                         continue;
    //                     }
    
    //                     const node = config[key]._node;
    //                     const value = config[key]._value;
    //                     const children = config[key]._children;
    
    //                     if(node) {
    //                         if(isPrimitive(value)) {
    //                             body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
    //                                 titleGen(key, "primitive", depth, value),
    //                                 novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, `${value}`)
    //                             ]));
    //                             continue;
    //                         } else {
    //                             if(typeof value === "object") {
    //                                 if(value === null) continue;
    //                                 if(Array.isArray(value)) throw new Error();
    //                                 body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
    //                                     titleGen(key, "object", depth, value),
    //                                     novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, '-')
    //                                 ]));
    //                                 configGen(value, depth + 1);
    //                                 continue;
    //                             }
    //                             throw new Error();
    //                         }
    //                     } else {
    //                         // CHECK THIS
    //                         body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
    //                             titleGen(key, "object", depth, config[key]),
    //                             novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, value)
    //                         ]));
    //                         configGen(config[key], depth + 1);
    //                         console.log(1, node, key, value, children, config[key]);
    //                         continue;
    //                     }
    //                 } else if(isPrimitive(config[key])) {
    //                     body.appendChild(novemberizing.dom.gen("div", { className: "row body" }, [
    //                         titleGen(key, "primitive", depth, config[key]),
    //                         novemberizing.dom.gen("div", { className: "col-6 text-truncate" }, `${config[key]}`)
    //                     ]));
    //                     continue;
    //                 } else {
    //                     throw new Error();  // ?
    //                 }
    //             }
    //         }
    //     }

    //     configGen(config);

    //     // novemberizing.show(controller);
    // }
}