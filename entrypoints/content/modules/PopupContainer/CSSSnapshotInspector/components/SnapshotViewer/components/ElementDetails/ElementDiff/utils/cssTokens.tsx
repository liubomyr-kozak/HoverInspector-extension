import React, { useMemo } from "react";
import { isColorValue } from "@entrypoints/shared/utils/isColorValue.ts";
import { isGradientValue } from "@entrypoints/shared/utils/isGradientValue.ts";

type Token =
  | { type: "property"; value: string }
  | { type: "colon"; value: string }
  | { type: "space"; value: string }
  | { type: "semicolon"; value: string }
  | { type: "gradient"; value: string }
  | { type: "color"; value: string }
  | { type: "text"; value: string };

function mergeTextTokens(tokens: Token[]) {
  const merged: Token[] = [];
  let buffer = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "text") {
      buffer += token.value;
    } else {
      if (buffer) {
        merged.push({ type: "text", value: buffer });
        buffer = "";
      }
      merged.push(token);
    }
  }
  if (buffer) merged.push({ type: "text", value: buffer });
  return merged;
}

const COLOR_GRADIENT_REGEX =
  /(linear-gradient\([^)]+\)|radial-gradient\([^)]+\)|repeating-linear-gradient\([^)]+\)|repeating-radial-gradient\([^)]+\)|#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|\b(?:transparent|currentColor|inherit|initial|unset|[a-z]{3,})\b|color\(.*?\)|lab\(.*?\)|lch\(.*?\)|oklab\(.*?\)|oklch\(.*?\))/g;

export function parseCssLine(lineValue: string): Token[] {
  const match = /^([\w-]+)\s*:\s*([^;]+)(;?)/.exec(lineValue);
  
  // If no CSS property format match, try to parse as space-separated color values
  if (!match) {
    const tokens: Token[] = [];
    let lastIndex = 0;

    let matchColor: RegExpExecArray | null;
    while ((matchColor = COLOR_GRADIENT_REGEX.exec(lineValue)) !== null) {
      if (matchColor.index > lastIndex) {
        const text = lineValue.slice(lastIndex, matchColor.index);
        if (text.trim()) tokens.push({ type: "text", value: text });
      }
      const colorValue = matchColor[0];

      if (isGradientValue(colorValue)) {
        const gradientContent = colorValue;
        const individualColorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
        let gradientLastIndex = 0;
        let colorMatch: RegExpExecArray | null;
        const gradientTokens: Token[] = [];

        while ((colorMatch = individualColorRegex.exec(gradientContent)) !== null) {
          if (colorMatch.index > gradientLastIndex) {
            gradientTokens.push({
              type: "text",
              value: gradientContent.slice(gradientLastIndex, colorMatch.index),
            });
          }
          gradientTokens.push({ type: "color", value: colorMatch[0] });
          gradientLastIndex = colorMatch.index + colorMatch[0].length;
        }

        if (gradientLastIndex < gradientContent.length) {
          gradientTokens.push({ type: "text", value: gradientContent.slice(gradientLastIndex) });
        }

        if (gradientTokens.length > 1) tokens.push(...gradientTokens);
        else tokens.push({ type: "gradient", value: colorValue });

        lastIndex = matchColor.index + colorValue.length;
      } else if (isColorValue(colorValue)) {
        tokens.push({ type: "color", value: colorValue });
        lastIndex = matchColor.index + colorValue.length;
      } else {
        tokens.push({ type: "text", value: colorValue });
        lastIndex = matchColor.index + colorValue.length;
      }
    }

    if (lastIndex < lineValue.length) {
      const remainingText = lineValue.slice(lastIndex);
      if (remainingText.trim()) tokens.push({ type: "text", value: remainingText });
    }

    // If we found any color tokens, return the parsed tokens, otherwise treat as plain text
    return tokens.length > 0 ? mergeTextTokens(tokens) : [{ type: "text", value: lineValue }];
  }

  const [, property, value, semicolon] = match;
  const tokens: Token[] = [
    { type: "property", value: property },
    { type: "colon", value: ":" },
    { type: "space", value: " " },
  ];

  let lastIndex = 0;

  if (lineValue === "none solid rgb(255, 255, 255)") {
    debugger;
  }
  let matchColor: RegExpExecArray | null;
  while ((matchColor = COLOR_GRADIENT_REGEX.exec(value)) !== null) {
    if (matchColor.index > lastIndex) {
      const text = value.slice(lastIndex, matchColor.index);
      if (text) tokens.push({ type: "text", value: text });
    }
    const colorValue = matchColor[0];

    if (isGradientValue(colorValue)) {
      const gradientContent = colorValue;
      const individualColorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
      let gradientLastIndex = 0;
      let colorMatch: RegExpExecArray | null;
      const gradientTokens: Token[] = [];

      while ((colorMatch = individualColorRegex.exec(gradientContent)) !== null) {
        if (colorMatch.index > gradientLastIndex) {
          gradientTokens.push({
            type: "text",
            value: gradientContent.slice(gradientLastIndex, colorMatch.index),
          });
        }
        gradientTokens.push({ type: "color", value: colorMatch[0] });
        gradientLastIndex = colorMatch.index + colorMatch[0].length;
      }

      if (gradientLastIndex < gradientContent.length) {
        gradientTokens.push({ type: "text", value: gradientContent.slice(gradientLastIndex) });
      }

      if (gradientTokens.length > 1) tokens.push(...gradientTokens);
      else tokens.push({ type: "gradient", value: colorValue });

      lastIndex = matchColor.index + colorValue.length;
    } else if (isColorValue(colorValue)) {
      tokens.push({ type: "color", value: colorValue });
      lastIndex = matchColor.index + colorValue.length;
    } else {
      tokens.push({ type: "text", value: colorValue });
      lastIndex = matchColor.index + colorValue.length;
    }
  }

  if (lastIndex < value.length) tokens.push({ type: "text", value: value.slice(lastIndex) });
  if (semicolon) tokens.push({ type: "semicolon", value: semicolon });

  return mergeTextTokens(tokens);
}

const renderToken = (token: Token, idx: number) => {
  switch (token.type) {
    case "property":
      return (
        <span key={idx} className="font-semibold">
          {token.value}
        </span>
      );
    case "colon":
    case "space":
    case "semicolon":
      return token.value;
    case "gradient":
      return (
        <span key={idx} className="inline-flex items-center gap-1">
          <span
            className="inline-block w-6 h-3 rounded border border-gray-300 align-middle"
            style={{ backgroundImage: token.value }}
            title="gradient"
          />
          {token.value}
        </span>
      );
    case "color":
      return (
        <span key={idx} className="inline-flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded border border-gray-300 align-middle"
            style={{ backgroundColor: token.value }}
            title={token.value}
          />
          {token.value}
        </span>
      );
    case "text":
    default:
      return token.value;
  }
};

export const RenderLineWithColor = React.memo(function RenderLineWithColor({ lineValue }: { lineValue: string }) {
  console.log("😎😎😎 ::RenderLineWithColor -> lineValue", lineValue);
  const tokens = useMemo(() => parseCssLine(lineValue), [lineValue]);

  console.log("😀😀😀 ::RenderLineWithColor -> tokens", tokens);

  return <span className="text-wrap">{tokens.map(renderToken)}</span>;
});
