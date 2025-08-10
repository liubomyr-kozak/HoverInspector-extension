import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectSchedules, selectScenarios } from "@entrypoints/content/store/automation/automation.slice";
import { playScenarioWatcher, saveScheduleWatcher } from "@entrypoints/content/store/automation/automation.saga.action";
import { ScheduleConfig, ScheduleFrequency, DayOfWeek } from "../types";
import { toast } from "react-toastify";

/**
 * Schedule monitoring interval (check every minute)
 */
const SCHEDULE_CHECK_INTERVAL = 60 * 1000; // 1 minute in milliseconds

/**
 * Calculate the next execution time for a schedule based on its frequency
 */
function calculateNextExecution(schedule: ScheduleConfig): Date {
  const now = new Date();
  const [hours, minutes] = schedule.startTime.split(":").map(Number);

  let nextExecution = new Date(schedule.startDate);
  nextExecution.setHours(hours, minutes, 0, 0);

  // If the start time has already passed today, move to the appropriate next time
  if (nextExecution <= now) {
    switch (schedule.frequency) {
      case ScheduleFrequency.ONCE:
        // For one-time schedules, if the time has passed, it won't execute again
        return nextExecution;

      case ScheduleFrequency.DAILY:
        // Move to next day
        nextExecution.setDate(nextExecution.getDate() + 1);
        break;

      case ScheduleFrequency.WEEKLY:
        // Move to next occurrence based on days of week
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
          const currentDay = now.getDay();
          let nextDay = schedule.daysOfWeek.find((day) => day > currentDay);

          if (!nextDay) {
            // No more days this week, move to first day of next week
            nextDay = schedule.daysOfWeek[0];
            const daysUntilNext = 7 - currentDay + nextDay;
            nextExecution.setDate(nextExecution.getDate() + daysUntilNext);
          } else {
            // Move to next day this week
            const daysUntilNext = nextDay - currentDay;
            nextExecution.setDate(nextExecution.getDate() + daysUntilNext);
          }
        } else {
          // Default to weekly (same day next week)
          nextExecution.setDate(nextExecution.getDate() + 7);
        }
        break;

      case ScheduleFrequency.MONTHLY:
        if (schedule.dayOfMonth) {
          // Move to next month, same day
          nextExecution.setMonth(nextExecution.getMonth() + 1);
          nextExecution.setDate(schedule.dayOfMonth);
        } else {
          // Default to same date next month
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }
        break;

      case ScheduleFrequency.CUSTOM:
        if (schedule.interval) {
          // Add interval in minutes
          nextExecution = new Date(now.getTime() + schedule.interval * 60 * 1000);
        } else {
          // Default to 1 hour if no interval specified
          nextExecution = new Date(now.getTime() + 60 * 60 * 1000);
        }
        break;
    }
  }

  return nextExecution;
}

/**
 * Check if a schedule is due for execution
 */
function isScheduleDue(schedule: ScheduleConfig): boolean {
  if (!schedule.enabled) {
    return false;
  }

  const now = new Date();

  // Check if schedule has an end date and it has passed
  if (schedule.endDate && new Date(schedule.endDate) < now) {
    return false;
  }

  // For one-time schedules, check if already executed
  if (schedule.frequency === ScheduleFrequency.ONCE && schedule.lastExecuted) {
    return false;
  }

  // Calculate when this schedule should next execute
  const nextExecution = schedule.nextExecution ? new Date(schedule.nextExecution) : calculateNextExecution(schedule);

  // Check if the next execution time has passed
  return nextExecution <= now;
}

/**
 * ScheduleMonitor component that runs in the background to check for due schedules
 * and trigger scenario execution when their time comes
 */
export const ScheduleMonitor: React.FC = () => {
  const dispatch = useDispatch();
  const schedules = useSelector(selectSchedules);
  const scenarios = useSelector(selectScenarios);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkSchedules = React.useCallback(() => {
    const now = new Date();


    Object.entries(schedules).forEach(([scheduleId, schedule]) => {
      try {
        // Skip if scenario doesn't exist
        if (!scenarios[schedule.scenarioId]) {
          console.warn(`Schedule ${scheduleId} references non-existent scenario ${schedule.scenarioId}`);
          return;
        }

        // Check if schedule is due for execution
        if (isScheduleDue(schedule)) {

          // Get scenario title for notification
          const scenarioTitle = scenarios[schedule.scenarioId]?.title || "Unknown Scenario";

          // Show toast notification for schedule trigger
          toast.info(`🕐 Schedule "${schedule.title}" started scenario "${scenarioTitle}"`, {
            position: "bottom-left",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Trigger scenario execution
          dispatch(playScenarioWatcher.getPayload({ id: schedule.scenarioId }));

          // Update schedule with execution timestamp and next execution time
          const updatedSchedule: ScheduleConfig = {
            ...schedule,
            lastExecuted: now.toISOString(),
            nextExecution: calculateNextExecution(schedule).toISOString(),
          };

          // Save updated schedule
          dispatch(
            saveScheduleWatcher.getPayload({
              id: scheduleId,
              schedule: updatedSchedule,
            }),
          );

        }
      } catch (error) {
        console.error(`Error processing schedule ${scheduleId}:`, error);
      }
    });
  }, [schedules, scenarios, dispatch]);

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

  // Re-calculate next execution times when schedules change
  useEffect(() => {
    Object.entries(schedules).forEach(([scheduleId, schedule]) => {
      if (schedule.enabled && !schedule.nextExecution) {
        // Calculate and save next execution time for schedules that don't have it
        const nextExecution = calculateNextExecution(schedule);
        const updatedSchedule: ScheduleConfig = {
          ...schedule,
          nextExecution: nextExecution.toISOString(),
        };

        dispatch(
          saveScheduleWatcher.getPayload({
            id: scheduleId,
            schedule: updatedSchedule,
          }),
        );
      }
    });
  }, [schedules, dispatch]);

  // This component doesn't render anything visible
  return null;
};

export default ScheduleMonitor;
