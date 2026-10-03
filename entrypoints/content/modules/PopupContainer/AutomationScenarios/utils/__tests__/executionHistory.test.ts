import { describe, expect, it } from "vitest";
import {
  createExecutionHistoryEntry,
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
      stepsBefore: 1,
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
      stepsCompleted: 2,
      totalSteps: 5,
      error: "Element not found",
    });
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
