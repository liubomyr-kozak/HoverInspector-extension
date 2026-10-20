import { describe, expect, it } from "vitest";

import { createSerialByKey } from "../serialByKey";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
};

describe("createSerialByKey", () => {
  it("starts a task for a key only after the previous one for that key finished", async () => {
    const run = createSerialByKey<number>();
    const log: string[] = [];
    const first = deferred();

    const a = run(1, async () => {
      log.push("a start");
      await first.promise;
      log.push("a end");
    });
    const b = run(1, async () => {
      log.push("b start");
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(log).toEqual(["a start"]);

    first.resolve();
    await Promise.all([a, b]);
    expect(log).toEqual(["a start", "a end", "b start"]);
  });

  it("runs tasks for different keys at the same time", async () => {
    const run = createSerialByKey<number>();
    const log: string[] = [];
    const blocked = deferred();

    const a = run(1, async () => {
      await blocked.promise;
      log.push("tab 1");
    });
    await run(2, async () => {
      log.push("tab 2");
    });
    expect(log).toEqual(["tab 2"]);

    blocked.resolve();
    await a;
    expect(log).toEqual(["tab 2", "tab 1"]);
  });

  it("keeps going after a failed task and passes the failure to its caller", async () => {
    const run = createSerialByKey<number>();
    const failed = run(1, async () => {
      throw new Error("no tab");
    });
    const next = run(1, async () => "ran");

    await expect(failed).rejects.toThrow("no tab");
    await expect(next).resolves.toBe("ran");
  });
});
