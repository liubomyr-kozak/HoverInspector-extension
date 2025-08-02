import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  recordClick,
  recordHover,
  recordInput,
  recordSelect,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/recordingUtils.ts";
import { automationActions, selectRecording, selectRecordingPaused } from "@entrypoints/content/store/automation/automation.slice.ts";
import { generateXPath, generateXPaths } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/xpathUtils.ts";

// Helper function to check if an element is part of the extension UI
function hasAppClass(node: any) {
  return (
    (typeof node.className === "string" && node.className.includes("zTool")) || node.localName === "hover-inspector"
  );
}

const HOVER_DEBOUNCE_DELAY = 300;
const INPUT_DEBOUNCE_DELAY = 500;
const HOVER_CLICK_TIMEOUT = 2000; // Time window to wait for a click after hover

/**
 * AutomationUserActionsHandler Component
 *
 * This component handles user events specifically for the automation recording functionality.
 * It attaches event listeners to the window for various user events (mousemove, mousedown, input, change)
 * and records these actions when recording is active.
 */
const AutomationUserActionsHandler: React.FC = () => {
  const dispatch = useDispatch();
  const recording = useSelector(selectRecording);
  const recordingPaused = useSelector(selectRecordingPaused);
  // Ref to track the last hovered element's xpath to prevent duplicate hover steps
  const lastHoveredXpathRef = useRef<string | null>(null);
  // Ref to track the debounce timer for hover events
  const hoverDebounceTimerRef = useRef<number | null>(null);
  // Ref to track pending hover steps (waiting for click confirmation)
  const pendingHoverStepRef = useRef<{ step: any, timer: number } | null>(null);
  // Ref to track if a hover step was explicitly selected
  const isHoverStepSelectedRef = useRef<boolean>(false);

  // Ref to track the last input element's xpath and value
  const lastInputXpathRef = useRef<string | null>(null);
  // Ref to track the debounce timer for input events
  const inputDebounceTimerRef = useRef<number | null>(null);
  // Debounce delay in milliseconds for input events
  
  // State for alternative XPath selection
  const [alternativeXPathMode, setAlternativeXPathMode] = useState(false);
  const [alternativeXPathStepIndex, setAlternativeXPathStepIndex] = useState<number | null>(null);
  
  // Ref to store feedback element and timeout ID
  const feedbackElementRef = useRef<{ element: HTMLElement, timeoutId: number } | null>(null);

  // Function to explicitly select a hover step
  const selectHoverStep = useCallback(() => {
    isHoverStepSelectedRef.current = true;
    
    // Show feedback to the user
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = 'Next hover will be recorded';
    feedbackElement.style.position = 'fixed';
    feedbackElement.style.top = '20px';
    feedbackElement.style.left = '50%';
    feedbackElement.style.transform = 'translateX(-50%)';
    feedbackElement.style.backgroundColor = '#1890ff';
    feedbackElement.style.color = 'white';
    feedbackElement.style.padding = '8px 16px';
    feedbackElement.style.borderRadius = '4px';
    feedbackElement.style.zIndex = '9999';
    document.body.appendChild(feedbackElement);
    
    // Remove the feedback element after 2 seconds
    const timeoutId = setTimeout(() => {
      if (document.body.contains(feedbackElement)) {
        document.body.removeChild(feedbackElement);
      }
    }, 2000);
    
    // Store the feedback element and timeout ID
    if (feedbackElementRef.current) {
      clearTimeout(feedbackElementRef.current.timeoutId);
      if (document.body.contains(feedbackElementRef.current.element)) {
        document.body.removeChild(feedbackElementRef.current.element);
      }
    }
    feedbackElementRef.current = { element: feedbackElement, timeoutId };
  }, []);

  // Skip if recording is not active or is paused
  if (!recording || recordingPaused) {
    // Clear the timers if recording is stopped or paused
    if (hoverDebounceTimerRef.current) {
      window.clearTimeout(hoverDebounceTimerRef.current);
      hoverDebounceTimerRef.current = null;
    }

    if (inputDebounceTimerRef.current) {
      window.clearTimeout(inputDebounceTimerRef.current);
      inputDebounceTimerRef.current = null;
    }
    
    // Clear any pending hover step
    if (pendingHoverStepRef.current) {
      window.clearTimeout(pendingHoverStepRef.current.timer);
      pendingHoverStepRef.current = null;
    }
    
    // If recording is active but paused, still render the component but don't record actions
    if (recording && recordingPaused) {
      return null;
    }
    
    // If recording is not active, don't render the component
    return null;
  }

  // Handler for mousemove events (hovering over elements)
  const onHandlerHover = useCallback(
    (e: any) => {
      const hoveredElement = e.target;

      // Skip if the element is part of the extension UI
      if (hasAppClass(hoveredElement)) {
        return;
      }

      // Get hover step object
      const step = recordHover(hoveredElement);
      if (step) {
        // Only proceed if the xpath is different from the last one
        // This prevents recording duplicate hover steps for the same element
        if (step.xpath !== lastHoveredXpathRef.current) {
          // Clear any existing hover debounce timer
          if (hoverDebounceTimerRef.current) {
            window.clearTimeout(hoverDebounceTimerRef.current);
          }

          // Clear any existing pending hover step timer
          if (pendingHoverStepRef.current) {
            window.clearTimeout(pendingHoverStepRef.current.timer);
            pendingHoverStepRef.current = null;
          }

          // Set a new timer to process the hover after a delay
          hoverDebounceTimerRef.current = window.setTimeout(() => {
            // Update the last hovered xpath
            lastHoveredXpathRef.current = step.xpath!;
            
            // If hover step is explicitly selected, record it immediately
            if (isHoverStepSelectedRef.current) {
              dispatch(automationActions.addRecordedStep(step));
              isHoverStepSelectedRef.current = false; // Reset the flag
            } else {
              // Otherwise, store it as pending and wait for a click
              const timer = window.setTimeout(() => {
                // If no click happens within the timeout, discard the hover step
                pendingHoverStepRef.current = null;
              }, HOVER_CLICK_TIMEOUT);
              
              pendingHoverStepRef.current = { step, timer };
            }
            
            // Clear the debounce timer reference
            hoverDebounceTimerRef.current = null;
          }, HOVER_DEBOUNCE_DELAY);
        }
      }
    },
    [dispatch, HOVER_DEBOUNCE_DELAY, HOVER_CLICK_TIMEOUT],
  );

  // Handler for mousedown events (clicking on elements)
  const onHandlerClick = useCallback(
    (e: any) => {
      const clickedElement = e.target;

      // Skip if the element is part of the extension UI
      if (hasAppClass(clickedElement)) {
        return;
      }

      // If in alternative XPath selection mode, add the alternative XPath to the step
      if (alternativeXPathMode && alternativeXPathStepIndex !== null) {
        const { primaryXPath, alternativeXpaths } = generateXPaths(clickedElement);
        if (primaryXPath) {
          // Add all generated XPaths as alternatives
          alternativeXpaths.forEach(xpath => {
            dispatch(automationActions.addAlternativeXPathToRecordedStep({ 
              index: alternativeXPathStepIndex, 
              xpath 
            }));
          });
          
          // Exit alternative XPath selection mode
          setAlternativeXPathMode(false);
          setAlternativeXPathStepIndex(null);
          
          // Clean up the existing feedback element if it exists
          if (feedbackElementRef.current) {
            clearTimeout(feedbackElementRef.current.timeoutId);
            if (document.body.contains(feedbackElementRef.current.element)) {
              document.body.removeChild(feedbackElementRef.current.element);
            }
            feedbackElementRef.current = null;
          }
          
          // Show a visual feedback that the XPath was added
          const feedbackElement = document.createElement('div');
          feedbackElement.textContent = 'Alternative XPath added!';
          feedbackElement.style.position = 'fixed';
          feedbackElement.style.top = '20px';
          feedbackElement.style.left = '50%';
          feedbackElement.style.transform = 'translateX(-50%)';
          feedbackElement.style.backgroundColor = '#52c41a';
          feedbackElement.style.color = 'white';
          feedbackElement.style.padding = '8px 16px';
          feedbackElement.style.borderRadius = '4px';
          feedbackElement.style.zIndex = '9999';
          document.body.appendChild(feedbackElement);
          
          // Remove the feedback element after 2 seconds
          const timeoutId = setTimeout(() => {
            if (document.body.contains(feedbackElement)) {
              document.body.removeChild(feedbackElement);
            }
          }, 2000);
          
          // Store the new feedback element and timeout ID
          feedbackElementRef.current = { element: feedbackElement, timeoutId };
          
          return;
        }
      }

      // Check if there's a pending hover step
      if (pendingHoverStepRef.current) {
        // Record the pending hover step before the click
        dispatch(automationActions.addRecordedStep(pendingHoverStepRef.current.step));
        
        // Clear the pending hover timer
        window.clearTimeout(pendingHoverStepRef.current.timer);
        pendingHoverStepRef.current = null;
      }

      // Normal click recording
      const step = recordClick(clickedElement);
      if (step) {
        dispatch(automationActions.addRecordedStep(step));
      }
    },
    [dispatch, alternativeXPathMode, alternativeXPathStepIndex, feedbackElementRef],
  );

  // Handler for input events (typing in text fields)
  const onHandlerInput = useCallback(
    (e: any) => {
      // Skip if the element is part of the extension UI
      if (hasAppClass(e.target)) {
        return;
      }

      // Record input action if it's an input or textarea element
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        const step = recordInput(e.target, e.target.value);
        if (step) {
          // Clear any existing timer
          if (inputDebounceTimerRef.current) {
            window.clearTimeout(inputDebounceTimerRef.current);
          }

          // Set a new timer to record the input after a delay
          inputDebounceTimerRef.current = window.setTimeout(() => {
            // Update the last input xpath
            lastInputXpathRef.current = step.xpath!;
            // Dispatch the step to the store
            dispatch(automationActions.addRecordedStep(step));
            // Clear the timer reference
            inputDebounceTimerRef.current = null;
          }, INPUT_DEBOUNCE_DELAY);
        }
      }
    },
    [dispatch, INPUT_DEBOUNCE_DELAY],
  );

  // Handler for change events (selecting options from dropdowns)
  const onHandlerChange = useCallback(
    (e: any) => {
      // Skip if the element is part of the extension UI
      if (hasAppClass(e.target)) {
        return;
      }

      // Record select action if it's a select element
      if (e.target.tagName === "SELECT") {
        const step = recordSelect(e.target, e.target.value);
        if (step) {
          dispatch(automationActions.addRecordedStep(step));
        }
      }
    },
    [dispatch],
  );

  // Handler for message events (for alternative XPath selection and hover step selection)
  const onHandlerMessage = useCallback(
    (e: MessageEvent) => {
      // Check if the message is for alternative XPath selection
      if (e.data && e.data.type === 'SET_ALTERNATIVE_XPATH') {
        console.log('Received SET_ALTERNATIVE_XPATH message:', e.data);
        
        // Enter alternative XPath selection mode
        setAlternativeXPathMode(true);
        setAlternativeXPathStepIndex(e.data.stepIndex);
        
        // Show a visual feedback that we're in alternative XPath selection mode
        const feedbackElement = document.createElement('div');
        feedbackElement.textContent = 'Click on an element to set alternative XPath';
        feedbackElement.style.position = 'fixed';
        feedbackElement.style.top = '20px';
        feedbackElement.style.left = '50%';
        feedbackElement.style.transform = 'translateX(-50%)';
        feedbackElement.style.backgroundColor = '#1890ff';
        feedbackElement.style.color = 'white';
        feedbackElement.style.padding = '8px 16px';
        feedbackElement.style.borderRadius = '4px';
        feedbackElement.style.zIndex = '9999';
        document.body.appendChild(feedbackElement);
        
        // Remove the feedback element after 5 seconds or when a click is made
        const timeoutId = setTimeout(() => {
          if (document.body.contains(feedbackElement)) {
            document.body.removeChild(feedbackElement);
          }
        }, 5000);
        
        // Store the element and timeout ID for cleanup
        const feedbackInfo = { element: feedbackElement, timeoutId };
        
        // Update the ref to the feedback info
        feedbackElementRef.current = feedbackInfo;
      }
      // Check if the message is for explicit hover step selection
      else if (e.data && e.data.type === 'SELECT_HOVER_STEP') {
        console.log('Received SELECT_HOVER_STEP message');
        
        // Use the selectHoverStep function to handle hover step selection
        selectHoverStep();
      }
    },
    [feedbackElementRef, selectHoverStep]
  );

  // Attach event listeners when the component mounts
  useLayoutEffect(() => {
    window.addEventListener("mousemove", onHandlerHover, { capture: true });
    window.addEventListener("mousedown", onHandlerClick, { capture: true });
    window.addEventListener("input", onHandlerInput, { capture: true });
    window.addEventListener("change", onHandlerChange, { capture: true });
    window.addEventListener("message", onHandlerMessage);

    // Clean up event listeners when the component unmounts
    return () => {
      // Remove event listeners
      window.removeEventListener("mousemove", onHandlerHover, { capture: true });
      window.removeEventListener("mousedown", onHandlerClick, { capture: true });
      window.removeEventListener("input", onHandlerInput, { capture: true });
      window.removeEventListener("change", onHandlerChange, { capture: true });
      window.removeEventListener("message", onHandlerMessage);

      // Clear any pending debounce timer
      if (hoverDebounceTimerRef.current) {
        window.clearTimeout(hoverDebounceTimerRef.current);
        hoverDebounceTimerRef.current = null;
      }
      
      // Clean up feedback element if it exists
      if (feedbackElementRef.current) {
        clearTimeout(feedbackElementRef.current.timeoutId);
        if (document.body.contains(feedbackElementRef.current.element)) {
          document.body.removeChild(feedbackElementRef.current.element);
        }
      }
    };
  }, [onHandlerHover, onHandlerClick, onHandlerInput, onHandlerChange, onHandlerMessage]);

  return null;
};

export default AutomationUserActionsHandler;
