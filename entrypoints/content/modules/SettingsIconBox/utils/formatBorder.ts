import { isValid } from "@entrypoints/shared/utils/isValid.ts";

export const formatBorder = (styles, convert, showRaw) => {
  const sides = ["top", "right", "bottom", "left"];
  const base = {
    width: styles["border-top-width"],
    style: styles["border-top-style"],
    color: styles["border-top-color"],
  };

  const allSame = sides.every(
    (side) =>
      styles[`border-${side}-width`] === base.width &&
      styles[`border-${side}-style`] === base.style &&
      styles[`border-${side}-color`] === base.color,
  );

  if (!isValid(base.width)) return [];

  const sideValue = (side) => {
    const width = styles[`border-${side}-width`];
    const style = styles[`border-${side}-style`];
    return style === "none" || style === "hidden" || parseFloat(width) === 0
      ? "none"
      : `${convert(width)} ${style} ${styles[`border-${side}-color`]}`;
  };

  // Sides differ (e.g. only a bottom border): one line per side instead of dropping them all
  if (!allSame) {
    const lines = sides.map((side) => ({ type: "line", value: `border-${side}: ${sideValue(side)}` }));
    sides.forEach((side) => {
      delete styles[`border-${side}-width`];
      delete styles[`border-${side}-style`];
      delete styles[`border-${side}-color`];
    });
    return lines;
  }

  sides.forEach((side) => {
    delete styles[`border-${side}-width`];
    delete styles[`border-${side}-style`];
    delete styles[`border-${side}-color`];
  });

  // No visible border: "border: none" says it without the meaningless width and colour
  const isNone = base.style === "none" || base.style === "hidden" || parseFloat(base.width) === 0;
  const shorthandValue = isNone ? "none" : `${convert(base.width)} ${base.style} ${base.color}`;

  // Lines carry no trailing ";" - the output format adds its own terminator
  const result = [{ type: "shorthand", value: `border: ${shorthandValue}`, prop: "border" }];

  if (showRaw) {
    result.push(
      ...sides.map((side) => ({
        type: "detail",
        value: `border-${side}: ${shorthandValue}`,
        prop: "border",
      })),
    );
  }

  return result;
};
