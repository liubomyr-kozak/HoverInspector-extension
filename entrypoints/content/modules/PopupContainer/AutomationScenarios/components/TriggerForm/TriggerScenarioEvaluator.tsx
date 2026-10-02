import { useEffect, useState, useRef } from "react";
import { TriggerConfig, TriggerType } from "../../types";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTriggers,
  selectScenarios,
  selectExecuting,
  selectStatus,
  ScenarioStatus,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  playScenarioWatcher,
  saveTriggerWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action.ts";
import { toast } from "react-toastify";
import { validateDomainPattern } from "../../utils/validationUtils.ts";
import { EXECUTION_SESSION_MAX_AGE, loadExecutionSession } from "../../utils/executionSession.ts";

// Domain triggers run once per tab and site: the scenario they start usually navigates on the same site,
// and starting it again on every page it opens would loop forever
const DOMAIN_TRIGGER_RAN_KEY = (triggerId: string) => `hi_trigger_ran_${triggerId}`;

const hasDomainTriggerRun = (triggerId: string) => {
  try {
    return sessionStorage.getItem(DOMAIN_TRIGGER_RAN_KEY(triggerId)) === "1";
  } catch {
    return false;
  }
};

const markDomainTriggerRun = (triggerId: string) => {
  try {
    sessionStorage.setItem(DOMAIN_TRIGGER_RAN_KEY(triggerId), "1");
  } catch {
    // ignore
  }
};

export const TriggerScenarioEvaluator = () => {
  const dispatch = useDispatch();
  const triggers = useSelector(selectTriggers);
  const scenarios = useSelector(selectScenarios);
  const executing = useSelector(selectExecuting);
  const status = useSelector(selectStatus);
  const [evaluationInterval] = useState(2000); // Check triggers every 2 seconds

  // Page load triggers run once per page load
  const executedPageLoadTriggers = useRef(new Set<string>());

  // Don't start scenarios while one is playing or while recording / editing
  const busyRef = useRef(false);
  busyRef.current = executing || (!!status && status !== ScenarioStatus.IDLE);

  // Pages loaded by a playing scenario (it continues here, or just finished here) don't fire triggers.
  // Null until checked.
  const loadedByPlaybackRef = useRef<boolean | null>(null);
  useEffect(() => {
    loadExecutionSession().then((session) => {
      loadedByPlaybackRef.current = !!session && Date.now() - session.updatedAt <= EXECUTION_SESSION_MAX_AGE;
    });
  }, []);

  /**
   * Evaluates a domain trigger condition using the same validation logic as TriggerForm
   * @param condition The trigger condition to evaluate
   * @returns True if the condition is met, false otherwise
   */
  const evaluateDomainTrigger = (condition: TriggerConfig["condition"]) => {
    if (!condition.domainPattern) return false;

    const { domainPattern, exactMatch, useRegex } = condition;

    // Use the same validation logic as TriggerForm
    // If validateDomainPattern returns null, the pattern matches (is valid)
    const validationError = validateDomainPattern(domainPattern, useRegex || false, exactMatch || false);
    
    // Return true if validation passes (no error), false if there's an error
    return validationError === null;
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

    // Domain triggers run once per tab and site, page load triggers once per page
    if (trigger.type === TriggerType.DOMAIN && hasDomainTriggerRun(triggerId)) {
      return false;
    }
    if (trigger.type === TriggerType.PAGE_LOAD && executedPageLoadTriggers.current.has(triggerId)) {
      return false;
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

    // Mark as executed to prevent duplicates
    if (trigger.type === TriggerType.DOMAIN) {
      markDomainTriggerRun(triggerId);
    }
    if (trigger.type === TriggerType.PAGE_LOAD) {
      executedPageLoadTriggers.current.add(triggerId);
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

      // Wait until we know whether a playing scenario loaded this page, and don't interrupt anything
      if (loadedByPlaybackRef.current !== false || busyRef.current) return;

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
