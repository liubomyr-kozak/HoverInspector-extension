import { describe, expect, it } from "vitest";

import type { CSSSnapshot, SnapshotNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/types";
import { diffSnapshots } from "../snapshotDiff";

const node = (path: string[], styles: Record<string, string>, children: SnapshotNode[] = []): SnapshotNode =>
  ({
    key: path.join(">"),
    path,
    tagName: path[path.length - 1].replace(/\[\d+\]$/, ""),
    classes: [],
    attributes: {},
    bounds: { top: 0, left: 0, width: 100, height: 20 },
    styles,
    inlineStyles: {},
    children,
    xpath: { absolute: `/${path.join("/")}`, withId: "", withClasses: "", withAttributes: "", optimized: "" },
  }) as unknown as SnapshotNode;

const snapshot = (id: string, buttonColor: string, extra: SnapshotNode[] = []): CSSSnapshot => ({
  id,
  timestamp: 1_700_000_000_000,
  url: "http://localhost/",
  title: id,
  elementCount: 2 + extra.length,
  root: node(["body[0]"], {}, [node(["body[0]", "button[0]"], { color: buttonColor }), ...extra]),
});

describe("diffSnapshots", () => {
  it("lists changed styles and added elements", () => {
    const before = snapshot("a", "rgb(0, 0, 0)");
    const after = snapshot("b", "rgb(255, 0, 0)", [node(["body[0]", "p[1]"], { color: "rgb(0, 0, 0)" })]);
    const diff = diffSnapshots(before, after);

    expect(diff.summary.modifiedCount).toBe(1);
    expect(diff.modified[0].styleChanges).toEqual([
      { property: "color", oldValue: "rgb(0, 0, 0)", newValue: "rgb(255, 0, 0)", changeType: "modified" },
    ]);
    expect(diff.added.map((element) => element.tagName)).toEqual(["p"]);
    expect(diff.truncated).toBe(false);
  });

  it("caps each list but still counts everything", () => {
    const before = snapshot("a", "red");
    const after = snapshot("b", "red", [node(["body[0]", "p[1]"], {}), node(["body[0]", "p[2]"], {})]);
    const diff = diffSnapshots(before, after, { limit: 1 });
    expect(diff.added).toHaveLength(1);
    expect(diff.summary.addedCount).toBe(2);
    expect(diff.truncated).toBe(true);
  });
});
