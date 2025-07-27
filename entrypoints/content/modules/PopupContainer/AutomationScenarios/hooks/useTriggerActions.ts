import { useDispatch, useSelector } from "react-redux";
import { Form } from "antd";
import { useEffect, useState } from "react";
import { TriggerConfig, TriggerType } from "../types";
import { automationActions, selectTriggers } from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  deleteTriggerWatcher,
  saveTriggerWatcher,
  playScenarioWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action";

/**
 * Custom hook that provides trigger management functions
 * This eliminates props drilling by allowing components to directly access these functions
 */
export const useTriggerActions = () => {
  const dispatch = useDispatch();
  const triggers = useSelector(selectTriggers);

  // Set up periodic trigger evaluation

  /**
   * Edit a trigger
   * @param id The ID of the trigger to edit
   * @param form The form instance to set values on
   */
  const editTrigger = (id: string, form?: Form<any>) => {
    const trigger = triggers[id];

    if (!trigger) {
      console.error(`Trigger with id ${id} not found`);
      return;
    }

    dispatch(automationActions.setCurrentTrigger(trigger));
    dispatch(automationActions.setActiveTriggerID(id));
    dispatch(automationActions.setIsEditingTrigger(true));

    if (form) {
      form.setFieldsValue({
        title: trigger.title,
        description: trigger.description || "",
        scenarioId: trigger.scenarioId,
        enabled: trigger.enabled,
        type: trigger.type,
        condition: trigger.condition,
      });
    }
  };

  /**
   * Delete a trigger
   * @param id The ID of the trigger to delete
   */
  const deleteTrigger = (id: string) => {
    dispatch(deleteTriggerWatcher.getPayload(id));
  };

  /**
   * Save a trigger
   * @param triggerToSave The trigger to save
   * @param id Optional ID of the trigger to update (if not provided, a new trigger will be created)
   */
  const saveTrigger = (triggerToSave: TriggerConfig, id?: string) => {
    // Only pass id if it's not null (for existing triggers)
    const payload = id ? { id, trigger: triggerToSave } : { trigger: triggerToSave };

    dispatch(saveTriggerWatcher.getPayload(payload));
  };

  /**
   * Toggle a trigger's enabled status
   * @param id The ID of the trigger to toggle
   * @param enabled The new enabled status
   */
  const toggleTriggerEnabled = (id: string, enabled: boolean) => {
    const trigger = triggers[id];

    if (!trigger) {
      console.error(`Trigger with id ${id} not found`);
      return;
    }

    const updatedTrigger = { ...trigger, enabled };
    dispatch(saveTriggerWatcher.getPayload({ id, trigger: updatedTrigger }));
  };

  /**
   * Duplicate a trigger
   * @param id The ID of the trigger to duplicate
   */
  const duplicateTrigger = (id: string) => {
    const trigger = triggers[id];

    if (!trigger) {
      console.error(`Trigger with id ${id} not found`);
      return;
    }

    const duplicatedTrigger = {
      ...trigger,
      title: `Copy of ${trigger.title}`,
    };

    dispatch(saveTriggerWatcher.getPayload({ trigger: duplicatedTrigger }));
  };

  return {
    editTrigger,
    deleteTrigger,
    saveTrigger,
    toggleTriggerEnabled,
    duplicateTrigger,
  };
};
