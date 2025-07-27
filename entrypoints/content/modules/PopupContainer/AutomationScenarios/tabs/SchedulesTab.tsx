import React, { useEffect } from "react";
import { Button, Form, message, Spin } from "antd";
import { IconPlus } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

import { ScheduleConfig } from "../types";

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
import ScheduleForm from "../components/ScheduleForm";

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
  const [scheduleForm] = Form.useForm();

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
    editSchedule(id, scheduleForm);
  };

  const handleSaveSchedule = () => {
    scheduleForm
      .validateFields()
      .then((values) => {
        // Format dates and times
        const startDate = values.startDate ? values.startDate.format("YYYY-MM-DD") : "";
        const startTime = values.startTime ? values.startTime.format("HH:mm") : "";
        const endDate = values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined;

        // Calculate the next execution time
        let nextExecution = "";
        if (startDate && startTime) {
          const [hours, minutes] = startTime.split(":").map(Number);
          const nextDate = new Date(startDate);
          nextDate.setHours(hours, minutes, 0, 0);
          nextExecution = nextDate.toISOString();
        }

        const scheduleToSave: ScheduleConfig = {
          title: values.title,
          description: values.description,
          scenarioId: values.scenarioId,
          enabled: values.enabled,
          frequency: values.frequency,
          startDate,
          startTime,
          endDate,
          daysOfWeek: values.daysOfWeek,
          dayOfMonth: values.dayOfMonth,
          interval: values.interval,
          nextExecution,
        };

        saveSchedule(scheduleToSave, activeScheduleId);
      })
      .catch((error) => {
        console.error("Validation failed:", error);
        message.error("Please fill in all required fields.");
      });
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

              <ScheduleForm form={scheduleForm} currentSchedule={currentSchedule} scenarios={scenarios} />
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
