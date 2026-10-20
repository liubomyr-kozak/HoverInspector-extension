import { describe, expect, it } from "vitest";
import { StepType } from "../../../types";
import { isReplayFresh, isReplayingIn, isReplayLanding, REPLAY_MAX_AGE_MS, ReplaySession, resumeIndex, sanitizeReplay } from "../../replaySession";
import { WatchEvent, WatchEventKind } from "../../types";
import { chunkIdOf, chunkKey, chunksOverLimit, newChunkId, sanitizeHidden, sanitizeValues } from "../../watchLogStorage";

const events = (count: number): WatchEvent[] =>
  Array.from({ length: count }, (_, i) => ({ id: `e${i}`, kind: WatchEventKind.CLICK, xpath: "//a", label: "a", origin: "o", time: i }));

describe("watch log chunks", () => {
  it("sorts chunk ids by time", () => {
    const ids = [newChunkId(5_000_000_000_000), newChunkId(1_000), newChunkId(90_000_000)];
    expect([...ids].sort()).toEqual([ids[1], ids[2], ids[0]]);
  });

  it("reads the chunk id back from its key and ignores other keys", () => {
    expect(chunkIdOf(chunkKey("abc"))).toBe("abc");
    expect(chunkIdOf("automationLiveWatch")).toBeNull();
  });

  it("removes the oldest whole chunks over the limit, never going under it", () => {
    const chunks = new Map([
      ["0001", events(200)],
      ["0002", events(200)],
      ["0003", events(150)],
    ]);
    expect(chunksOverLimit(chunks, 1000)).toEqual([]);
    expect(chunksOverLimit(chunks, 350)).toEqual(["0001"]);
    expect(chunksOverLimit(chunks, 100)).toEqual(["0001", "0002"]);
    // 350 are left after the first chunk; dropping the next would leave 150
    expect(chunksOverLimit(chunks, 340)).toEqual(["0001"]);
  });

  it("keeps only text values and string ids from storage", () => {
    expect(sanitizeValues({ a: "x", b: 5, c: null })).toEqual({ a: "x" });
    expect(sanitizeValues(["x"])).toEqual({});
    expect(sanitizeHidden(["a", 1, "b"])).toEqual(["a", "b"]);
    expect(sanitizeHidden("a")).toEqual([]);
  });
});

describe("replay session", () => {
  const now = 1_700_000_000_000;
  const session = (over: Partial<ReplaySession> = {}): ReplaySession => ({
    id: "r1",
    steps: [
      { type: StepType.CLICK, xpath: "//a" },
      { type: StepType.INPUT, xpath: "//input", value: "Ann" },
      { type: StepType.CLICK, xpath: "//button" },
    ],
    index: 0,
    tabId: 7,
    updatedAt: now,
    started: false,
    rowIds: ["a", "b", "c"],
    ...over,
  });

  it("goes on after the step that left the page", () => {
    expect(resumeIndex(session({ index: 0, started: true }), 7, now)).toBe(1);
    expect(resumeIndex(session({ index: 1, started: false }), 7, now)).toBe(1);
  });

  it("is not picked up by another tab, when stale or when finished", () => {
    expect(resumeIndex(session(), 8, now)).toBeNull();
    expect(resumeIndex(session(), 7, now + REPLAY_MAX_AGE_MS + 1)).toBeNull();
    expect(resumeIndex(session({ index: 2, started: true }), 7, now)).toBeNull();
    expect(resumeIndex(null, 7, now)).toBeNull();
  });

  it("pauses the capture only in the replaying tab, and not once it went stale", () => {
    expect(isReplayingIn(session(), 7, now)).toBe(true);
    expect(isReplayingIn(session(), 9, now)).toBe(false);
    expect(isReplayingIn(session(), null, now)).toBe(true);
    expect(isReplayFresh(session(), now + REPLAY_MAX_AGE_MS + 1)).toBe(false);
  });

  it("knows a page opened by the replay's last step, so its load is not logged", () => {
    const last = session({ index: 2, started: true });
    expect(isReplayFresh(last, now)).toBe(false);
    expect(isReplayLanding(last, 7, now)).toBe(true);
    expect(isReplayLanding(last, 8, now)).toBe(false);
    expect(isReplayLanding(last, 7, now + REPLAY_MAX_AGE_MS + 1)).toBe(false);
  });

  it("rejects damaged sessions and unknown step types", () => {
    expect(sanitizeReplay(null)).toBeNull();
    expect(sanitizeReplay({ ...session(), steps: [{ type: "explode" }] })).toBeNull();
    expect(sanitizeReplay({ ...session(), index: "1" })).toBeNull();
    const clean = sanitizeReplay({ ...session(), steps: [{ type: "click", xpath: "//a", extra: 1 }], rowIds: ["a", 2] });
    expect(clean?.steps).toEqual([{ type: StepType.CLICK, xpath: "//a" }]);
    expect(clean?.rowIds).toEqual(["a"]);
  });
});
