import { topClasses, type DesignAudit } from "@entrypoints/shared/utils/designAudit";
import { classifyVariable, findAliases, type MatchContext, type ThemeMatch, type TokenKind } from "../utils/themeDiff";
import type { DetailFormat, DetailName } from "./TokenDetailPanel";

const round = (n: number, digits = 4) => Math.round(n * 10 ** digits) / 10 ** digits;

/** px, rem and em (relative to a 16px parent) of a length */
export const lengthFormats = (px: number, rootFontSize: number): DetailFormat[] => [
  { label: "px", value: `${round(px, 2)}px` },
  { label: `rem (root ${rootFontSize}px)`, value: `${round(px / rootFontSize)}rem` },
  { label: "em (16px parent)", value: `${round(px / 16)}em` },
];

/**
 * The CSS custom properties on :root that hold this value. Variables named for this kind come first
 * (a 16px font size is `--text-base`, not `--space-4`); others only when none is.
 */
export const variableAliases = (audit: DesignAudit | null, kind: TokenKind, value: string, ctx: MatchContext = {}): string[] => {
  if (!audit?.variableEntries?.length) return [];
  const aliases = findAliases(kind, value, audit.variableEntries, ctx);
  const values = new Map(audit.variableEntries);
  const named = aliases.filter((name) => classifyVariable(name, values.get(name) || "") === kind);
  return named.length ? named : aliases;
};

/** Names a value goes by: theme token, CSS variables, the classes of the elements using it */
export const buildNames = ({
  variables = [],
  match,
  elements = [],
  extra = [],
}: {
  variables?: string[];
  match?: ThemeMatch | null;
  elements?: Element[];
  extra?: DetailName[];
}): DetailName[] => [
  ...(match?.status === "match" && match.token ? [{ kind: "Theme token", text: match.token }] : []),
  ...variables.map((name) => ({ kind: "CSS variable", text: name, copy: `var(${name})` })),
  ...extra,
  ...topClasses(elements, 4).map((name) => ({ kind: "Classes", text: `.${name}` })),
];

/** The name shown under a value in the lists: the theme token it matches, else its CSS variable */
export const secondaryName = (variables: string[], match: ThemeMatch | null | undefined) =>
  match?.status === "match" && match.token ? match.token : variables[0];

export const WEIGHT_NAMES: Record<string, string> = {
  "100": "Thin",
  "200": "Extra light",
  "300": "Light",
  "400": "Regular",
  "500": "Medium",
  "600": "Semibold",
  "700": "Bold",
  "800": "Extra bold",
  "900": "Black",
};
