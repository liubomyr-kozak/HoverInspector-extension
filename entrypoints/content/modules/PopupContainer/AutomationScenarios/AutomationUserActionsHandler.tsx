import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import {
  getActionableTarget,
  getEditableRoot,
  getSelectValue,
  getTypedValue,
  isTextEntryElement,
  recordClick,
  recordHover,
  recordInput,
  recordKeyPress,
  recordSelect,
  recordUrlNavigation,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/recordingUtils.ts";
import {
  automationActions,
  selectRecording,
  selectRecordingPaused,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  persistEditingStateWatcher,
  syncRecordingStateWatcher,
} from "@entrypoints/content/store/automation/automation.saga.action";
import { generateXPaths } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/xpathUtils.ts";
import {
  formatKeyCombo,
  shouldRecordKeyPress,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/keyboardUtils.ts";
import HighlightOverlayManager from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayManager";
import { ScenarioStep, StepType } from "./types";

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
type KeyEntry = { element: Element; key: string; time: number };
type PendingEnter = { element: Element; key: string; submitted: boolean };

// How long after a key press a click or change counts as caused by that key
const KEY_EFFECT_WINDOW = 1000;

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
  const store = useStore<any>();
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
  const lastPointerTargetRef = useRef<{ element: Element; time: number } | null>(null);
  const lastKeyRef = useRef<KeyEntry | null>(null);
  const pendingEnterRef = useRef<PendingEnter | null>(null);

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
    lastKeyRef.current = null;
    pendingEnterRef.current = null;
  }, [recording, recordingPaused]);

  useLayoutEffect(() => {
    if (!recording) return;

    currentUrlRef.current = window.location.href;

    const isActive = () => recordingRef.current && !pausedRef.current;
    // Picking an element for a step ("Pick on page"): that click, and the keys of the pick, are not the user's actions
    const isPicking = () => HighlightOverlayManager.getInstance().isSelectionActive();

    // The recording continues on a new page (a link, a form submit, a reload): note the page change.
    // It also keeps typing on this page from being merged into the input step of the previous page.
    const recordedSteps: ScenarioStep[] = store.getState().automation?.currentSteps || [];
    const lastNavigation = [...recordedSteps].reverse().find((step) => step.type === StepType.NAVIGATE);
    if (isActive() && lastNavigation && lastNavigation.value !== window.location.href) {
      dispatch(automationActions.addCurrentStep(recordUrlNavigation(window.location.href)));
      dispatch(persistEditingStateWatcher.getPayload());
    }

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
      const step = recordInput(pending.element, getTypedValue(pending.element));
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
      if (!isActive() || isPicking()) return;
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
          // Options and editors are not menus: hovering them reveals nothing
          !element.closest("select") &&
          !getEditableRoot(element) &&
          isSameWidget(element, clicked),
      );
      hoverHistoryRef.current = [];
      return entry ? recordHover(entry.element) : null;
    };

    const onClick = (e: MouseEvent) => {
      if (!isActive() || e.button !== 0 || isPicking()) return;
      const rawTarget = e.target as Element;
      // Inside a rich text editor the click only places the caret: the typing is recorded as one input step
      const target = getEditableRoot(rawTarget) || getActionableTarget(rawTarget);

      // Leaving a field we typed in (including pressing "Save" in the extension): commit the value first
      if (pendingInputRef.current && pendingInputRef.current.element !== target) {
        flushPendingInput();
      }

      if (hasAppClass(rawTarget) || !target) return;
      lastPointerTargetRef.current = { element: target, time: Date.now() };

      // A click on a SPA link may have changed the URL without a page load: keep the steps in order
      recordUrlChangeIfAny();

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
      if (!isActive() || isPicking()) return;
      const target = getEditableRoot(e.target as Element) || (e.target as Element);
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
      if (!isActive() || isPicking()) return;
      const target = e.target as Element;
      if (hasAppClass(target)) return;

      if (isTextEntryElement(target)) {
        // "change" fires when the field loses focus: commit the final value right away
        if (pendingInputRef.current?.element === target) flushPendingInput();
        return;
      }

      // Space on a checkbox, Space / arrow keys on a radio: no mousedown, so the click was not recorded.
      // Record it from the change, but only right after a key on that box (or its radio group): changes
      // made by the page's own scripts are not the user's
      if (isToggleInput(target)) {
        if (!wasChangedByKey(target as HTMLInputElement)) return;
        flushPendingInput();
        lastKeyRef.current = null;
        const box = target as HTMLInputElement;
        const step = recordClick(box);
        if (!step) return;
        // recordClick reads the state a click leads to before the click; the box has its new state already
        if (box.type === "checkbox") step.value = box.checked ? "checked" : "unchecked";
        addStep(step);
        return;
      }

      if (target.tagName === "SELECT") {
        flushPendingInput();
        const select = target as HTMLSelectElement;
        const step = recordSelect(select, getSelectValue(select));
        if (!step) return;
        if (select.multiple) {
          // Ctrl/Shift-clicking several options is one choice: keep a single step with the final selection
          dispatch(automationActions.upsertLastStep(step));
          dispatch(persistEditingStateWatcher.getPayload());
        } else {
          addStep(step);
        }
      }
    };

    // Pressing Enter in a field submits its form without any mouse click: record it as a click on the form's
    // submit button (the browser does the same), so playback submits the form too
    // A form without a submit button submitted by Enter in its only field is recorded as that key press: playback
    // presses Enter there, which submits the form the same way (requestSubmit)
    const onSubmit = (e: SubmitEvent) => {
      if (!isActive() || isPicking()) return;
      const form = e.target as HTMLFormElement;
      if (hasAppClass(form)) return;
      const pendingEnter = pendingEnterRef.current;
      const byEnter = !!pendingEnter && !pendingEnter.submitted && form.contains(pendingEnter.element);
      if (byEnter) pendingEnter!.submitted = true;
      const submitter = e.submitter;
      if (!submitter) {
        if (byEnter) {
          flushPendingInput();
          addStep(recordKeyPress(pendingEnter!.element, pendingEnter!.key));
        }
        return;
      }
      if (hasAppClass(submitter)) return;
      flushPendingInput();
      const last = lastPointerTargetRef.current;
      if (last && Date.now() - last.time < 2000 && (last.element === submitter || last.element.contains(submitter))) return;
      addStep(recordClick(submitter));
      lastPointerTargetRef.current = { element: submitter, time: Date.now() };
    };

    const isToggleInput = (element: Element) =>
      element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio");

    // Whether the user's last key changed this checkbox / radio (arrow keys move the check to another radio of the group)
    const wasChangedByKey = (box: HTMLInputElement) => {
      const last = lastKeyRef.current;
      if (!last || Date.now() - last.time > KEY_EFFECT_WINDOW) return false;
      if (last.element === box) return last.key === " ";
      const pointer = lastPointerTargetRef.current;
      if (pointer && Date.now() - pointer.time < KEY_EFFECT_WINDOW) return false;
      return (
        box.type === "radio" &&
        last.element instanceof HTMLInputElement &&
        last.element.type === "radio" &&
        !!box.name &&
        last.element.name === box.name &&
        last.element.form === box.form &&
        /^Arrow/.test(last.key)
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isActive() || isPicking()) return;
      const target = e.target as Element;
      if (!(target instanceof Element) || hasAppClass(target)) return;
      lastKeyRef.current = { element: target, key: e.key, time: Date.now() };
      if (!shouldRecordKeyPress(e, target)) return;

      // What was typed comes before the key that follows it
      flushPendingInput();
      const key = formatKeyCombo(e);

      if (e.key === "Enter" && isTextEntryElement(target)) {
        // Enter in a field may submit its form (a click on its submit button, or a form without one: see onSubmit).
        // The submit event follows this keydown in the same task: decide once it had the chance to fire.
        const pending: PendingEnter = { element: target, key, submitted: false };
        pendingEnterRef.current = pending;
        window.setTimeout(() => {
          if (pendingEnterRef.current === pending) pendingEnterRef.current = null;
          if (!pending.submitted && isActive()) addStep(recordKeyPress(target, key));
        }, 0);
        return;
      }
      addStep(recordKeyPress(target, key));
    };

    // Enter / Space on a button or a link makes the browser fire a click without any mousedown: record it as a click
    const onKeyboardClick = (e: MouseEvent) => {
      if (!isActive() || e.detail !== 0 || isPicking()) return;
      const last = lastKeyRef.current;
      if (!last || (last.key !== "Enter" && last.key !== " ") || Date.now() - last.time > KEY_EFFECT_WINDOW) return;
      const rawTarget = e.target as Element;
      if (hasAppClass(rawTarget)) return;
      const target = getActionableTarget(rawTarget);
      if (!target || !(last.element === rawTarget || last.element === target || last.element.contains(rawTarget))) return;
      // Checkboxes and radios are recorded from their change, fields and selects by their own steps
      if (isToggleInput(target) || isTextEntryElement(target) || target.tagName === "SELECT" || target.tagName === "OPTION") {
        return;
      }
      lastKeyRef.current = null;
      flushPendingInput();
      addStep(recordClick(target));
      lastPointerTargetRef.current = { element: target, time: Date.now() };
      clickedElementsRef.current.add(target);
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
    window.addEventListener("submit", onSubmit, { capture: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("click", onKeyboardClick, { capture: true });
    window.addEventListener("message", onMessage);
    window.addEventListener("popstate", recordUrlChangeIfAny);
    window.addEventListener("hashchange", recordUrlChangeIfAny);
    window.addEventListener("beforeunload", flushPendingInput);

    // The same recording may continue in another tab (e.g. a link opened in a new tab):
    // save what was typed here before leaving, and take the steps recorded there when coming back
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingInput();
      } else {
        dispatch(syncRecordingStateWatcher.getPayload());
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // SPA navigation (history.pushState/replaceState) fires no event the page can listen to, and patching
    // history here would not help: this script runs in an isolated world, apart from the page's scripts.
    // The Navigation API reports those URL changes to every world; a slow poll covers browsers without it.
    const navigation = (window as any).navigation as EventTarget | undefined;
    const onEntryChange = () => recordUrlChangeIfAny();
    navigation?.addEventListener?.("currententrychange", onEntryChange);
    const urlPoll = window.setInterval(recordUrlChangeIfAny, 1000);

    return () => {
      window.removeEventListener("mousemove", onHover, { capture: true });
      window.removeEventListener("mousedown", onClick, { capture: true });
      window.removeEventListener("input", onInput, { capture: true });
      window.removeEventListener("change", onChange, { capture: true });
      window.removeEventListener("submit", onSubmit, { capture: true });
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("click", onKeyboardClick, { capture: true });
      window.removeEventListener("message", onMessage);
      window.removeEventListener("popstate", recordUrlChangeIfAny);
      window.removeEventListener("hashchange", recordUrlChangeIfAny);
      window.removeEventListener("beforeunload", flushPendingInput);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      navigation?.removeEventListener?.("currententrychange", onEntryChange);
      window.clearInterval(urlPoll);

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
