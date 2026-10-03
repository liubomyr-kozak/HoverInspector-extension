import { describe, expect, it } from "vitest";
import { normalizeSettings } from "../../store";

describe("normalizeSettings", () => {
  it("is off by default and for anything that is not a settings object", () => {
    expect(normalizeSettings(undefined)).toEqual({ enabled: false, dismissedPatterns: [], mutedFields: [] });
    expect(normalizeSettings("on").enabled).toBe(false);
    expect(normalizeSettings({ enabled: "yes" }).enabled).toBe(false);
  });

  it("keeps only string ids and the newest 200 of them", () => {
    const ids = Array.from({ length: 250 }, (_, i) => `p${i}`);
    const settings = normalizeSettings({ enabled: true, dismissedPatterns: [...ids, 5, null], mutedFields: ["//a"] });
    expect(settings.enabled).toBe(true);
    expect(settings.dismissedPatterns).toHaveLength(200);
    expect(settings.dismissedPatterns[0]).toBe("p50");
    expect(settings.mutedFields).toEqual(["//a"]);
  });
});
