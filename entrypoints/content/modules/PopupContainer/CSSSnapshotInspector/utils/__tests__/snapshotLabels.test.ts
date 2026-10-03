import { describe, expect, it } from "vitest";
import {
  formatSnapshotTime,
  getSnapshotKind,
  getSnapshotLocation,
  getSnapshotName,
  normalizeSnapshotName,
} from "../snapshotLabels";

describe("snapshot labels", () => {
  it("tells page, element and live captures apart by id", () => {
    expect(getSnapshotKind({ id: "snapshot-1-abc" })).toBe("page");
    expect(getSnapshotKind({ id: "element-snapshot-1-abc" })).toBe("element");
    expect(getSnapshotKind({ id: "element-snapshot-1-abc-imported-2" })).toBe("element");
    expect(getSnapshotKind({ id: "current-1-abc" })).toBe("current");
  });

  it("drops the Element: prefix and falls back to the address", () => {
    expect(getSnapshotName({ id: "e", title: "Element: div#g1", url: "" })).toBe("div#g1");
    expect(getSnapshotName({ id: "p", title: "Checkout", url: "" })).toBe("Checkout");
    expect(getSnapshotName({ id: "p", title: "  ", url: "https://shop.test/cart/" })).toBe("shop.test/cart");
    expect(getSnapshotName({ id: "p", title: "", url: "" })).toBe("Untitled snapshot");
  });

  it("shortens addresses to host and path", () => {
    expect(getSnapshotLocation("http://localhost:8812/rich.html?x=1")).toBe("localhost/rich.html");
    expect(getSnapshotLocation("https://example.com/")).toBe("example.com");
    expect(getSnapshotLocation("not a url")).toBe("not a url");
  });

  it("shows seconds for today and the date for other days", () => {
    const now = new Date(2026, 9, 3, 15, 0, 0);
    expect(formatSnapshotTime(new Date(2026, 9, 3, 14, 5, 9).getTime(), now)).toBe("14:05:09");
    expect(formatSnapshotTime(new Date(2026, 9, 1, 9, 30).getTime(), now)).toBe("Oct 1, 09:30");
    expect(formatSnapshotTime(new Date(2025, 0, 2, 9, 30).getTime(), now)).toBe("Jan 2, 2025");
  });

  it("normalises typed names", () => {
    expect(normalizeSnapshotName("  Before   redesign ")).toBe("Before redesign");
    expect(normalizeSnapshotName("   ")).toBeNull();
    expect(normalizeSnapshotName("x".repeat(500))!.length).toBe(120);
  });
});
