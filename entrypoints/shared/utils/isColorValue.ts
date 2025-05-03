export const isColorValue = (val) =>
    typeof val === "string" &&
    (val.startsWith("#") || val.startsWith("rgb") || val.startsWith("hsl"));

