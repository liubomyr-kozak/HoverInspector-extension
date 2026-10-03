import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  automationActions,
  selectSchedules,
  selectScenarios,
  selectExecuting,
  selectStatus,
  ScenarioStatus,
} from "@entrypoints/content/store/automation/automation.slice";
import { playScenarioWatcher } from "@entrypoints/content/store/automation/automation.saga.action";
import { ScheduleConfig, ScheduleFrequency } from "../types";
import { toast } from "react-toastify";
import { calculateNextExecution, isScheduleDue, markScheduleExecuted } from "../utils/scheduleUtils";
import { claimScheduleRun, saveScheduleToLocalStorage } from "../utils/storage";

/**
 * Schedule monitoring interval (check every minute)
 */
const SCHEDULE_CHECK_INTERVAL = 60 * 1000; // 1 minute in milliseconds

/**
 * ScheduleMonitor component that runs in the background to check for due schedules
 * and trigger scenario execution when their time comes.
 *
 * It runs in every tab with the extension; a run is claimed in storage first (see claimScheduleRun),
 * so each scheduled run starts the scenario in one tab only.
 */
export const ScheduleMonitor: React.FC = () => {
  const dispatch = useDispatch();
  const schedules = useSelector(selectSchedules);
  const scenarios = useSelector(selectScenarios);
  const executing = useSelector(selectExecuting);
  const status = useSelector(selectStatus);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Schedules this tab is claiming right now
  const claimingRef = useRef(new Set<string>());

  // Don't start scenarios while one is playing or while recording / editing: another tab can run it
  const busyRef = useRef(false);
  busyRef.current = executing || (!!status && status !== ScenarioStatus.IDLE);

  const runSchedule = React.useCallback(
    async (scheduleId: string, schedule: ScheduleConfig) => {
      claimingRef.current.add(scheduleId);
      try {
        const result = await claimScheduleRun(scheduleId, schedule.nextExecution, markScheduleExecuted(schedule));

        if (result.status !== "claimed") {
          // Another tab ran it (or it was changed): use the stored version
          if (result.schedule) {
            dispatch(automationActions.updateSchedule({ id: scheduleId, schedule: result.schedule }));
          } else {
            dispatch(automationActions.removeSchedule(scheduleId));
          }
          return;
        }

        dispatch(automationActions.updateSchedule({ id: scheduleId, schedule: result.schedule }));

        const scenarioTitle = scenarios[schedule.scenarioId]?.title || "Unknown Scenario";
        toast.info(`🕐 Schedule "${schedule.title}" started scenario "${scenarioTitle}"`, {
          position: "bottom-left",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        dispatch(playScenarioWatcher.getPayload({ id: schedule.scenarioId }));
      } catch (error) {
        console.error(`Error processing schedule ${scheduleId}:`, error);
      } finally {
        claimingRef.current.delete(scheduleId);
      }
    },
    [scenarios, dispatch],
  );

  const checkSchedules = React.useCallback(() => {
    if (busyRef.current) return;

    const now = new Date();

    Object.entries(schedules).forEach(([scheduleId, schedule]) => {
      // Skip if scenario doesn't exist
      if (!scenarios[schedule.scenarioId]) return;
      if (claimingRef.current.has(scheduleId)) return;

      if (isScheduleDue(schedule, now)) {
        runSchedule(scheduleId, schedule);
      }
    });
  }, [schedules, scenarios, runSchedule]);

  // Set up monitoring interval
  useEffect(() => {
    // Initial check
    checkSchedules();

    // Set up recurring check
    intervalRef.current = setInterval(checkSchedules, SCHEDULE_CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkSchedules]);

  // Calculate the next execution time of schedules saved without one
  useEffect(() => {
    Object.entries(schedules).forEach(([scheduleId, schedule]) => {
      if (!schedule.enabled || schedule.nextExecution) return;
      if (schedule.frequency === ScheduleFrequency.ONCE && schedule.lastExecuted) return;

      const lastExecuted = schedule.lastExecuted ? new Date(schedule.lastExecuted) : null;
      const now = new Date();
      const nextExecution = calculateNextExecution(schedule, lastExecuted && lastExecuted > now ? lastExecuted : now);
      if (!nextExecution) return;

      const updatedSchedule: ScheduleConfig = { ...schedule, nextExecution: nextExecution.toISOString() };
      saveScheduleToLocalStorage(scheduleId, updatedSchedule).then((saved) => {
        if (saved) {
          dispatch(automationActions.updateSchedule({ id: scheduleId, schedule: updatedSchedule }));
        }
      });
    });
  }, [schedules, dispatch]);

  // This component doesn't render anything visible
  return null;
};

export default ScheduleMonitor;
