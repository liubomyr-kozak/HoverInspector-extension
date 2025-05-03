export const minifyHex = (color) => {
    if (/^#([a-f0-9]{6})$/i.test(color)) {
        const [r, g, b] = [1, 3, 5].map((i) => color[i] === color[i + 1]);
        if (r && g && b) return `#${color[1]}${color[3]}${color[5]}`;
    }
    return color;
};
