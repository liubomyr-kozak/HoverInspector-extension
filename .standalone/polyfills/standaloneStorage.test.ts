import { beforeEach, describe, expect, it, vi } from "vitest";

import { createStandaloneStorage } from "./standaloneStorage";

// In-memory stand-ins for the page's localStorage and sessionStorage
const memoryStorage = (): Storage => {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, String(value));
    },
    removeItem: (key) => {
      items.delete(key);
    },
    clear: () => items.clear(),
  };
};

describe("createStandaloneStorage", () => {
  let persistent: Storage;
  let perSession: Storage;

  beforeEach(() => {
    persistent = memoryStorage();
    perSession = memoryStorage();
  });

  const create = () => createStandaloneStorage(persistent, perSession);

  it("keeps values across instances, like a page reload", async () => {
    await create().local.set({ unitConverterHistory: [{ value: 16 }] });

    expect(await create().local.get("unitConverterHistory")).toEqual({ unitConverterHistory: [{ value: 16 }] });
  });

  it("stores each key as JSON, the format LocalStorage reads in the standalone page", async () => {
    await create().local.set({ APP_STORE_STATE: { appIsActive: true } });

    expect(JSON.parse(persistent.getItem("APP_STORE_STATE") ?? "null")).toEqual({ appIsActive: true });
  });

  it("returns only stored keys, and defaults for an object of keys", async () => {
    const storage = create();
    await storage.local.set({ a: 1 });

    expect(await storage.local.get(["a", "missing"])).toEqual({ a: 1 });
    expect(await storage.local.get({ a: 0, missing: "fallback" })).toEqual({ a: 1, missing: "fallback" });
    expect(await storage.local.get(null)).toEqual({ a: 1 });
  });

  it("keeps session data apart from local data", async () => {
    const storage = create();
    await storage.session.set({ activeTabs: [1] });

    expect(await storage.local.get("activeTabs")).toEqual({});
    expect(await storage.session.get("activeTabs")).toEqual({ activeTabs: [1] });
  });

  it("reports sets and removals to onChanged listeners", async () => {
    const storage = create();
    const listener = vi.fn();
    storage.onChanged.addListener(listener);

    await storage.local.set({ key: "new" });
    await storage.local.remove("key");
    await storage.local.remove("never-stored");
    storage.onChanged.removeListener(listener);
    await storage.local.set({ key: "ignored" });

    expect(listener.mock.calls).toEqual([
      [{ key: { oldValue: undefined, newValue: "new" } }, "local"],
      [{ key: { oldValue: "new" } }, "local"],
    ]);
  });

  it("reads a plain string written by other page code instead of failing", async () => {
    persistent.setItem("theme", "dark");

    expect(await create().local.get("theme")).toEqual({ theme: "dark" });
  });
});
