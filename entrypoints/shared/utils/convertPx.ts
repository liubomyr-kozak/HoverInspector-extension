export const convertPx = (value, toUnit = "px", base = 16) => {
    const match = /^([\d.]+)px$/.exec(value);

    if (!match) return value;

    const px = parseFloat(match[1]);

    if (toUnit === "px") return `${px}px`;

    const unitValue = (px / base).toFixed(4).replace(/\.?0+$/, "");

    return `${unitValue}${toUnit}`;
};