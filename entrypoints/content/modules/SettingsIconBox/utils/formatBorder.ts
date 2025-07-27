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

  if (!allSame || !isValid(base.width)) return [];

  sides.forEach((side) => {
    delete styles[`border-${side}-width`];
    delete styles[`border-${side}-style`];
    delete styles[`border-${side}-color`];
  });

  const result = [
    { type: "shorthand", value: `border: ${convert(base.width)} ${base.style} ${base.color};`, prop: "border" },
  ];

  if (showRaw) {
    result.push(
      ...sides.map((side) => ({
        type: "detail",
        value:
          `border-${side}-width: ${convert(base.width)}; ` +
          `border-${side}-style: ${base.style}; ` +
          `border-${side}-color: ${base.color};`,
        prop: "border",
      })),
    );
  }

  return result;
};
