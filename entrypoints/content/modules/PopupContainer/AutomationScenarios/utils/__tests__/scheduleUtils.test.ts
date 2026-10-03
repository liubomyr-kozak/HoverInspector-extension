import { describe, expect, it } from "vitest";
import {
  calculateNextExecution,
  isScheduleDue,
  markScheduleExecuted,
  parseLocalDate,
} from "../scheduleUtils";
import { ScheduleConfig, ScheduleFrequency } from "../../types";

const schedule = (overrides: Partial<ScheduleConfig>): ScheduleConfig => ({
  title: "Test",
  scenarioId: "sc_a",
  enabled: true,
  frequency: ScheduleFrequency.DAILY,
  startDate: "2026-01-05", // a Monday
  startTime: "09:30",
  ...overrides,
});

// Local time, like the schedule dates
const at = (year: number, month: number, day: number, hours = 0, minutes = 0) =>
  new Date(year, month - 1, day, hours, minutes, 0, 0);

describe("parseLocalDate", () => {
  it("parses YYYY-MM-DD as a local date, not UTC", () => {
    const date = parseLocalDate("2026-03-10")!;
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 2, 10, 0]);
  });

  it("returns null for invalid dates", () => {
    expect(parseLocalDate("")).toBeNull();
    expect(parseLocalDate("not a date")).toBeNull();
  });
});

describe("calculateNextExecution", () => {
  it("runs a one-time schedule at its start, and not after it passed", () => {
    const once = schedule({ frequency: ScheduleFrequency.ONCE });
    expect(calculateNextExecution(once, at(2026, 1, 1))).toEqual(at(2026, 1, 5, 9, 30));
    expect(calculateNextExecution(once, at(2026, 1, 6))).toBeNull();
  });

  it("runs a daily schedule at the next start time after the given time", () => {
    const daily = schedule({ frequency: ScheduleFrequency.DAILY });
    expect(calculateNextExecution(daily, at(2026, 1, 1))).toEqual(at(2026, 1, 5, 9, 30));
    // Long after the first period: the next day, not start + 1 day
    expect(calculateNextExecution(daily, at(2026, 2, 20, 10, 0))).toEqual(at(2026, 2, 21, 9, 30));
    expect(calculateNextExecution(daily, at(2026, 2, 20, 9, 0))).toEqual(at(2026, 2, 20, 9, 30));
    // Exactly at the run time: the next one
    expect(calculateNextExecution(daily, at(2026, 2, 20, 9, 30))).toEqual(at(2026, 2, 21, 9, 30));
  });

  it("runs a weekly schedule on the selected week days", () => {
    // Mondays and Thursdays
    const weekly = schedule({ frequency: ScheduleFrequency.WEEKLY, daysOfWeek: [1, 4] });
    // Tuesday 2026-03-03 -> Thursday 2026-03-05
    expect(calculateNextExecution(weekly, at(2026, 3, 3, 12))).toEqual(at(2026, 3, 5, 9, 30));
    // Thursday after the run time -> next Monday
    expect(calculateNextExecution(weekly, at(2026, 3, 5, 10))).toEqual(at(2026, 3, 9, 9, 30));
    // Before the start date: the first selected day from the start
    expect(calculateNextExecution(weekly, at(2025, 12, 1))).toEqual(at(2026, 1, 5, 9, 30));
  });

  it("runs a weekly schedule without days on the start date's week day", () => {
    const weekly = schedule({ frequency: ScheduleFrequency.WEEKLY });
    expect(calculateNextExecution(weekly, at(2026, 1, 5, 10))).toEqual(at(2026, 1, 12, 9, 30));
  });

  it("runs a monthly schedule on its day of month, or the last day of shorter months", () => {
    const monthly = schedule({ frequency: ScheduleFrequency.MONTHLY, dayOfMonth: 15 });
    expect(calculateNextExecution(monthly, at(2026, 4, 2))).toEqual(at(2026, 4, 15, 9, 30));
    expect(calculateNextExecution(monthly, at(2026, 4, 15, 10))).toEqual(at(2026, 5, 15, 9, 30));

    const endOfMonth = schedule({ frequency: ScheduleFrequency.MONTHLY, dayOfMonth: 31 });
    expect(calculateNextExecution(endOfMonth, at(2026, 2, 1))).toEqual(at(2026, 2, 28, 9, 30));
  });

  it("runs a custom schedule every interval from its start", () => {
    const custom = schedule({ frequency: ScheduleFrequency.CUSTOM, interval: 45 });
    expect(calculateNextExecution(custom, at(2026, 1, 5, 9, 0))).toEqual(at(2026, 1, 5, 9, 30));
    expect(calculateNextExecution(custom, at(2026, 1, 5, 10, 0))).toEqual(at(2026, 1, 5, 10, 15));
    expect(calculateNextExecution(custom, at(2026, 1, 5, 10, 15))).toEqual(at(2026, 1, 5, 11, 0));
  });

  it("stops after the end date", () => {
    const daily = schedule({ endDate: "2026-01-10" });
    expect(calculateNextExecution(daily, at(2026, 1, 9, 12))).toEqual(at(2026, 1, 10, 9, 30));
    expect(calculateNextExecution(daily, at(2026, 1, 10, 12))).toBeNull();
  });
});

describe("isScheduleDue / markScheduleExecuted", () => {
  it("is due when the next execution passed, and is not due again right after running", () => {
    const daily = schedule({ nextExecution: at(2026, 2, 1, 9, 30).toISOString() });
    const now = at(2026, 2, 20, 9, 31);
    expect(isScheduleDue(daily, now)).toBe(true);

    const executed = markScheduleExecuted(daily, now);
    expect(executed.lastExecuted).toBe(now.toISOString());
    expect(executed.nextExecution).toBe(at(2026, 2, 21, 9, 30).toISOString());
    expect(isScheduleDue(executed, at(2026, 2, 20, 9, 32))).toBe(false);
    expect(isScheduleDue(executed, at(2026, 2, 21, 9, 30))).toBe(true);
  });

  it("runs a one-time schedule once", () => {
    const once = schedule({ frequency: ScheduleFrequency.ONCE, nextExecution: at(2026, 1, 5, 9, 30).toISOString() });
    const executed = markScheduleExecuted(once, at(2026, 1, 5, 9, 31));
    expect(executed.nextExecution).toBeUndefined();
    expect(isScheduleDue(executed, at(2026, 1, 6))).toBe(false);
  });

  it("does not run disabled schedules", () => {
    const daily = schedule({ enabled: false, nextExecution: at(2026, 1, 5, 9, 30).toISOString() });
    expect(isScheduleDue(daily, at(2026, 1, 6))).toBe(false);
  });
});
