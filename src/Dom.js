import xmldom from "@xmldom/xmldom";
import Is from "./dom/Is.js"

export default class Dom {
    static is = Is;

    static #parser = typeof DOMParser === "undefined" ? new xmldom.DOMParser() : new DOMParser();
    static #serializer = typeof XMLSerializer === "undefined" ? new xmldom.XMLSerializer() : new XMLSerializer();

    static show(o) {
        if(typeof o === "string") o = document.getElementById(o);

        if(o.classList.contains("hide")) {
            o.classList.replace("hide", "show")
        } else {
            o.classList.add("show");
        }
    }

    static hide(o) {
        if(typeof o === "string") o = document.getElementById(o);
        if(o.classList.contains("show")) {
            o.classList.replace("show", "hide")
        } else {
            o.classList.add("hide");
        }
    }

    static toggle(o) {
        if(typeof o === "string") o = document.getElementById(o);
        if(o.classList.contains("show")) {
            o.classList.replace("show", "hide")
        } else if(o.classList.contains("hide")) {
            o.classList.replace("hide", "show")
        } else {
            o.classList.add("hide");
        }
    }

    static gen(tag, properties, children) {
        // 1. CREATE ELEMENT
        const element = document.createElement(tag);
        // 2. SET ATTRIBUTES
        for(const key of Object.keys(properties)) {
            if(key.startsWith("on")) {
                const action = key.substring(2).toLowerCase();
                element.addEventListener(action, properties[key]);
            } else if(key.startsWith("data-") || key.startsWith("aria-")) {
                element.setAttribute(key, properties[key]);
            } else if(key === "style") {
                for(const styleKey of (properties[key] ? Object.keys(properties[key]) : [])) {
                    element.style[styleKey] = properties[key][styleKey];
                }
            } else {
                element[key] = properties[key];
            }
        }
        // 3. APPEND CHILD
        if(children) {
            // 3.1. ARRAYIZE
            if(!Array.isArray(children)) children = [ children ];
            // 3.2 APPENd CHILDREN
            for(const child of children) {
                if(child !== null && child !==  undefined) {
                    if(typeof child === "string") {
                        element.appendChild(document.createTextNode(child));
                    } else {
                        element.appendChild(child);
                    }
                }
            }
        }
        return element;
    }
    static show(element) {
        if(typeof element === "string") element = document.getElementById(element);
        if(element.classList.contains("hide")) {
            element.classList.replace("hide", "show");
        } else {
            element.classList.add("show");
        }
    }
    static hide(element) {
        if(typeof element === "string") element = document.getElementById(element);
        if(element.classList.contains("show")) {
            element.classList.replace("show", "hide");
        } else {
            element.classList.add("hide");
        }
    }
    static move(addr) {
        location.href = addr;
    }

    static #reservedKeys = "#^/<&.";
    static #config(config, context, key) {


        return { accumulator, last };
    }
    static #parse(s, start, config, context) {
        const escape = s[start + 2] === "{" ? 1 : 0;
        const end = s.indexOf(escape ? "}}}" : "}}", start + 2 + escape);
        if(end === -1) throw new Error();       // Invalid Format
        let key = s.substring(start + 2 + escape, end).trim();
        if(key.length === 0) throw new Error(); // Invalid Format
        const type = Dom.#reservedKeys.includes(key[0]) ? key[0] : '';
        key = Dom.#reservedKeys.includes(key[0]) ? key.substring(1) : key;
        if(type === '.' && key.length > 0) throw new Error();   // Invalid Format

        let accumulator = undefined;
        let last = undefined;
        const array = key ? context.concat(key) : context.concat();
        if(type === '' || type === '.' || type === '#' || type === '^') {
            do {
                last = undefined;
                accumulator = config;
                const depth = array.reduce((accumulator, current) => accumulator.concat(current.split('.')), []);

                for(let i = 0; i < depth.length; i++) {
                    if(typeof accumulator[depth[i]] !== 'undefined' && accumulator[depth[i]] !== null) {
                        if(i + 1 === depth.length) {
                            last = depth[i];
                            break;
                        }
                        accumulator = accumulator[depth[i]];
                        continue;
                    }
                    accumulator = accumulator[depth[i]];
                    break;
                }
                if(accumulator !== undefined && accumulator !== null) break;
                array.shift();
            } while(array.length > 0);

            if(accumulator === undefined || accumulator === null) {
                const array = (key ? context.concat(key) : context.concat());
                const depth = array.reduce((accumulator, current) => accumulator.concat(current.split('.')), []);
                last = depth.pop();
                accumulator = depth.reduce((accumulator, current) => accumulator = (accumulator ? accumulator[current] : {}), config);
                accumulator[last] = false;
            }

            if(type === '#' || type === '^') {
                context.push(key);
            }
        } else if(type === '/') {
            context.pop();
        } else {
            throw new Error();
        }

        return { end: end + 2 + escape, escape, key, type, accumulator, last, array };
    }

    static #value(accumulator, last) {
        if(typeof accumulator[last] === "string" || typeof accumulator[last] === "boolean" || typeof accumulator[last] === "number" || accumulator[last] === null || accumulator[last] === undefined) {
            return accumulator[last];
        } else if(Array.isArray(accumulator[last])) {
            if(accumulator[last].length === 0) return accumulator[last];
            if(accumulator[last][0]._node) {
                return accumulator[last][0]._value;
            }
            return accumulator[last];
        } else if(typeof accumulator[last] === "object") {
            if(accumulator[last]._node) {
                return accumulator[last]._value;
            }
            return accumulator[last];
        } else {
            throw new Error();
        }
    }
    static #reconfig(accumulator, last, n, value = null, type = "text", attr = null) {
        if(typeof accumulator[last] === "string" || typeof accumulator[last] === "boolean" || typeof accumulator[last] === "number" || accumulator[last] === null || accumulator[last] === undefined) {
            accumulator[last] = {
                _node: [ { node: n, type, attr } ],
                _value: value
            };
        } else if(Array.isArray(accumulator[last])) {
            if(accumulator[last].length === 0 || !accumulator[last]._node) {
                accumulator[last].unshift({
                    _node: [ { node: n, type, attr } ],
                    _value: accumulator[last]
                });
            } else {
                accumulator[last]._node.push({ node: n, type, attr });
            }
        } else if(typeof accumulator[last] === "object") {
            if(accumulator[last]._node) {
                accumulator[last]._node.push({ node: n, type, attr });
            } else {
                accumulator[last]._node = [ { node: n, type, attr } ];
                accumulator[last]._value = value;
            }
        } else {
            throw new Error();
        }
    }
    static #render(document, node, parent, config, context = [], condition = [], theme = undefined) {
        if(node.nodeType === node.TEXT_NODE || node.nodeType === node.COMMENT_NODE) {
            const s = Dom.#serializer.serializeToString(node.cloneNode(false));
            let begin = 0;
            let start = 0;
            const elements = [];
            while((start = s.indexOf("{{", begin)) !== -1) {
                if(begin !== start) elements.push(document.createTextNode(s.substring(begin, start)));
                const { end, key, type, accumulator, last, array, escape } = Dom.#parse(s, start, config, context);
                if(type === '' || type === '.') {
                    // TODO: RECONFIG
                    if(accumulator[last] === null || accumulator[last] === undefined) throw new Error();
                    const value = Dom.#value(accumulator, last);
                    const n = (typeof value === "boolean" ? document.createTextNode('') : document.createTextNode(value));
                    elements.push(n);
                    Dom.#reconfig(accumulator, last, n, value, "text");
                } else {
                    if(type === '#' || type === '^') {
                        if(accumulator[last] === null || accumulator[last] === undefined) throw new Error();
                        const value = Dom.#value(accumulator, last);
                        const n = document.createComment(` ${type}${key} `);
                        elements.push(n);
                        Dom.#reconfig(accumulator, last, n, value, "comment");
                        condition.push({accumulator, last, node: n});
                    } else if(type === '/') {
                        const n = document.createComment(` ${type}${key} `);
                        if(condition.length === 0) throw new Error();   // Invalid Format
                        const open = condition.pop();
                        let child = open.node;
                        let children = [];
                        while(child = child.nextSibling) {
                            if(child.nodeValue) {
                                const v = child.nodeValue.trim();
                                const k = v.startsWith("{{{") ? v.substring(3, v.indexOf("}}}")).trim() : v.substring(2, v.indexOf("}}")).trim().substring(1);
                                
                                if(v.startsWith("{{") && k === key) break;
                            }
                            children.push(child.cloneNode(true));
                        }
                        if(typeof open.accumulator[open.last] === "object") {
                            if(Array.isArray(open.accumulator[open.last])) {
                                open.accumulator[open.last][0]._chlidren = children;
                                const value = open.accumulator[open.last][0]._value;
                                context.push(key);
                                for(let i = 1; i < value.length; i++) {
                                    children.forEach(clone => {
                                        context.push(`${i}`);
                                        elements.push(Dom.#render(document, clone.cloneNode(true), parent, config, context, [], theme));
                                        context.pop();
                                    });
                                }
                                context.pop();

                                while(node.previousSibling) {
                                    if(node.previousSibling.nodeValue) {
                                        const v = node.previousSibling.nodeValue.trim();
                                        if(v === `#${key}` || v === `^${key}`) {
                                            break;
                                        }
                                    }
                                    node.parentNode.removeChild(node.previousSibling);
                                }
                            } else {
                                open.accumulator[open.last]._children = children;
                                if(open.accumulator[open.last]._value === false) {
                                    while(node.previousSibling) {
                                        if(node.previousSibling.nodeValue) {
                                            const v = node.previousSibling.nodeValue.trim();
                                            if(v === `#${key}` || v === `^${key}`) {
                                                break;
                                            }
                                        }
                                        node.parentNode.removeChild(node.previousSibling);
                                    }
                                }
                            }
                        } else {
                            throw new Error();
                        }
                        elements.push(n);
                    } else {
                        throw new Error();  // Not supported
                    }
                }
                begin = end;
            }
            if(elements.length > 0) {
                if(begin !== s.length) elements.push(document.createTextNode(s.substring(begin)));
                elements.forEach(element => parent.insertBefore(element, node));
                parent.removeChild(node);
                node = elements[elements.length - 1];
            }
        } else if(node.nodeType === node.ELEMENT_NODE) {
            for(let i = 0; i < node.attributes.length; i++) {
                const attribute = node.attributes[i];
                const value = attribute.value.trim();
                
                if(value.startsWith("{{") && value.endsWith("}}")) {
                    const { end, key, type, accumulator, last, array } = Dom.#parse(value, 0, config, context);
                    if(type === '' || type === '.') {
                        // TODO: RECONFIG
                        if(accumulator[last] === null || accumulator[last] === undefined) throw new Error();

                        if(Array.isArray(accumulator)) {
                            if(accumulator.length === 0 || !accumulator[0]._node) {
                                throw new Error();
                            }
                            if(isNaN(parseInt(context[context.length - 1]))) {
                                continue;
                            }
                        }
                        const value = Dom.#value(accumulator, last);
                        attribute.value = attribute.nodeValue = Dom.#value(accumulator, last);

                        Dom.#reconfig(accumulator, last, node, value, "attr", attribute.name);
                    } else {
                        throw new Error();  // Not support
                    }
                } else {
                    let begin = 0;
                    let start = 0;
                    const s = value;
                    const elements = [];
                    while((start = s.indexOf("{{", begin)) !== -1) {
                        if(begin !== start) elements.push(s.substring(begin, start));
                        const { end, key, type, accumulator, last, array } = Dom.#parse(s, start, config, context);
                        if(type === '' || type === '.') {
                            if(accumulator[last] === null || accumulator[last] === undefined) throw new Error();

                            if(Array.isArray(accumulator)) {
                                if(accumulator.length === 0 || !accumulator[0]._node) {
                                    throw new Error();
                                }
                                if(isNaN(parseInt(context[context.length - 1]))) {
                                    elements.length = 0;
                                    break;
                                }
                            }

                            const value = Dom.#value(accumulator, last);
                            elements.push(value);
                            Dom.#reconfig(accumulator, last, node, value, "attr:sub", attribute.name);
                        } else {
                            throw new Error();  // Unsupported
                        }
                        begin = end;
                    }
                    
                    if(elements.length > 0) {
                        if(begin !== s.length) elements.push(s.substring(begin));
                        attribute.value = elements.join("");
                    }
                }
                // TODO: RELATIVE ADDR
                if(theme) {
                    if(attribute.name === "href" || attribute.name === "src") {
                        const value = attribute.value;
                        if(!value.startsWith("http") && !value.startsWith("/") && !value.startsWith("#")) {
                            if(!value.startsWith("{{")) {
                                attribute.value = attribute.nodeValue = theme + "/" + value;
                            }
                        }
                    } else if(attribute.name === "style") {
                        const start = attribute.value.indexOf("url(\"");
                        if(start !== -1) {
                            const end = attribute.value.indexOf("\")", start + 5);
                            if(end === -1) throw new Error();
                            const values = [ attribute.value.substring(0, start) ];
                            values.push("url(\"" + theme + '/' + attribute.value.substring(start + 5, end));
                            values.push(attribute.value.substring(end));
                            attribute.value = attribute.nodeValue = values.join("");
                        }
                    }
                }
            }
        } else {
            if(node.nodeType === node.DOCUMENT_NODE || node.nodeType === node.DOCUMENT_TYPE_NODE) {
                // SKIP
            } else {
                throw new Error();
            }
        }

        const o = condition.length > 0 ? condition[condition.length - 1] : null
        if(o === null || Array.isArray(o.accumulator[o.last]) === false) {
            if(node && node.childNodes) {
                for(let child = node.firstChild; child ; child = child.nextSibling) {
                    child = Dom.#render(document, child, node, config, context, condition, theme);
                }
            }
        }
        return node;
    }
    static render(text, config, theme = undefined, doc = typeof document !== "undefined" ? document : undefined) {
        const dom = Dom.#parser.parseFromString(text, "text/html");
        const context = [];
        const condition = [];
        doc = doc || dom;
        const output = Dom.#render(doc, dom, null, config, context, condition, theme);
        if(condition.length !== 0) throw new Error();

        return { dom: output, html: Dom.#serializer.serializeToString(output) };
    }
}
