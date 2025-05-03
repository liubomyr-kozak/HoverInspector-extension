export const toSelector = (el) => {
    const id = el.getAttribute("id");
    const className = el.getAttribute("class");
    if (id) return `#${id}`;
    if (className) return `.${className.split(" ")[0]}`;
    return el.tagName.toLowerCase();
};
