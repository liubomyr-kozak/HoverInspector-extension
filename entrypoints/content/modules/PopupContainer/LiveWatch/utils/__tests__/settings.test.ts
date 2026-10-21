import { describe, expect, it } from "vitest";
import { DEFAULT_PANEL, DEFAULT_WATCH_LIMIT, normalizeSettings } from "../../store";
import { WatchLogMode } from "../../types";

describe("normalizeSettings", () => {
  it("is off by default and for anything that is not a settings object", () => {
    expect(normalizeSettings(undefined)).toEqual({
      enabled: false,
      dismissedPatterns: [],
      mutedFields: [],
      mode: WatchLogMode.SMART,
      limit: DEFAULT_WATCH_LIMIT,
      panel: DEFAULT_PANEL,
    });
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

  it("reads settings saved by the earlier version (no mode, limit or panel)", () => {
    const settings = normalizeSettings({ enabled: true, dismissedPatterns: ["p1"], mutedFields: [] });
    expect(settings.mode).toBe(WatchLogMode.SMART);
    expect(settings.limit).toBe(DEFAULT_WATCH_LIMIT);
    expect(settings.panel).toEqual(DEFAULT_PANEL);
  });

  it("accepts only the offered limits and a sane panel layout", () => {
    expect(normalizeSettings({ limit: 2000 }).limit).toBe(2000);
    expect(normalizeSettings({ limit: 1234 }).limit).toBe(DEFAULT_WATCH_LIMIT);
    expect(normalizeSettings({ mode: "raw" }).mode).toBe(WatchLogMode.RAW);
    expect(normalizeSettings({ mode: "loud" }).mode).toBe(WatchLogMode.SMART);
    const panel = normalizeSettings({ panel: { open: false, x: -40, y: "top", width: 10, height: 900 } }).panel;
    expect(panel).toEqual({ open: false, x: 0, y: DEFAULT_PANEL.y, width: 280, height: 900 });
  });
});
