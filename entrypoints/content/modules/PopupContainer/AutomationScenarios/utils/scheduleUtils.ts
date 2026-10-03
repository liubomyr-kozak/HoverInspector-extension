import { ScheduleConfig, ScheduleFrequency } from "../types";

const MINUTE = 60 * 1000;

/**
 * Parses a schedule date ("YYYY-MM-DD" or an ISO string) as a local calendar date.
 * new Date("YYYY-MM-DD") is UTC midnight, which is the previous day west of UTC.
 */
export function parseLocalDate(value: string): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);

  return isNaN(date.getTime()) ? null : date;
}

/**
 * The first time the schedule runs: its start date at its start time (local time)
 */
export function getScheduleStart(schedule: ScheduleConfig): Date | null {
  const start = parseLocalDate(schedule.startDate) || new Date();
  const [hours = 0, minutes = 0] = (schedule.startTime || "00:00").split(":").map(Number);
  start.setHours(hours || 0, minutes || 0, 0, 0);
  return start;
}

/**
 * The end of the schedule's last day, or null when it has no end date
 */
function getScheduleEnd(schedule: ScheduleConfig): Date | null {
  const end = schedule.endDate ? parseLocalDate(schedule.endDate) : null;
  if (!end) return null;
  end.setHours(23, 59, 59, 999);
  return end;
}

const atTimeOf = (day: Date, time: Date) => {
  const result = new Date(day);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
};

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/**
 * Calculates when the schedule runs next: its first occurrence strictly after `after`.
 * Returns null when the schedule has no more runs (a one-time schedule whose time has passed,
 * or a schedule past its end date).
 */
export function calculateNextExecution(schedule: ScheduleConfig, after: Date = new Date()): Date | null {
  const start = getScheduleStart(schedule);
  if (!start) return null;

  let next: Date | null = null;

  switch (schedule.frequency) {
    case ScheduleFrequency.ONCE:
      next = start > after ? start : null;
      break;

    case ScheduleFrequency.DAILY: {
      next = new Date(start);
      if (next <= after) {
        const days = Math.floor((after.getTime() - next.getTime()) / (24 * 60 * MINUTE));
        next.setDate(next.getDate() + days);
        while (next <= after) {
          next.setDate(next.getDate() + 1);
        }
      }
      break;
    }

    case ScheduleFrequency.WEEKLY: {
      const days = schedule.daysOfWeek && schedule.daysOfWeek.length > 0 ? schedule.daysOfWeek : [start.getDay()];
      const from = atTimeOf(start > after ? start : after, start);
      // One of the next 8 days (today included) is always one of the selected week days
      for (let i = 0; i <= 7; i++) {
        const candidate = new Date(from);
        candidate.setDate(from.getDate() + i);
        if (candidate > after && candidate >= start && days.includes(candidate.getDay())) {
          next = candidate;
          break;
        }
      }
      break;
    }

    case ScheduleFrequency.MONTHLY: {
      const dayOfMonth = schedule.dayOfMonth || start.getDate();
      const from = start > after ? start : after;
      for (let i = 0; i <= 12; i++) {
        const year = from.getFullYear();
        const month = from.getMonth() + i;
        const candidate = new Date(year, month, 1);
        // Months without that day (e.g. the 31st) run on their last day
        candidate.setDate(Math.min(dayOfMonth, daysInMonth(candidate.getFullYear(), candidate.getMonth())));
        candidate.setHours(start.getHours(), start.getMinutes(), 0, 0);
        if (candidate > after && candidate >= start) {
          next = candidate;
          break;
        }
      }
      break;
    }

    case ScheduleFrequency.CUSTOM: {
      const interval = Math.max(1, Number(schedule.interval) || 60) * MINUTE;
      if (start > after) {
        next = start;
      } else {
        const periods = Math.floor((after.getTime() - start.getTime()) / interval) + 1;
        next = new Date(start.getTime() + periods * interval);
      }
      break;
    }

    default:
      next = null;
  }

  const end = getScheduleEnd(schedule);
  if (next && end && next > end) return null;

  return next;
}

/**
 * Whether a schedule should run now
 */
export function isScheduleDue(schedule: ScheduleConfig, now: Date = new Date()): boolean {
  if (!schedule.enabled || !schedule.nextExecution) return false;

  // One-time schedules run only once
  if (schedule.frequency === ScheduleFrequency.ONCE && schedule.lastExecuted) return false;

  const end = getScheduleEnd(schedule);
  if (end && end < now) return false;

  const nextExecution = new Date(schedule.nextExecution);
  if (isNaN(nextExecution.getTime())) return false;

  return nextExecution <= now;
}

/**
 * The schedule after it ran at `now`: its run is recorded and the next one is computed from now on
 */
export function markScheduleExecuted(schedule: ScheduleConfig, now: Date = new Date()): ScheduleConfig {
  const lastExecuted = schedule.lastExecuted ? new Date(schedule.lastExecuted) : null;
  const after = lastExecuted && lastExecuted > now ? lastExecuted : now;
  const next = calculateNextExecution(schedule, after);

  return {
    ...schedule,
    lastExecuted: now.toISOString(),
    nextExecution: next ? next.toISOString() : undefined,
  };
}
