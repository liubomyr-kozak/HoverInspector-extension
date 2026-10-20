import { describe, expect, it } from "vitest";
import { WatchEvent, WatchEventKind } from "../../types";
import { watchLogExport, watchLogFileName } from "../exportLog";

const event = (id: string, over: Partial<WatchEvent> = {}): WatchEvent => ({
  id,
  kind: WatchEventKind.INPUT,
  xpath: `//*[@id="${id}"]`,
  label: id,
  origin: "https://example.com",
  time: 1,
  ...over,
});

describe("watchLogExport", () => {
  it("lists every event with the typed text, except in sensitive fields", () => {
    const events = [event("name"), event("password", { sensitive: true }), event("save", { kind: WatchEventKind.CLICK })];
    const values = new Map([
      ["name", "Iryna"],
      ["password", "secret"],
    ]);
    const result = watchLogExport(events, values, new Date("2026-10-20T10:00:00Z"));
    expect(result.count).toBe(3);
    expect(result.exportedAt).toBe("2026-10-20T10:00:00.000Z");
    expect(result.events.map((e) => e.typed)).toEqual(["Iryna", undefined, undefined]);
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("names the file by date and time", () => {
    expect(watchLogFileName(new Date("2026-10-20T10:05:09Z"))).toBe("live-watching-2026-10-20-10-05-09.json");
  });
});
