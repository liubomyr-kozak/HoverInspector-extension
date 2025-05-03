export const isGradientValue = (val) =>
    typeof val === "string" && /gradient\(([^)]+)\)/i.test(val);
