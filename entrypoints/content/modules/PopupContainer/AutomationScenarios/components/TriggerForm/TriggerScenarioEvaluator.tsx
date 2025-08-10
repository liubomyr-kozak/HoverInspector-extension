import { useEffect, useState, useRef } from "react";
import { TriggerConfig, TriggerType } from "../../types";
import { useDispatch, useSelector } from "react-redux";
import { selectTriggers, selectScenarios } from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  playScenarioWatcher,
  saveTriggerWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action.ts";
import { toast } from "react-toastify";

export const TriggerScenarioEvaluator = () => {
  const dispatch = useDispatch();
  const triggers = useSelector(selectTriggers);
  const scenarios = useSelector(selectScenarios);
  const [evaluationInterval] = useState(2000); // Check triggers every 2 seconds

  // Track domain triggers that have already been executed to prevent duplicates
  const executedDomainTriggers = useRef(new Set());

  /**
   * Evaluates a domain trigger condition
   * @param condition The trigger condition to evaluate
   * @returns True if the condition is met, false otherwise
   */
  const evaluateDomainTrigger = (condition: TriggerConfig["condition"]) => {
    if (!condition.domainPattern) return false;

    const { domainPattern, exactMatch } = condition;

    // Визначаємо, що саме передано (повний URL чи тільки hostname)
    const isFullOrigin = domainPattern.includes("://");
    
    const currentValue = isFullOrigin
      ? window.location.origin // наприклад: "http://localhost:4400"
      : window.location.hostname; // наприклад: "localhost"

    if (exactMatch) {
      return currentValue === domainPattern;
    } else {
      // Обробка wildcard патернів
      if (domainPattern.startsWith("*.")) {
        const baseDomain = domainPattern.slice(2); // видаляємо "*."
        const currentHost = isFullOrigin ? new URL(currentValue).hostname : currentValue;
        
        // Перевіряємо чи поточний домен є базовим або субдоменом
        return currentHost === baseDomain || currentHost.endsWith("." + baseDomain);
      } else {
        // Для звичайних патернів використовуємо includes
        return currentValue.includes(domainPattern);
      }
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
   * @param triggerId The ID of the trigger being evaluated
   * @returns True if all conditions are met, false otherwise
   */
  const evaluateTrigger = (trigger: TriggerConfig, triggerId: string) => {
    // Skip disabled triggers
    if (!trigger.enabled) return false;

    // For domain triggers, check if already executed for this domain to run only once
    if (trigger.type === TriggerType.DOMAIN) {
      const domainKey = `${triggerId}_${window.location.hostname}`;
      if (executedDomainTriggers.current.has(domainKey)) {
        return false; // Already executed for this domain
      }
    }

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

    // Get scenario title for notification
    const scenarioTitle = scenarios[trigger.scenarioId]?.title || "Unknown Scenario";

    // Show toast notification when trigger starts scenario
    toast.info(`🎯 Trigger "${trigger.title}" started scenario "${scenarioTitle}"`, {
      position: "bottom-left",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // For domain triggers, mark as executed to prevent duplicates
    if (trigger.type === TriggerType.DOMAIN) {
      const domainKey = `${triggerId}_${window.location.hostname}`;
      executedDomainTriggers.current.add(domainKey);
    }

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
        const conditionMet = evaluateTrigger(trigger, triggerId);

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
