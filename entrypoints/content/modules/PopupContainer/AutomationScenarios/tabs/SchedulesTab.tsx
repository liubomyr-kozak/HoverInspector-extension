import React, { useEffect, useRef } from "react";
import { Button, message, Spin } from "antd";
import { IconPlus } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

import { ScheduleConfig, ScheduleFrequency } from "../types";
import { calculateNextExecution } from "../utils/scheduleUtils";

import {
  automationActions,
  selectActiveScheduleId,
  selectCurrentSchedule,
  selectIsEditingSchedule,
  selectScenarios,
  selectScheduleLoading,
  selectSchedules
} from "../../../../store/automation/automation.slice";

import {
  loadScenariosWatcher,
  loadSchedulesWatcher
} from "../../../../store/automation/automation.saga.action";

// Import custom hooks
import { useScheduleActions } from "../hooks/useScheduleActions";

import ScheduleList from "../components/ScheduleList";
import ScheduleForm, { ScheduleFormHandle } from "../components/ScheduleForm";

/**
 * SchedulesTab Component
 *
 * This component handles the Schedules tab in the AutomationScenarios component.
 * It provides UI for creating, managing, and scheduling automation scenarios.
 */
const SchedulesTab: React.FC = () => {
  // Redux hooks
  const dispatch = useDispatch();
  const schedules = useSelector(selectSchedules);
  const scheduleLoading = useSelector(selectScheduleLoading);
  const currentSchedule = useSelector(selectCurrentSchedule);
  const activeScheduleId = useSelector(selectActiveScheduleId);
  const isEditingSchedule = useSelector(selectIsEditingSchedule);
  const scenarios = useSelector(selectScenarios);

  // Custom hooks
  const { editSchedule, deleteSchedule, saveSchedule, toggleScheduleEnabled } = useScheduleActions();

  // Form instance
  const scheduleFormRef = useRef<ScheduleFormHandle>(null);

  // Load schedules and scenarios when component mounts
  useEffect(() => {
    dispatch(loadSchedulesWatcher.getPayload());
    dispatch(loadScenariosWatcher.getPayload());
  }, [dispatch]);

  // Handler functions
  const addSchedule = () => {
    dispatch(automationActions.resetScheduleForm());
    dispatch(automationActions.setIsEditingSchedule(true));
  };

  const handleEditSchedule = (id: string) => {
    editSchedule(id);
  };

  const handleSaveSchedule = async () => {
    const values = await scheduleFormRef.current?.submit();
    if (!values) {
      message.error("Please fill in all required fields.");
      return;
    }

    const previous = activeScheduleId ? schedules[activeScheduleId] : null;

    const scheduleToSave: ScheduleConfig = {
      title: values.title,
      description: values.description,
      scenarioId: values.scenarioId,
      enabled: values.enabled,
      frequency: values.frequency,
      startDate: values.startDate,
      startTime: values.startTime,
      endDate: values.frequency === ScheduleFrequency.ONCE ? undefined : values.endDate,
      daysOfWeek: values.daysOfWeek,
      dayOfMonth: values.dayOfMonth,
      interval: values.interval,
    };

    // Keep the last run, unless the time of a one-time schedule changed: then it runs again at the new time
    const timingChanged =
      !previous ||
      previous.frequency !== scheduleToSave.frequency ||
      previous.startDate !== scheduleToSave.startDate ||
      previous.startTime !== scheduleToSave.startTime;
    if (previous?.lastExecuted && !(scheduleToSave.frequency === ScheduleFrequency.ONCE && timingChanged)) {
      scheduleToSave.lastExecuted = previous.lastExecuted;
    }

    // The next run after now (and after the last one), so a start time in the past doesn't run on save
    const now = new Date();
    const lastExecuted = scheduleToSave.lastExecuted ? new Date(scheduleToSave.lastExecuted) : null;
    const nextExecution = calculateNextExecution(scheduleToSave, lastExecuted && lastExecuted > now ? lastExecuted : now);
    if (!nextExecution && scheduleToSave.frequency === ScheduleFrequency.ONCE && !scheduleToSave.lastExecuted) {
      message.warning("The start time has already passed, so this one-time schedule will not run.");
    }
    if (nextExecution && !(scheduleToSave.frequency === ScheduleFrequency.ONCE && scheduleToSave.lastExecuted)) {
      scheduleToSave.nextExecution = nextExecution.toISOString();
    }

    saveSchedule(scheduleToSave, activeScheduleId);
  };

  const handleScheduleCancel = () => {
    dispatch(automationActions.resetScheduleForm());
  };
  return (
    <>
      {scheduleLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <Spin tip="Loading schedules..." size="large" />
        </div>
      ) : (
        <>
          {isEditingSchedule ? (
            <div>
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3>{activeScheduleId ? "Edit" : "Add"} Schedule</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button onClick={handleScheduleCancel}>Cancel</Button>
                  <Button type="primary" onClick={handleSaveSchedule}>
                    Save Schedule
                  </Button>
                </div>
              </div>

              <ScheduleForm
                key={activeScheduleId || "new"}
                formRef={scheduleFormRef}
                currentSchedule={currentSchedule}
                scenarios={scenarios}
              />
            </div>
          ) : (
            <>
              <ScheduleList
                schedules={schedules}
                activeScheduleId={activeScheduleId}
                onEdit={handleEditSchedule}
                onDelete={deleteSchedule}
                onToggleEnabled={toggleScheduleEnabled}
              />

              <div style={{ marginTop: "16px" }}>
                <Button type="primary" onClick={addSchedule} icon={<IconPlus size={18} />} style={{ width: "100%" }}>
                  Add Schedule
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default SchedulesTab;
