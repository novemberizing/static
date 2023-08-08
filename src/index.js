import Bootstrap from "./Bootstrap.js";
import Fontawesome from "./Fontawesome.js";
import Static from "./Static.js";
import Dom from "./Dom.js";
import Novemberizing from "./Novemberizing.js";

const novemberizing = Object.assign(Novemberizing, {
    static: Static,
    bootstrap: Bootstrap,
    fontawesome: Fontawesome,
    dom: Dom,
    
});

export default novemberizing;
