import { ExecutionHistoryEntry, ExecutionLog, ExecutionLogEntry, ExecutionStatus, stepTypeOptions } from "../types";

/**
 * How many execution history entries are kept; older ones are deleted when a run is recorded
 */
export const MAX_EXECUTION_HISTORY_ENTRIES = 200;

// Steps that count as done in the history's "steps completed"
const COMPLETED_STATUSES = [ExecutionStatus.SUCCESS, ExecutionStatus.WARNING, ExecutionStatus.SKIPPED];

const emptyLog = (time: string, status: ExecutionStatus): ExecutionLog => ({
  entries: [],
  startTime: time,
  endTime: time,
  totalDuration: 0,
  status,
});

/**
 * Says which step failed and why, e.g. 'Step 4 (Click) failed: Element not found after 10 s: //button[...]'
 *
 * @param entry - The failed step's log entry; its stepIndex is the step's index in the scenario
 */
export function formatStepError(entry: Pick<ExecutionLogEntry, "stepIndex" | "stepType" | "error">): string {
  const label = stepTypeOptions.find((option) => option.value && option.value === entry.stepType)?.label;
  const reason = entry.error || "Unknown error";
  if (!(entry.stepIndex >= 0)) return reason;
  return `Step ${entry.stepIndex + 1}${label ? ` (${label})` : ""} failed: ${reason}`;
}

/**
 * Builds the execution history entry of a finished playback
 *
 * @param id - The history entry's key (ex_hist_...)
 * @param log - The execution log of the playback
 * @param totalSteps - The number of steps of the scenario
 * @param stepsBefore - Steps run before the log started (on previous pages)
 */
export function createExecutionHistoryEntry({
  id,
  scenarioId,
  scenarioTitle,
  log,
  totalSteps,
  stepsBefore = 0,
  triggerType,
  triggerId,
}: {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  log: ExecutionLog;
  totalSteps: number;
  stepsBefore?: number;
  triggerType?: string;
  triggerId?: string;
}): ExecutionHistoryEntry {
  const status = log.status;
  const completedInLog = (log.entries || []).filter((entry) => COMPLETED_STATUSES.includes(entry.status)).length;
  const stepsCompleted =
    status === ExecutionStatus.SUCCESS ? totalSteps : Math.min(totalSteps, stepsBefore + completedInLog);
  const errorEntry = (log.entries || []).find((entry) => entry.status === ExecutionStatus.ERROR);

  return {
    id,
    scenarioId,
    scenarioTitle,
    executionTime: log.startTime || new Date().toISOString(),
    duration: log.totalDuration || 0,
    status,
    stepsCompleted,
    totalSteps,
    ...(errorEntry ? { error: formatStepError(errorEntry) } : {}),
    ...(triggerType ? { triggerType } : {}),
    ...(triggerId ? { triggerId } : {}),
    log,
  };
}

/**
 * Turns a stored history entry into the shape the history views expect. Entries saved by older versions
 * were { scenarioId, scenarioTitle, executionLog, timestamp } without an id.
 *
 * @param id - The entry's storage key (ex_hist_...)
 * @param raw - The stored entry
 */
export function normalizeExecutionHistoryEntry(id: string, raw: any): ExecutionHistoryEntry {
  const entry = raw && typeof raw === "object" ? raw : {};
  const time = entry.executionTime || entry.timestamp || entry.executionLog?.startTime || new Date(0).toISOString();
  const status: ExecutionStatus = entry.status || entry.log?.status || entry.executionLog?.status || ExecutionStatus.SUCCESS;
  const rawLog = entry.log || entry.executionLog;
  const log: ExecutionLog = rawLog
    ? {
        ...emptyLog(time, status),
        ...rawLog,
        entries: Array.isArray(rawLog.entries) ? rawLog.entries : [],
      }
    : emptyLog(time, status);
  const completedInLog = log.entries.filter((logEntry) => COMPLETED_STATUSES.includes(logEntry.status)).length;
  const totalSteps = typeof entry.totalSteps === "number" ? entry.totalSteps : log.entries.length;

  return {
    ...entry,
    id,
    scenarioId: entry.scenarioId || "",
    scenarioTitle: entry.scenarioTitle || "Unknown Scenario",
    executionTime: entry.executionTime || log.startTime || time,
    duration: typeof entry.duration === "number" ? entry.duration : log.totalDuration || 0,
    status,
    stepsCompleted: typeof entry.stepsCompleted === "number" ? entry.stepsCompleted : completedInLog,
    totalSteps,
    log,
  };
}

/**
 * The keys of the entries beyond the newest `max` ones
 */
export function getExpiredExecutionHistoryIds(
  entries: Record<string, ExecutionHistoryEntry>,
  max: number = MAX_EXECUTION_HISTORY_ENTRIES,
): string[] {
  return Object.entries(entries)
    .sort(([, a], [, b]) => new Date(b.executionTime).getTime() - new Date(a.executionTime).getTime())
    .slice(max)
    .map(([id]) => id);
}
