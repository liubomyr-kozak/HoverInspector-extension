import { describe, expect, it } from "vitest";
import { DetectedPattern, WatchEvent, WatchEventKind } from "../../types";
import { groupByRoute, routeOf } from "../routes";

const pattern = (id: string, url: string): DetectedPattern => {
  const event: WatchEvent = { id, kind: WatchEventKind.CLICK, xpath: "//a", label: id, origin: "https://a.io", time: 1, url };
  return { id, events: [event], occurrences: 2, lastEnd: 1 };
};

describe("routeOf", () => {
  it("drops the origin, the query and record ids", () => {
    expect(routeOf("https://a.io/administration/organization/01a0392f-da34-77fb-aac5-9943cd45067f/venue/42?mode=create")).toBe(
      "/administration/organization/:id/venue/:id",
    );
    expect(routeOf("https://a.io/users/x7k2p9q4m1z8w3/edit")).toBe("/users/:id/edit");
  });

  it("keeps page names, also with a digit or two", () => {
    expect(routeOf("https://a.io/v2/settings/billing")).toBe("/v2/settings/billing");
    expect(routeOf("https://a.io/")).toBe("/");
    expect(routeOf(undefined)).toBe("/");
  });
});

describe("groupByRoute", () => {
  it("puts the current page first and keeps the order of the chains", () => {
    const patterns = [
      pattern("a", "https://a.io/admin"),
      pattern("b", "https://a.io/org/5/venue/9/configurations"),
      pattern("c", "https://a.io/admin"),
      pattern("d", "https://a.io/org/13/venue/2/configurations?flow=x"),
    ];
    const groups = groupByRoute(patterns, "/org/:id/venue/:id/configurations");
    expect(groups.map((group) => [group.route, group.current, group.patterns.map((p) => p.id)])).toEqual([
      ["/org/:id/venue/:id/configurations", true, ["b", "d"]],
      ["/admin", false, ["a", "c"]],
    ]);
  });
});
