const roundTo = (n: number, digits: number) => String(Number(n.toFixed(digits)));

/**
 * Converts every px length in a CSS value to the requested unit ("12px 4.5px" -> "0.75rem 0.2813rem").
 * px values are rounded to two decimals so sub-pixel layout noise (71.578125px) stays readable.
 */
export const convertPx = (value, toUnit = "px", base = 16) => {
  if (typeof value !== "string" || !/px\b/.test(value)) return value;

  return value.replace(/(-?\d*\.?\d+)px\b/g, (_, num) => {
    const px = parseFloat(num);

    if (toUnit === "px") return `${roundTo(px, 2)}px`;
    if (px === 0) return `0${toUnit}`;

    return `${roundTo(px / (base || 16), 4)}${toUnit}`;
  });
};
