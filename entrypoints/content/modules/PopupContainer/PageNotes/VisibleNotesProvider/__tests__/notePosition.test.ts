import { describe, expect, it } from "vitest";
import { getFreeNotePosition } from "../notePosition";

const W = 250;
const H = 150;
const overlaps = (a: any, b: any) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

describe("getFreeNotePosition", () => {
  it("uses the top right spot on an empty page", () => {
    const pos = getFreeNotePosition(W, H, []);
    expect(pos).toEqual({ x: window.innerWidth - W - 40, y: 120 });
  });

  it("never lands on a note that is already shown", () => {
    const occupied: any[] = [];
    for (let i = 0; i < 6; i++) {
      const pos = getFreeNotePosition(W, H, occupied);
      const rect = { ...pos, width: W, height: H };
      for (const other of occupied) expect(overlaps(rect, other)).toBe(false);
      occupied.push(rect);
    }
  });

  it("goes around a note placed at the default spot", () => {
    const first = getFreeNotePosition(W, H, []);
    const second = getFreeNotePosition(W, H, [{ ...first, width: W, height: H }]);
    expect(overlaps({ ...second, width: W, height: H }, { ...first, width: W, height: H })).toBe(false);
  });
});
