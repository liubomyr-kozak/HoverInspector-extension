import { toSelector } from "@entrypoints/shared/utils/toSelector.ts";
import { camelCase } from "@entrypoints/shared/utils/camelCase.ts";

export const generateStyleBlock = (el, lines, format) => {
  const selector = toSelector(el);
  const cleanName = selector.replace(/^[.#]/, "");
  // const baseIndent = (format === "sass") ? "  " : "  ";
  const baseIndent = "";

  switch (format) {
    case "styled-literal":
      return [
        {
          type: "wrapper",
          value: `const Styled${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} = styled.${el.tagName.toLowerCase()}\``,
        },
        ...lines.map(({ value, ...other }) => ({ ...other, value: `  ${value};` })),
        { type: "wrapper", value: "`;" },
      ];

    case "styled-object": {
      const objEntries = lines.map(({ value, ...other }) => {
        const [key, ...rest] = value.split(":");
        const prop = camelCase(key.trim());
        const newValue = rest.join(":").replace(/;$/, "").trim();

        return { ...other, value: `  ${prop}: "${newValue}",` };
      });

      return [
        {
          type: "wrapper",
          value: `const Styled${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} = styled.${el.tagName.toLowerCase()}({`,
        },
        ...objEntries,
        { type: "wrapper", value: "});" },
      ];
    }
    case "scss":
      return [
        { type: "wrapper", value: `${selector} {` },
        ...lines.map(({ value, ...other }) => ({ ...other, value: `${baseIndent}${value};` })),
        { type: "wrapper", value: "}" },
      ];
    case "sass":
      return [
        { type: "wrapper", value: `${selector}` },
        ...lines.map(({ value, ...other }) => ({
          ...other,
          value: `${baseIndent}${value.replace(/;$/, "")}`,
        })),
      ];
    case "css":
    default:
      return [
        { type: "wrapper", value: `${selector} {` },
        ...lines.map(({ value, ...other }) => ({ ...other, value: `${baseIndent}${value};` })),
        { type: "wrapper", value: "}" },
      ];
  }
};