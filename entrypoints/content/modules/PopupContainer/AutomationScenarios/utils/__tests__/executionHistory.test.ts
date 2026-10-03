import { describe, expect, it } from "vitest";
import {
  createExecutionHistoryEntry,
  describeExecutionStart,
  formatStepError,
  getExpiredExecutionHistoryIds,
  normalizeExecutionHistoryEntry,
} from "../executionHistory";
import { ExecutionStatus, StepType } from "../../types";

const logEntry = (stepIndex: number, status: ExecutionStatus) => ({
  stepIndex,
  stepType: StepType.CLICK,
  stepDescription: "",
  status,
  timestamp: "2026-01-01T10:00:00.000Z",
  duration: 10,
  ...(status === ExecutionStatus.ERROR ? { error: "Element not found" } : {}),
});

describe("execution history entries", () => {
  it("records a failed playback with its progress and error", () => {
    const entry = createExecutionHistoryEntry({
      id: "ex_hist_a",
      scenarioId: "sc_a",
      scenarioTitle: "Checkout",
      totalSteps: 5,
      log: {
        entries: [logEntry(0, ExecutionStatus.SUCCESS), logEntry(1, ExecutionStatus.ERROR)],
        startTime: "2026-01-01T10:00:00.000Z",
        endTime: "2026-01-01T10:00:02.000Z",
        totalDuration: 2000,
        status: ExecutionStatus.ERROR,
      },
    });

    expect(entry).toMatchObject({
      id: "ex_hist_a",
      executionTime: "2026-01-01T10:00:00.000Z",
      duration: 2000,
      status: ExecutionStatus.ERROR,
      stepsCompleted: 1,
      totalSteps: 5,
      error: "Step 2 (Click) failed: Element not found",
    });
    expect(entry.startedFromStep).toBeUndefined();
  });

  it("counts only the steps that ran in a retry from step N and marks it", () => {
    const log = (status: ExecutionStatus, entries: ReturnType<typeof logEntry>[]) => ({
      entries,
      startTime: "2026-01-01T10:00:00.000Z",
      endTime: "2026-01-01T10:00:02.000Z",
      totalDuration: 2000,
      status,
    });
    const failed = createExecutionHistoryEntry({
      id: "ex_hist_r1",
      scenarioId: "sc_a",
      scenarioTitle: "Checkout",
      totalSteps: 6,
      startedFromStep: 3,
      retry: true,
      log: log(ExecutionStatus.ERROR, [logEntry(3, ExecutionStatus.SUCCESS), logEntry(4, ExecutionStatus.ERROR)]),
    });
    expect(failed).toMatchObject({ stepsCompleted: 1, totalSteps: 6, startedFromStep: 3, retry: true });
    expect(describeExecutionStart(failed)).toBe("Retry from step 4");

    const succeeded = createExecutionHistoryEntry({
      id: "ex_hist_r2",
      scenarioId: "sc_a",
      scenarioTitle: "Checkout",
      totalSteps: 6,
      startedFromStep: 3,
      log: log(ExecutionStatus.SUCCESS, [3, 4, 5].map((i) => logEntry(i, ExecutionStatus.SUCCESS))),
    });
    expect(succeeded).toMatchObject({ stepsCompleted: 3, totalSteps: 6, startedFromStep: 3 });
    expect(succeeded.retry).toBeUndefined();
    expect(describeExecutionStart(succeeded)).toBe("Started from step 4");
  });

  it("counts a step logged twice (before leaving the page and after) once", () => {
    const entry = createExecutionHistoryEntry({
      id: "ex_hist_d",
      scenarioId: "sc_a",
      scenarioTitle: "Checkout",
      totalSteps: 4,
      log: {
        entries: [logEntry(0, ExecutionStatus.SUCCESS), logEntry(0, ExecutionStatus.SUCCESS), logEntry(1, ExecutionStatus.ERROR)],
        startTime: "2026-01-01T10:00:00.000Z",
        endTime: "2026-01-01T10:00:02.000Z",
        totalDuration: 2000,
        status: ExecutionStatus.ERROR,
      },
    });
    expect(entry.stepsCompleted).toBe(1);
    expect(describeExecutionStart(entry)).toBeNull();
  });

  it("normalises entries saved in the old shape", () => {
    const entry = normalizeExecutionHistoryEntry("ex_hist_old", {
      scenarioId: "sc_a",
      scenarioTitle: "Old",
      timestamp: "2026-01-02T10:00:00.000Z",
      executionLog: {
        entries: [logEntry(0, ExecutionStatus.SUCCESS)],
        startTime: "2026-01-02T09:59:59.000Z",
        endTime: "2026-01-02T10:00:00.000Z",
        totalDuration: 1000,
        status: ExecutionStatus.SUCCESS,
      },
    });

    expect(entry).toMatchObject({
      id: "ex_hist_old",
      scenarioTitle: "Old",
      executionTime: "2026-01-02T09:59:59.000Z",
      duration: 1000,
      status: ExecutionStatus.SUCCESS,
      stepsCompleted: 1,
      totalSteps: 1,
    });
    expect(entry.log.entries).toHaveLength(1);
  });

  it("normalises broken entries without throwing", () => {
    const entry = normalizeExecutionHistoryEntry("ex_hist_x", null);
    expect(entry.id).toBe("ex_hist_x");
    expect(entry.log.entries).toEqual([]);
  });

  it("lists the entries beyond the newest ones", () => {
    const entries = Object.fromEntries(
      [1, 2, 3, 4].map((day) => [
        `ex_hist_${day}`,
        normalizeExecutionHistoryEntry(`ex_hist_${day}`, { executionTime: `2026-01-0${day}T00:00:00.000Z` }),
      ]),
    );
    expect(getExpiredExecutionHistoryIds(entries, 2).sort()).toEqual(["ex_hist_1", "ex_hist_2"]);
  });
});

describe("trigger of a playback", () => {
  it("keeps what started the playback", () => {
    const log = { entries: [], startTime: "2026-01-01T10:00:00.000Z", endTime: "", totalDuration: 0, status: ExecutionStatus.SUCCESS };
    const base = { id: "ex_hist_b", scenarioId: "sc_a", scenarioTitle: "A", log, totalSteps: 1 };
    expect(createExecutionHistoryEntry({ ...base, triggerType: "scheduled", triggerId: "sch_1" })).toMatchObject({
      triggerType: "scheduled",
      triggerId: "sch_1",
    });
    expect(createExecutionHistoryEntry(base)).not.toHaveProperty("triggerId");
  });
});

describe("formatStepError", () => {
  it("names the failed step by its number and type", () => {
    expect(formatStepError({ stepIndex: 3, stepType: StepType.CLICK, error: "Element not found after 10 s: //a" })).toBe(
      "Step 4 (Click) failed: Element not found after 10 s: //a",
    );
    expect(formatStepError({ stepIndex: 0, stepType: StepType.NOT_SET, error: "" })).toBe("Step 1 failed: Unknown error");
    expect(formatStepError({ stepIndex: -1, stepType: StepType.CLICK, error: "Boom" })).toBe("Boom");
  });
});
