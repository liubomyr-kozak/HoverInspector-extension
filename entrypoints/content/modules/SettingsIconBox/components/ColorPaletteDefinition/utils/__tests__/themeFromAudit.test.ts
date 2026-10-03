import { describe, expect, it } from "vitest";
import type { DesignAudit, ValueUsage } from "@entrypoints/shared/utils/designAudit";
import { themeFromAudit } from "../themeFromAudit";
import { countThemeTokens, matchValue } from "../themeDiff";

const usage = (value: string, size?: number): ValueUsage => ({ value, size, count: 1, elements: [] });

const audit = {
  colors: { text: [usage("#1F2937")], background: [usage("#FFFFFF"), usage("#2563EB")], border: [usage("#E5E7EB")] },
  families: [usage("Inter")],
  fontSizes: [usage("14px", 14), usage("16px", 16)],
  spacing: [usage("8px", 8)],
  radii: [usage("4px", 4)],
  shadows: [usage("0 1px 2px rgba(0, 0, 0, 0.05)")],
  borderLines: [usage("1px solid #E5E7EB", 1)],
} as unknown as DesignAudit;

describe("themeFromAudit", () => {
  it("turns every value on the page into a token", () => {
    const theme = themeFromAudit(audit, "example.com")!;
    expect(theme.name).toBe("example.com");
    expect(Object.values(theme.colors)).toEqual(expect.arrayContaining(["#1F2937", "#FFFFFF", "#2563EB", "#E5E7EB"]));
    expect(theme.spacing["--space-1"]).toBe("8px");
    expect(theme.radii["--radius-1"]).toBe("4px");
    expect(Object.keys(theme.shadows)).toHaveLength(1);
    expect(Object.keys(theme.borders)).toHaveLength(1);
    expect(Object.keys(theme.typography.fontSizes)).toHaveLength(2);
    expect(countThemeTokens(theme)).toBe(11);
  });

  it("matches the page it was made from", () => {
    const theme = themeFromAudit(audit, "example.com")!;
    expect(matchValue("color", "#2563EB", theme)?.status).toBe("match");
    expect(matchValue("border", "1px solid #E5E7EB", theme)?.status).toBe("match");
  });
});
