export const toSelector = (el) => {
    const id = el.getAttribute("id");
    const className = (el.getAttribute("class") || "").trim();
    if (id) return `#${id}`;
    if (className) return `.${className.split(/\s+/)[0]}`;
    return el.tagName.toLowerCase();
};
