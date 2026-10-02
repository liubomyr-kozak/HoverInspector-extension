import { beforeEach, describe, expect, it } from "vitest";
import {
  advanceExecutionSession,
  canLeavePage,
  EXECUTION_HANDOFF_KEY,
  EXECUTION_SESSION_KEY,
  EXECUTION_SESSION_MAX_AGE,
  loadExecutionSession,
  releaseExecutionSession,
  saveExecutionSession,
  shouldResumeSession,
  startExecutionSession,
} from "../executionSession";
import { StepType } from "../../types";

// Minimal chrome.storage.local stand-in
const store: Record<string, unknown> = {};
(globalThis as any).chrome = {
  storage: {
    local: {
      get: async (keys: string | string[]) =>
        Object.fromEntries([keys].flat().filter((key) => key in store).map((key) => [key, store[key]])),
      set: async (items: Record<string, unknown>) => Object.assign(store, items),
      remove: async (keys: string | string[]) => [keys].flat().forEach((key) => delete store[key]),
    },
  },
};

describe("execution session", () => {
  beforeEach(() => {
    delete store[EXECUTION_SESSION_KEY];
    delete store[EXECUTION_HANDOFF_KEY];
  });

  it("moves the playback forward in the tab that owns it", async () => {
    await saveExecutionSession({ scenarioId: "sc_1", nextStepIndex: 0, tabId: 7, updatedAt: 1 });
    expect(await advanceExecutionSession("sc_1", 7, 3)).toBe("continue");
    expect((await loadExecutionSession())?.nextStepIndex).toBe(3);
  });

  it("stops in the old tab once the playback was handed over to a new tab", async () => {
    await saveExecutionSession({ scenarioId: "sc_1", nextStepIndex: 2, tabId: 7, updatedAt: 1 });
    store[EXECUTION_HANDOFF_KEY] = { scenarioId: "sc_1", fromTabId: 7, toTabId: 8 };
    expect(await advanceExecutionSession("sc_1", 7, 3)).toBe("handed-off");
    expect((await loadExecutionSession())?.nextStepIndex).toBe(2);
    // the old tab does not remove the session of the new one
    await releaseExecutionSession("sc_1", 7);
    expect(await loadExecutionSession()).not.toBeNull();
    // the new tab continues it
    expect(await advanceExecutionSession("sc_1", 8, 3)).toBe("continue");
    expect(await loadExecutionSession()).toMatchObject({ tabId: 8, nextStepIndex: 3 });
  });

  it("forgets the handoff of a previous playback", async () => {
    store[EXECUTION_HANDOFF_KEY] = { scenarioId: "sc_1", fromTabId: 7, toTabId: 8 };
    await startExecutionSession({ scenarioId: "sc_1", nextStepIndex: 0, tabId: 7, updatedAt: 1 });
    expect(await advanceExecutionSession("sc_1", 7, 1)).toBe("continue");
  });

  it("stops when another scenario started playing", async () => {
    await saveExecutionSession({ scenarioId: "sc_2", nextStepIndex: 0, tabId: 7, updatedAt: 1 });
    expect(await advanceExecutionSession("sc_1", 7, 1)).toBe("stopped");
    await releaseExecutionSession("sc_1", 7);
    expect((await loadExecutionSession())?.scenarioId).toBe("sc_2");
  });

  it("removes the session when the owner finishes", async () => {
    await saveExecutionSession({ scenarioId: "sc_1", nextStepIndex: 4, tabId: 7, updatedAt: 1 });
    await releaseExecutionSession("sc_1", 7);
    expect(await loadExecutionSession()).toBeNull();
  });

  it("resumes only fresh sessions of the same tab", () => {
    const now = 100_000;
    const session = { scenarioId: "sc_1", nextStepIndex: 1, tabId: 7, updatedAt: now - 1000 };
    expect(shouldResumeSession(session, 7, null, now)).toBe(true);
    expect(shouldResumeSession(session, 8, null, now)).toBe(false);
    expect(shouldResumeSession(session, 8, { scenarioId: "sc_1", fromTabId: 7, toTabId: 8 }, now)).toBe(true);
    expect(shouldResumeSession({ ...session, updatedAt: now - EXECUTION_SESSION_MAX_AGE - 1 }, 7, null, now)).toBe(
      false,
    );
    expect(shouldResumeSession(null, 7, null, now)).toBe(false);
  });

  it("marks steps that may leave the page as done before running them", () => {
    expect(canLeavePage({ type: StepType.CLICK, xpath: "//a" })).toBe(true);
    expect(canLeavePage({ type: StepType.NAVIGATE, value: "https://x" })).toBe(true);
    expect(canLeavePage({ type: StepType.INPUT, xpath: "//input", value: "a" })).toBe(false);
    expect(canLeavePage({ type: StepType.WAIT, value: "100" })).toBe(false);
  });
});

describe("domain triggers in the background", () => {
  it("match the URL of a tab without using window.location", async () => {
    const { matchesDomainTrigger } = await import("../validationUtils");
    const trigger = (condition: object, enabled = true) =>
      ({ title: "t", scenarioId: "sc_1", enabled, type: "domain", condition }) as any;
    expect(matchesDomainTrigger([trigger({ domainPattern: "shop.example.com" })], "https://shop.example.com/a")).toBe(
      true,
    );
    expect(matchesDomainTrigger([trigger({ domainPattern: "shop.example.com" })], "https://other.com/")).toBe(false);
    expect(
      matchesDomainTrigger([trigger({ domainPattern: "https://x.io/cart", exactMatch: true })], "https://x.io/cart"),
    ).toBe(true);
    expect(matchesDomainTrigger([trigger({ domainPattern: "x.io" }, false)], "https://x.io/")).toBe(false);
  });
});
