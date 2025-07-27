import { useDispatch, useSelector } from "react-redux";
import { Form } from "antd";
import dayjs from "dayjs";
import { ScheduleConfig } from "../types";
import { automationActions, selectSchedules } from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  deleteScheduleWatcher,
  saveScheduleWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action";

/**
 * Custom hook that provides schedule management functions
 * This eliminates props drilling by allowing components to directly access these functions
 */
export const useScheduleActions = () => {
  const dispatch = useDispatch();
  const schedules = useSelector(selectSchedules);

  /**
   * Edit a schedule
   * @param id The ID of the schedule to edit
   * @param form The form instance to set values on
   */
  const editSchedule = (id: string, form?: Form<any>) => {
    const schedule = schedules[id];

    if (!schedule) {
      console.error(`Schedule with id ${id} not found`);
      return;
    }

    dispatch(automationActions.setCurrentSchedule(schedule));
    dispatch(automationActions.setActiveScheduleId(id));
    dispatch(automationActions.setIsEditingSchedule(true));

    if (form) {
      form.setFieldsValue({
        title: schedule.title,
        description: schedule.description || "",
        scenarioId: schedule.scenarioId,
        enabled: schedule.enabled,
        frequency: schedule.frequency,
        startDate: schedule.startDate ? dayjs(schedule.startDate) : undefined,
        startTime: schedule.startTime ? dayjs(schedule.startTime, "HH:mm") : undefined,
        endDate: schedule.endDate ? dayjs(schedule.endDate) : undefined,
        daysOfWeek: schedule.daysOfWeek,
        dayOfMonth: schedule.dayOfMonth,
        interval: schedule.interval,
      });
    }
  };

  /**
   * Delete a schedule
   * @param id The ID of the schedule to delete
   */
  const deleteSchedule = (id: string) => {
    dispatch(deleteScheduleWatcher.getPayload(id));
  };

  /**
   * Save a schedule
   * @param scheduleToSave The schedule to save
   * @param id Optional ID of the schedule to update (if not provided, a new schedule will be created)
   */
  const saveSchedule = (scheduleToSave: ScheduleConfig, id?: string) => {
    // Only pass id if it's not null (for existing schedules)
    const payload = id ? { id, schedule: scheduleToSave } : { schedule: scheduleToSave };

    dispatch(saveScheduleWatcher.getPayload(payload));
  };

  /**
   * Toggle a schedule's enabled status
   * @param id The ID of the schedule to toggle
   * @param enabled The new enabled status
   */
  const toggleScheduleEnabled = (id: string, enabled: boolean) => {
    const schedule = schedules[id];

    if (!schedule) {
      console.error(`Schedule with id ${id} not found`);
      return;
    }

    const updatedSchedule = { ...schedule, enabled };
    dispatch(saveScheduleWatcher.getPayload({ id, schedule: updatedSchedule }));
  };

  /**
   * Duplicate a schedule
   * @param id The ID of the schedule to duplicate
   */
  const duplicateSchedule = (id: string) => {
    const schedule = schedules[id];

    if (!schedule) {
      console.error(`Schedule with id ${id} not found`);
      return;
    }

    const duplicatedSchedule = {
      ...schedule,
      title: `Copy of ${schedule.title}`,
    };

    dispatch(saveScheduleWatcher.getPayload({ schedule: duplicatedSchedule }));
  };

  return {
    editSchedule,
    deleteSchedule,
    saveSchedule,
    toggleScheduleEnabled,
    duplicateSchedule,
  };
};
