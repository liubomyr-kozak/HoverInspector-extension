import {isValid} from "@entrypoints/shared/utils/isValid.ts";

export const formatBoxShorthand = (prefix, styles, convert, showRaw) => {
    const keys = ["top", "right", "bottom", "left"].map(pos => `${prefix}-${pos}`);

    const values = keys.map(k => styles[k]);

    keys.forEach(k => delete styles[k]);

    if (!values.some(isValid)) return [];

    const converted = values.map(v => convert(isValid(v) ? v : "0"));

    const shorthand = (() => {
        const [t, r, b, l] = converted;
        if (converted.every(v => v === t)) return `${prefix}: ${t}`;
        if (t === b && r === l) return `${prefix}: ${t} ${r}`;
        if (r === l) return `${prefix}: ${t} ${r} ${b}`;
        
        return `${prefix}: ${converted.join(" ")}`;
    })();

    const result = [{type: "shorthand", value: shorthand, prop: prefix}];


    if (showRaw) {
        result.push(...["top", "right", "bottom", "left"].map((pos, i) => ({
            type: "detail",
            value: `${prefix}-${pos}: ${converted[i]}`,
            prop: prefix
        })));
    }

    return result;
};