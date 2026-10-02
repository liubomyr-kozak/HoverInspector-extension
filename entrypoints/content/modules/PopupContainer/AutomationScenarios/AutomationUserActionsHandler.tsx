import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getActionableTarget,
  isTextEntryElement,
  recordClick,
  recordHover,
  recordInput,
  recordSelect,
  recordUrlNavigation,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/recordingUtils.ts";
import {
  automationActions,
  selectRecording,
  selectRecordingPaused,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import { persistEditingStateWatcher } from "@entrypoints/content/store/automation/automation.saga.action";
import { generateXPaths } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/xpathUtils.ts";
import HighlightOverlayManager from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayManager";
import { ScenarioStep } from "./types";

// Helper function to check if an element is part of the extension UI
function hasAppClass(node: any) {
  return (
    !!node &&
    ((typeof node.className === "string" && node.className.includes("hover-inspector")) ||
      node.localName === "hover-inspector")
  );
}

const HOVER_DEBOUNCE_DELAY = 300; // Time the pointer must rest on an element for the hover to count
const INPUT_DEBOUNCE_DELAY = 500;
const HOVER_CLICK_TIMEOUT = 3000; // Time window in which a hover can be attached to a following click
const HOVER_HISTORY_SIZE = 3;
const HOVER_WIDGET_DEPTH = 4; // How far up the hovered element and the clicked one may share an ancestor

type HoverEntry = { element: Element; time: number };
type PendingInput = { element: Element; timer: number };
type Feedback = { element: HTMLElement; timeoutId: number };

function showFeedback(text: string, color: string, duration: number): Feedback {
  const feedbackElement = document.createElement("div");
  feedbackElement.textContent = text;
  Object.assign(feedbackElement.style, {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: color,
    color: "white",
    padding: "8px 16px",
    borderRadius: "4px",
    zIndex: "2147483647",
  });
  document.body.appendChild(feedbackElement);
  const timeoutId = window.setTimeout(() => feedbackElement.remove(), duration);
  return { element: feedbackElement, timeoutId };
}

/**
 * AutomationUserActionsHandler Component
 *
 * Listens to user events on the page while recording and turns them into scenario steps:
 * - clicks are recorded on the closest actionable element (button, link, input...)
 * - typing is merged into a single "input" step per field
 * - a hover is recorded only when the pointer rested on another element (e.g. a menu trigger)
 *   right before a click, so plain mouse movement does not pollute the scenario
 * - select changes and SPA navigations are recorded as their own steps
 */
const AutomationUserActionsHandler: React.FC = () => {
  const dispatch = useDispatch();
  const recording = useSelector(selectRecording);
  const recordingPaused = useSelector(selectRecordingPaused);

  // Latest values for the native event listeners (they are attached once per recording session)
  const recordingRef = useRef(recording);
  const pausedRef = useRef(recordingPaused);
  recordingRef.current = recording;
  pausedRef.current = recordingPaused;

  const lastHoveredElementRef = useRef<Element | null>(null);
  const hoverDebounceTimerRef = useRef<number | null>(null);
  const hoverHistoryRef = useRef<HoverEntry[]>([]);
  const clickedElementsRef = useRef<WeakSet<Element>>(new WeakSet());
  const isHoverStepSelectedRef = useRef<boolean>(false);
  const pendingInputRef = useRef<PendingInput | null>(null);
  const alternativeXPathStepIndexRef = useRef<number | null>(null);
  const feedbackElementRef = useRef<Feedback | null>(null);
  const currentUrlRef = useRef<string>(window.location.href);

  // Drop anything that is in flight when recording is paused or stopped
  useEffect(() => {
    if (recording && !recordingPaused) return;
    if (hoverDebounceTimerRef.current) {
      window.clearTimeout(hoverDebounceTimerRef.current);
      hoverDebounceTimerRef.current = null;
    }
    if (pendingInputRef.current) {
      window.clearTimeout(pendingInputRef.current.timer);
      pendingInputRef.current = null;
    }
    hoverHistoryRef.current = [];
    lastHoveredElementRef.current = null;
    isHoverStepSelectedRef.current = false;
  }, [recording, recordingPaused]);

  useLayoutEffect(() => {
    if (!recording) return;

    currentUrlRef.current = window.location.href;

    const isActive = () => recordingRef.current && !pausedRef.current;

    const addStep = (step: ScenarioStep | null) => {
      if (!step) return;
      dispatch(automationActions.addCurrentStep(step));
      dispatch(persistEditingStateWatcher.getPayload());
    };

    const replaceFeedback = (feedback: Feedback | null) => {
      if (feedbackElementRef.current) {
        window.clearTimeout(feedbackElementRef.current.timeoutId);
        feedbackElementRef.current.element.remove();
      }
      feedbackElementRef.current = feedback;
    };

    // Writes the pending typed value immediately so steps keep the order the user performed them in
    const flushPendingInput = () => {
      const pending = pendingInputRef.current;
      if (!pending) return;
      window.clearTimeout(pending.timer);
      pendingInputRef.current = null;
      if (!isActive()) return;
      const step = recordInput(pending.element, (pending.element as HTMLInputElement).value ?? "");
      if (step) {
        dispatch(automationActions.upsertInputStep(step));
        dispatch(persistEditingStateWatcher.getPayload());
      }
    };

    const recordUrlChangeIfAny = () => {
      if (!isActive()) return;
      const newUrl = window.location.href;
      if (newUrl === currentUrlRef.current) return;
      flushPendingInput();
      currentUrlRef.current = newUrl;
      addStep(recordUrlNavigation(newUrl));
    };

    const onHover = (e: MouseEvent) => {
      if (!isActive()) return;
      if (HighlightOverlayManager.getInstance().isSelectionActive()) return;
      const rawTarget = e.target as Element;
      if (hasAppClass(rawTarget)) return;

      const target = getActionableTarget(rawTarget);
      if (!target || target === lastHoveredElementRef.current) return;
      lastHoveredElementRef.current = target;

      if (hoverDebounceTimerRef.current) {
        window.clearTimeout(hoverDebounceTimerRef.current);
      }

      hoverDebounceTimerRef.current = window.setTimeout(() => {
        hoverDebounceTimerRef.current = null;
        if (!isActive() || lastHoveredElementRef.current !== target) return;

        if (isHoverStepSelectedRef.current) {
          isHoverStepSelectedRef.current = false;
          addStep(recordHover(target));
          return;
        }

        hoverHistoryRef.current = [
          { element: target, time: Date.now() },
          ...hoverHistoryRef.current.filter((entry) => entry.element !== target),
        ].slice(0, HOVER_HISTORY_SIZE);
      }, HOVER_DEBOUNCE_DELAY);
    };

    // A hover is only worth replaying when it revealed the clicked element (dropdowns, tooltips, menus):
    // the pointer rested on a different element shortly before the click, that element was not clicked
    // itself, and both live in the same small widget (a close common ancestor that is not <body>).
    const isSameWidget = (hovered: Element, clicked: Element) => {
      let ancestor = hovered.parentElement;
      for (let depth = 0; ancestor && depth < HOVER_WIDGET_DEPTH; depth++) {
        if (ancestor === document.body || ancestor === document.documentElement) return false;
        if (ancestor.contains(clicked)) return true;
        ancestor = ancestor.parentElement;
      }
      return false;
    };

    const takeHoverBeforeClick = (clicked: Element): ScenarioStep | null => {
      const now = Date.now();
      const entry = hoverHistoryRef.current.find(
        ({ element, time }) =>
          now - time <= HOVER_CLICK_TIMEOUT &&
          element !== clicked &&
          !element.contains(clicked) &&
          !clicked.contains(element) &&
          !clickedElementsRef.current.has(element) &&
          element.isConnected &&
          !isTextEntryElement(element) &&
          isSameWidget(element, clicked),
      );
      hoverHistoryRef.current = [];
      return entry ? recordHover(entry.element) : null;
    };

    const onClick = (e: MouseEvent) => {
      if (!isActive() || e.button !== 0) return;
      const rawTarget = e.target as Element;
      const target = getActionableTarget(rawTarget);

      // Leaving a field we typed in (including pressing "Save" in the extension): commit the value first
      if (pendingInputRef.current && pendingInputRef.current.element !== target) {
        flushPendingInput();
      }

      if (hasAppClass(rawTarget) || !target) return;

      const alternativeIndex = alternativeXPathStepIndexRef.current;
      if (alternativeIndex !== null) {
        const { primaryXPath, alternativeXpaths } = generateXPaths(target);
        [primaryXPath, ...alternativeXpaths].filter(Boolean).forEach((xpath) => {
          dispatch(automationActions.addAlternativeXPathToRecordedStep({ index: alternativeIndex, xpath }));
        });
        dispatch(persistEditingStateWatcher.getPayload());
        alternativeXPathStepIndexRef.current = null;
        replaceFeedback(showFeedback("Alternative XPath added!", "#52c41a", 2000));
        return;
      }

      // Typing and select steps already focus/set these elements on playback
      if (isTextEntryElement(target) || target.tagName === "SELECT" || target.tagName === "OPTION") {
        hoverHistoryRef.current = [];
        return;
      }

      addStep(takeHoverBeforeClick(target));
      addStep(recordClick(target));
      clickedElementsRef.current.add(target);
    };

    const onInput = (e: Event) => {
      if (!isActive()) return;
      const target = e.target as Element;
      if (hasAppClass(target) || !isTextEntryElement(target)) return;

      if (pendingInputRef.current && pendingInputRef.current.element !== target) {
        flushPendingInput();
      }
      if (pendingInputRef.current) {
        window.clearTimeout(pendingInputRef.current.timer);
      }
      pendingInputRef.current = {
        element: target,
        timer: window.setTimeout(flushPendingInput, INPUT_DEBOUNCE_DELAY),
      };
    };

    const onChange = (e: Event) => {
      if (!isActive()) return;
      const target = e.target as Element;
      if (hasAppClass(target)) return;

      if (isTextEntryElement(target)) {
        // "change" fires when the field loses focus: commit the final value right away
        if (pendingInputRef.current?.element === target) flushPendingInput();
        return;
      }

      if (target.tagName === "SELECT") {
        flushPendingInput();
        addStep(recordSelect(target, (target as HTMLSelectElement).value));
      }
    };

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "SET_ALTERNATIVE_XPATH") {
        alternativeXPathStepIndexRef.current = e.data.stepIndex;
        replaceFeedback(showFeedback("Click on an element to set alternative XPath", "#1890ff", 5000));
      } else if (e.data?.type === "SELECT_HOVER_STEP") {
        isHoverStepSelectedRef.current = true;
        replaceFeedback(showFeedback("Next hover will be recorded", "#1890ff", 2000));
      }
    };

    window.addEventListener("mousemove", onHover, { capture: true });
    window.addEventListener("mousedown", onClick, { capture: true });
    window.addEventListener("input", onInput, { capture: true });
    window.addEventListener("change", onChange, { capture: true });
    window.addEventListener("message", onMessage);
    window.addEventListener("popstate", recordUrlChangeIfAny);
    window.addEventListener("hashchange", recordUrlChangeIfAny);
    window.addEventListener("beforeunload", flushPendingInput);

    // Override history methods to detect programmatic (SPA) navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(recordUrlChangeIfAny, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(recordUrlChangeIfAny, 0);
    };

    return () => {
      window.removeEventListener("mousemove", onHover, { capture: true });
      window.removeEventListener("mousedown", onClick, { capture: true });
      window.removeEventListener("input", onInput, { capture: true });
      window.removeEventListener("change", onChange, { capture: true });
      window.removeEventListener("message", onMessage);
      window.removeEventListener("popstate", recordUrlChangeIfAny);
      window.removeEventListener("hashchange", recordUrlChangeIfAny);
      window.removeEventListener("beforeunload", flushPendingInput);

      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;

      if (hoverDebounceTimerRef.current) {
        window.clearTimeout(hoverDebounceTimerRef.current);
        hoverDebounceTimerRef.current = null;
      }
      if (pendingInputRef.current) {
        window.clearTimeout(pendingInputRef.current.timer);
        pendingInputRef.current = null;
      }
      replaceFeedback(null);
    };
  }, [recording, dispatch]);

  return null;
};

export default AutomationUserActionsHandler;
