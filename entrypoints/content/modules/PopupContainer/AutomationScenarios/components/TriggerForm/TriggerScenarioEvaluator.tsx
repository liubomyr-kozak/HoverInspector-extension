import { useEffect, useState } from "react";
import { TriggerConfig, TriggerType } from "../../types";
import { useDispatch, useSelector } from "react-redux";
import { selectTriggers } from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  playScenarioWatcher,
  saveTriggerWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action.ts";

export const TriggerScenarioEvaluator = () => {
  const dispatch = useDispatch();
  const triggers = useSelector(selectTriggers);
  const [evaluationInterval] = useState(2000); // Check triggers every 2 seconds

  /**
   * Evaluates a domain trigger condition
   * @param condition The trigger condition to evaluate
   * @returns True if the condition is met, false otherwise
   */
  const evaluateDomainTrigger = (condition: TriggerConfig["condition"]) => {
    if (!condition.domainPattern) return false;

    const currentDomain = window.location.hostname;

    if (condition.exactMatch) {
      return currentDomain === condition.domainPattern;
    } else {
      return currentDomain.includes(condition.domainPattern);
    }
  };

  /**
   * Evaluates an element present trigger condition
   * @param condition The trigger condition to evaluate
   * @returns True if the condition is met, false otherwise
   */
  const evaluateElementPresentTrigger = (condition: TriggerConfig["condition"]) => {
    if (!condition.elementXPath) return false;

    try {
      const element = document.evaluate(
        condition.elementXPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue;

      return !!element;
    } catch (error) {
      console.error(`Error evaluating XPath: ${condition.elementXPath}`, error);
      return false;
    }
  };

  /**
   * Evaluates a custom condition using JavaScript
   * @param condition The trigger condition to evaluate
   * @returns True if the condition is met, false otherwise
   */
  const evaluateCustomCondition = (condition: TriggerConfig["condition"]) => {
    if (!condition.customCondition) return true; // If no custom condition, consider it met

    try {
      // Use Function constructor to create a function from the custom condition string
      const evalFunction = new Function("return " + condition.customCondition);
      return !!evalFunction();
    } catch (error) {
      console.error(`Error evaluating custom condition: ${condition.customCondition}`, error);
      return false;
    }
  };

  /**
   * Evaluates a trigger's conditions based on its type
   * @param trigger The trigger to evaluate
   * @returns True if all conditions are met, false otherwise
   */
  const evaluateTrigger = (trigger: TriggerConfig) => {
    // Skip disabled triggers
    if (!trigger.enabled) return false;

    // Check if the trigger was recently triggered (within the last 5 seconds)
    if (trigger.lastTriggered) {
      const lastTriggeredTime = new Date(trigger.lastTriggered).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - lastTriggeredTime;

      // Prevent triggering more than once every 5 seconds
      if (timeDifference < 5000) return false;
    }

    // Evaluate based on trigger type
    let typeConditionMet = false;

    switch (trigger.type) {
      case TriggerType.DOMAIN:
        typeConditionMet = evaluateDomainTrigger(trigger.condition);
        break;
      case TriggerType.PAGE_LOAD:
        // For page load triggers, we always return true as they're evaluated on page load
        typeConditionMet = true;
        break;
      case TriggerType.ELEMENT_PRESENT:
        typeConditionMet = evaluateElementPresentTrigger(trigger.condition);
        break;
      case TriggerType.CUSTOM_EVENT:
        // Custom events are handled separately via event listeners
        typeConditionMet = false;
        break;
      default:
        typeConditionMet = false;
    }

    // If the type-specific condition is met, also check any custom condition
    return typeConditionMet && evaluateCustomCondition(trigger.condition);
  };

  /**
   * Executes a trigger by running its associated scenario
   * @param triggerId The ID of the trigger to execute
   * @param trigger The trigger configuration
   */
  const executeTrigger = (triggerId: string, trigger: TriggerConfig) => {
    console.log(`Executing trigger: ${trigger.title}`);

    // Execute the associated scenario
    dispatch(playScenarioWatcher.getPayload({ id: trigger.scenarioId }));

    // Update the lastTriggered timestamp
    const updatedTrigger = {
      ...trigger,
      lastTriggered: new Date().toISOString(),
    };

    // Save the updated trigger
    dispatch(saveTriggerWatcher.getPayload({ id: triggerId, trigger: updatedTrigger }));
  };

  useEffect(() => {
    // Function to check all triggers
    const checkTriggers = () => {
      // Skip if there are no triggers
      if (!triggers || Object.keys(triggers).length === 0) return;

      // Check each trigger
      Object.entries(triggers).forEach(([triggerId, trigger]) => {
        // Evaluate the trigger
        const conditionMet = evaluateTrigger(trigger);

        // If the condition is met, execute the trigger
        if (conditionMet) {
          executeTrigger(triggerId, trigger);
        }
      });
    };

    // Initial check
    checkTriggers();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkTriggers, evaluationInterval);

    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [triggers, evaluationInterval]); // Re-run when triggers, interval, or dispatch changes

  return null;
};
