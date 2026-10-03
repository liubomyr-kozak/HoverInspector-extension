import { auditToCssVariables, type DesignAudit } from "@entrypoints/shared/utils/designAudit";
import { parseTheme, type DesignTheme } from "./themeDiff";

/**
 * A theme made of every value the page uses now, with the names of the Overview's "Copy as CSS
 * variables". A starting point: the user removes the values that should not be tokens.
 */
export const themeFromAudit = (audit: DesignAudit, name: string): DesignTheme | null => {
  const theme = parseTheme(auditToCssVariables(audit)).theme;
  return theme && { ...theme, name };
};
