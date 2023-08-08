
export default {
    move: o => location.href=o,
    show: o => {
        if(typeof o === "string") o = document.getElementById(o);

        if(o.classList.contains("hide")) {
            o.classList.replace("hide", "show")
        } else {
            o.classList.add("show");
        }
    },
    hide: o => console.log(o),
    toggle: o => console.log(o)
}