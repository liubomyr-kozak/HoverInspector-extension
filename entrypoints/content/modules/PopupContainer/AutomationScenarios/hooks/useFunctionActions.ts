import { useDispatch, useSelector } from "react-redux";
import { Form } from "antd";
import { CustomFunction } from "../types";
import { automationActions, selectFunctions } from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  deleteFunctionWatcher,
  saveFunctionWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action";

/**
 * Custom hook that provides function management functions
 * This eliminates props drilling by allowing components to directly access these functions
 */
export const useFunctionActions = () => {
  const dispatch = useDispatch();
  const functions = useSelector(selectFunctions);
  /**
   * Edit a function
   * @param id The ID of the function to edit
   * @param form The form instance to set values on
   */
  const editFunction = (id: string, form?: Form<any>) => {
    const func = functions[id];

    if (!func) {
      console.error(`Function with id ${id} not found`);
      return;
    }

    dispatch(automationActions.setCurrentFunction(func));
    dispatch(automationActions.setActiveFunctionId(id));
    dispatch(automationActions.setIsEditingFunction(true));

    if (form) {
      form.setFieldsValue({
        title: func.title,
        code: func.code,
      });
    }
  };

  /**
   * Delete a function
   * @param id The ID of the function to delete
   */
  const deleteFunction = (id: string) => {
    dispatch(deleteFunctionWatcher.getPayload(id));
  };

  /**
   * Save a function
   * @param functionToSave The function to save
   * @param id Optional ID of the function to update (if not provided, a new function will be created)
   */
  const saveFunction = (functionToSave: CustomFunction, id?: string) => {
    // Only pass id if it's not null (for existing functions)
    const payload = id ? { id, func: functionToSave } : { func: functionToSave };

    dispatch(saveFunctionWatcher.getPayload(payload));
  };

  /**
   * Duplicate a function
   * @param id The ID of the function to duplicate
   */
  const duplicateFunction = (id: string) => {
    const func = functions[id];

    if (!func) {
      console.error(`Function with id ${id} not found`);
      return;
    }

    const duplicatedFunction = {
      ...func,
      title: `Copy of ${func.title}`,
    };

    dispatch(saveFunctionWatcher.getPayload({ func: duplicatedFunction }));
  };

  return {
    editFunction,
    deleteFunction,
    saveFunction,
    duplicateFunction,
  };
};
