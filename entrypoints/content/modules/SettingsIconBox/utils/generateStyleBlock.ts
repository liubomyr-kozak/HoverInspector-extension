import { toSelector } from "@entrypoints/shared/utils/toSelector.ts";
import { camelCase } from "@entrypoints/shared/utils/camelCase.ts";

// Section comments ("/* Box Model */") are not declarations: they get no ";" and, in a JS object, become // comments
const isComment = (line) => line.type === "comment";
const commentText = (value: string) => value.replace(/^\s*\/\*\s*|\s*\*\/\s*$/g, "");

export const generateStyleBlock = (el, lines, format) => {
  const selector = toSelector(el);
  const cleanName = selector.replace(/^[.#]/, "");
  // "edge-r" / "card_title" / "2col" -> a valid component identifier: StyledEdgeR, StyledCardTitle, Styled2col
  const componentName =
    "Styled" +
    cleanName
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  // const baseIndent = (format === "sass") ? "  " : "  ";
  const baseIndent = "";

  switch (format) {
    case "styled-literal":
      return [
        {
          type: "wrapper",
          value: `const ${componentName} = styled.${el.tagName.toLowerCase()}\``,
        },
        ...lines.map(({ value, ...other }) =>
          isComment(other) ? { ...other, value: `  /* ${commentText(value)} */` } : { ...other, value: `  ${value};` },
        ),
        { type: "wrapper", value: "`;" },
      ];

    case "styled-object": {
      const objEntries = lines.map(({ value, ...other }) => {
        if (isComment(other)) return { ...other, value: `  // ${commentText(value)}` };
        const [key, ...rest] = value.split(":");
        const prop = camelCase(key.trim());
        const newValue = rest.join(":").replace(/;$/, "").trim();

        return { ...other, value: `  ${prop}: "${newValue}",` };
      });

      return [
        {
          type: "wrapper",
          value: `const ${componentName} = styled.${el.tagName.toLowerCase()}({`,
        },
        ...objEntries,
        { type: "wrapper", value: "});" },
      ];
    }
    case "scss":
      return [
        { type: "wrapper", value: `${selector} {` },
        ...lines.map(({ value, ...other }) => ({ ...other, value: isComment(other) ? value : `${baseIndent}${value};` })),
        { type: "wrapper", value: "}" },
      ];
    case "sass":
      return [
        { type: "wrapper", value: `${selector}` },
        ...lines.map(({ value, ...other }) => ({
          ...other,
          // Indented syntax: declarations are nested under the selector and have no ";"
          value: isComment(other) ? `  // ${commentText(value)}` : `  ${value.replace(/;$/, "")}`,
        })),
      ];
    case "css":
    default:
      return [
        { type: "wrapper", value: `${selector} {` },
        ...lines.map(({ value, ...other }) => ({ ...other, value: isComment(other) ? value : `${baseIndent}${value};` })),
        { type: "wrapper", value: "}" },
      ];
  }
};