import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  ScenarioStatus,
  selectExecuting,
  selectRecording,
  selectScenarios,
  selectStatus,
} from "@entrypoints/content/store/automation/automation.slice";
import { loadScenariosWatcher, saveScenarioWatcher } from "@entrypoints/content/store/automation/automation.saga.action";
import { useScenarioActions } from "../hooks/useScenarioActions";
import { formatKeyCombo, shouldRecordKeyPress } from "../utils/keyboardUtils";
import {
  getActionableTarget,
  getCheckboxTargetState,
  getEditableRoot,
  getSelectValue,
  getTypedValue,
  isTextEntryElement,
} from "../utils/recordingUtils";
import { generateXPaths } from "../utils/xpathUtils";
import { Scenario, ScenarioMap } from "../types";
import { LiveWatchContext, LiveWatchController } from "./LiveWatchContext";
import { SuggestionCard } from "./components/SuggestionCard";
import {
  dismissPattern,
  flushWatchEvents,
  loadWatchEvents,
  muteField,
  queueWatchEvent,
  useLiveWatchSettings,
} from "./store";
import { DetectedPattern, LiveWatchSettings, Suggestion, SuggestionKind, WatchEvent, WatchEventKind } from "./types";
import { RunPhase, usePatternRun } from "./usePatternRun";
import { elementLabel, isActionableElement, isExtensionTarget, isSensitiveField } from "./utils/dom";
import {
  eventSignature,
  eventsToSteps,
  findFieldScenarios,
  findPatterns,
  isPatternSaved,
  matchPatternContinuation,
  matchScenarioContinuation,
  WATCH_EVENT_LIMIT,
} from "./utils/patterns";

/** Look for patterns once the page is idle, at most this long after the last action */
const ANALYSIS_TIMEOUT_MS = 1500;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const newEventId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Identifies a suggestion, so one the user closed is not shown again on this page */
const suggestionKey = (suggestion: Suggestion): string => {
  switch (suggestion.kind) {
    case SuggestionKind.FIELD:
      return `field:${suggestion.fieldXpath}`;
    case SuggestionKind.CONTINUE_SCENARIO:
      return `scenario:${suggestion.scenarioId}:${suggestion.nextStepIndex}`;
    case SuggestionKind.CONTINUE_PATTERN:
      return `continue:${suggestion.pattern.id}`;
    default:
      return `pattern:${suggestion.pattern.id}`;
  }
};

const patternTitle = (pattern: DetectedPattern): string => {
  const labels = pattern.events.map((event) => event.label).filter(Boolean);
  const shown = labels.slice(0, 3).join(", ") + (labels.length > 3 ? "…" : "");
  return [shown || "Repeated steps", window.location.hostname].filter(Boolean).join(" · ");
};

/**
 * Live watching: while it is on (off by default), notes the user's clicks, typing, choices and keys on the
 * page, finds sequences they repeat and offers to replay them or save them as a scenario. It also offers to
 * finish a pattern or a saved scenario the user has started by hand, and lists the scenarios that use a
 * field the user clicks.
 *
 * Built for busy pages: passive capture listeners, locators computed after the page's own handlers ran,
 * analysis in idle time, storage writes in batches. Synthetic events (scenario playback, this replay) are
 * never watched: only `isTrusted` events count.
 */
export const LiveWatcher: React.FC = () => {
  const settings = useLiveWatchSettings();
  const recording = useSelector(selectRecording);
  const executing = useSelector(selectExecuting);
  const status = useSelector(selectStatus);
  const scenarios = useSelector(selectScenarios) as ScenarioMap;
  const dispatch = useDispatch();
  const { playScenario } = useScenarioActions();
  const { run, runRef, start, stop, doStep, skip, userDidStep } = usePatternRun();

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const suggestionRef = useRef(suggestion);
  suggestionRef.current = suggestion;

  const eventsRef = useRef<WatchEvent[]>([]);
  const patternsRef = useRef<DetectedPattern[]>([]);
  // The whole pattern being replayed (a continuation replays only its rest), for "Save as scenario"
  const runPatternRef = useRef<DetectedPattern | null>(null);
  // Text typed per field on this page; memory only, never stored
  const typedValuesRef = useRef(new Map<string, string>());
  const committedRef = useRef(new WeakMap<Element, string>());
  const closedKeysRef = useRef(new Set<string>());
  const shownPatternsRef = useRef(new Set<string>());

  const settingsRef = useRef<LiveWatchSettings>(settings);
  settingsRef.current = settings;
  const scenariosRef = useRef(scenarios);
  scenariosRef.current = scenarios;
  const executingRef = useRef(executing);
  executingRef.current = executing;

  const active = settings.enabled && !recording;

  // Saved scenarios are loaded when the Automation panel opens; live watching needs them earlier
  const scenariosRequested = useRef(false);
  useEffect(() => {
    if (!active || scenariosRequested.current || Object.keys(scenarios || {}).length) return;
    scenariosRequested.current = true;
    dispatch(loadScenariosWatcher.getPayload());
  }, [active, scenarios, dispatch]);

  // Turned off or recording started: drop the card and anything in flight
  useEffect(() => {
    if (active) return;
    stop();
    setSuggestion(null);
  }, [active, stop]);

  const analyze = useCallback(() => {
    const origin = window.location.origin;
    const events = eventsRef.current.filter((event) => event.origin === origin);
    const { dismissedPatterns } = settingsRef.current;
    const saved = scenariosRef.current || {};
    const patterns = findPatterns(events).filter(
      (pattern) => !dismissedPatterns.includes(pattern.id) && !isPatternSaved(pattern, saved),
    );
    patternsRef.current = patterns;
    if (runRef.current) return;

    let next: Suggestion | null = null;
    const scenarioMatch = matchScenarioContinuation(events, saved);
    const patternMatch = matchPatternContinuation(events, patterns);
    const fresh = patterns.find((pattern) => pattern.lastEnd === events.length && !shownPatternsRef.current.has(pattern.id));
    if (scenarioMatch) next = { kind: SuggestionKind.CONTINUE_SCENARIO, ...scenarioMatch };
    else if (patternMatch) next = { kind: SuggestionKind.CONTINUE_PATTERN, ...patternMatch };
    else if (fresh) next = { kind: SuggestionKind.PATTERN, pattern: fresh };
    if (next && closedKeysRef.current.has(suggestionKey(next))) next = null;
    if (next?.kind === SuggestionKind.PATTERN) shownPatternsRef.current.add(next.pattern.id);

    setSuggestion((previous) => {
      if (next) return next;
      // An offer to continue is stale once the user did something else; other cards stay until closed
      return previous && previous.kind !== SuggestionKind.CONTINUE_PATTERN && previous.kind !== SuggestionKind.CONTINUE_SCENARIO
        ? previous
        : null;
    });
  }, [runRef]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let idleHandle: number | null = null;
    const idleWindow = window as IdleWindow;

    const scheduleAnalysis = () => {
      if (idleHandle !== null) return;
      const runAnalysis = () => {
        idleHandle = null;
        if (!cancelled) analyze();
      };
      idleHandle = idleWindow.requestIdleCallback
        ? idleWindow.requestIdleCallback(runAnalysis, { timeout: ANALYSIS_TIMEOUT_MS })
        : window.setTimeout(runAnalysis, 300);
    };

    loadWatchEvents()
      .then((events) => {
        if (cancelled) return;
        eventsRef.current = events;
        scheduleAnalysis();
      })
      .catch(() => undefined);

    const isWatching = () => !executingRef.current;

    const addEvent = (kind: WatchEventKind, element: Element, value?: string) => {
      if (!element.isConnected) return;
      const { primaryXPath, alternativeXpaths } = generateXPaths(element);
      if (!primaryXPath) return;
      const event: WatchEvent = {
        id: newEventId(),
        kind,
        xpath: primaryXPath,
        alternativeXpaths: alternativeXpaths.slice(0, 3),
        label: elementLabel(element),
        origin: window.location.origin,
        time: Date.now(),
        ...(value !== undefined ? { value } : {}),
      };

      // Replaying a pattern: these are the user's own steps, not new actions to learn from
      const currentRun = runRef.current;
      if (currentRun) {
        const expected = currentRun.events[currentRun.index];
        const waiting = currentRun.phase === RunPhase.WAITING_USER || currentRun.phase === RunPhase.WAITING_VALUE;
        if (waiting && expected && eventSignature(expected) === eventSignature(event)) userDidStep();
        return;
      }

      eventsRef.current.push(event);
      if (eventsRef.current.length > WATCH_EVENT_LIMIT) eventsRef.current.splice(0, eventsRef.current.length - WATCH_EVENT_LIMIT);
      queueWatchEvent(event);
      scheduleAnalysis();
    };

    // Locators need several XPath lookups: compute them after the page's own handlers ran
    const later = (task: () => void) => window.setTimeout(task, 0);

    const commitTyping = (field: Element) => {
      // Password and card fields are never read: only the fact that they were filled is noted (once per second)
      const sensitive = isSensitiveField(field);
      const value = sensitive ? `\u0000${Math.floor(Date.now() / 1000)}` : getTypedValue(field);
      if (committedRef.current.get(field) === value) return;
      committedRef.current.set(field, value);
      if (!sensitive) {
        const { primaryXPath } = generateXPaths(field);
        if (primaryXPath) typedValuesRef.current.set(primaryXPath, value);
      }
      addEvent(WatchEventKind.INPUT, field);
    };

    const suggestFieldScenarios = (field: Element) => {
      if (runRef.current) return;
      const { primaryXPath, alternativeXpaths } = generateXPaths(field);
      if (!primaryXPath || settingsRef.current.mutedFields.includes(primaryXPath)) return;
      const current = suggestionRef.current;
      if (current?.kind === SuggestionKind.FIELD && current.fieldXpath === primaryXPath) return;
      const matches = findFieldScenarios([primaryXPath, ...alternativeXpaths], scenariosRef.current || {});
      if (!matches.length) return;
      const next: Suggestion = { kind: SuggestionKind.FIELD, fieldXpath: primaryXPath, fieldLabel: elementLabel(field), matches };
      if (!closedKeysRef.current.has(suggestionKey(next))) setSuggestion(next);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!e.isTrusted || e.button !== 0 || !isWatching() || isExtensionTarget(e.target)) return;
      const raw = e.target as Element;
      const editable = getEditableRoot(raw);
      const target = editable || getActionableTarget(raw);
      if (!target) return;
      if (editable || isTextEntryElement(target) || target.tagName === "SELECT") {
        // Typing and choices are watched from their change; clicking a field may show its scenarios
        later(() => target.isConnected && suggestFieldScenarios(target));
        return;
      }
      if (target.tagName === "OPTION") return;
      // Clicking "Save" right after typing: the field's change fires after this, but the typing came first
      const focused = document.activeElement ? getEditableRoot(document.activeElement) || document.activeElement : null;
      if (focused && focused !== target && isTextEntryElement(focused)) later(() => commitTyping(focused));
      // Read before the click toggles it
      const checkboxState = getCheckboxTargetState(target) ?? undefined;
      later(() => isActionableElement(target) && addEvent(WatchEventKind.CLICK, target, checkboxState));
    };

    const onChange = (e: Event) => {
      if (!e.isTrusted || !isWatching() || isExtensionTarget(e.target)) return;
      const target = e.target as Element;
      if (isTextEntryElement(target)) {
        later(() => commitTyping(target));
      } else if (target instanceof HTMLSelectElement) {
        const value = getSelectValue(target);
        later(() => addEvent(WatchEventKind.SELECT, target, value));
      }
    };

    // Rich text editors fire no change: commit their text when they lose the focus
    const onFocusOut = (e: FocusEvent) => {
      if (!e.isTrusted || !isWatching()) return;
      const editable = e.target instanceof Element ? getEditableRoot(e.target) : null;
      if (editable && editable === e.target) later(() => commitTyping(editable));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.isTrusted || !isWatching() || isExtensionTarget(e.target) || !(e.target instanceof Element)) return;
      const target = e.target;
      if (!shouldRecordKeyPress(e, target)) return;
      const key = formatKeyCombo(e);
      // What was typed comes before the key (Enter usually submits it)
      const field = getEditableRoot(target) || target;
      if (isTextEntryElement(field)) commitTyping(field);
      later(() => addEvent(WatchEventKind.KEY_PRESS, target, key));
    };

    const onHide = () => {
      if (document.visibilityState === "hidden") flushWatchEvents();
    };

    const options = { capture: true, passive: true } as const;
    window.addEventListener("mousedown", onMouseDown, options);
    window.addEventListener("change", onChange, options);
    window.addEventListener("focusout", onFocusOut, options);
    window.addEventListener("keydown", onKeyDown, options);
    window.addEventListener("pagehide", flushWatchEvents);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      window.removeEventListener("mousedown", onMouseDown, options);
      window.removeEventListener("change", onChange, options);
      window.removeEventListener("focusout", onFocusOut, options);
      window.removeEventListener("keydown", onKeyDown, options);
      window.removeEventListener("pagehide", flushWatchEvents);
      document.removeEventListener("visibilitychange", onHide);
      if (idleHandle !== null) {
        if (idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleHandle);
        window.clearTimeout(idleHandle);
      }
      flushWatchEvents();
    };
  }, [active, analyze, runRef, userDidStep]);

  // A newly saved scenario may cover the suggested pattern, or a field's list may change
  useEffect(() => {
    if (!active || runRef.current) return;
    const current = suggestionRef.current;
    if (current?.kind === SuggestionKind.PATTERN && isPatternSaved(current.pattern, scenarios || {})) setSuggestion(null);
  }, [scenarios, active, runRef]);

  const controller = useMemo<LiveWatchController>(() => {
    const close = () => {
      const current = suggestionRef.current;
      if (current) closedKeysRef.current.add(suggestionKey(current));
      setSuggestion(null);
    };

    const savePattern = () => {
      const current = suggestionRef.current;
      const pattern =
        runPatternRef.current ||
        (current && (current.kind === SuggestionKind.PATTERN || current.kind === SuggestionKind.CONTINUE_PATTERN)
          ? current.pattern
          : null);
      if (!pattern) return;
      if (status !== ScenarioStatus.IDLE) {
        toast.error("Finish recording or editing the current scenario first");
        return;
      }
      const scenario: Scenario = {
        title: patternTitle(pattern),
        description: "Saved from live watching",
        tags: [],
        category: "",
        repeat: 1,
        data: eventsToSteps(pattern.events, typedValuesRef.current),
      };
      // Just replayed: keep the text the user gave on the way (a continuation replays only the last steps)
      const runSteps = runPatternRef.current === pattern ? runRef.current?.steps : undefined;
      if (runSteps && runSteps.length <= scenario.data.length) {
        scenario.data.splice(scenario.data.length - runSteps.length, runSteps.length, ...runSteps);
      }
      dispatch(saveScenarioWatcher.getPayload({ scenario }));
      dismissPattern(pattern.id);
      toast.success("Saved as a scenario");
      runPatternRef.current = null;
      stop();
      setSuggestion(null);
    };

    return {
      suggestion,
      run,
      close,
      dismissForever: () => {
        const current = suggestionRef.current;
        if (!current) return;
        if (current.kind === SuggestionKind.FIELD) muteField(current.fieldXpath);
        else if (current.kind !== SuggestionKind.CONTINUE_SCENARIO) dismissPattern(current.pattern.id);
        close();
      },
      playPattern: (guided: boolean) => {
        const current = suggestionRef.current;
        if (!current || (current.kind !== SuggestionKind.PATTERN && current.kind !== SuggestionKind.CONTINUE_PATTERN)) return;
        const events =
          current.kind === SuggestionKind.CONTINUE_PATTERN ? current.pattern.events.slice(current.doneCount) : current.pattern.events;
        runPatternRef.current = current.pattern;
        setSuggestion(null);
        start(events, eventsToSteps(events, typedValuesRef.current), guided);
      },
      savePattern,
      playScenario: (scenarioId: string, fromStep?: number) => {
        if (suggestionRef.current) closedKeysRef.current.add(suggestionKey(suggestionRef.current));
        setSuggestion(null);
        playScenario(scenarioId, fromStep);
      },
      doStep,
      skipStep: skip,
      stopRun: () => {
        runPatternRef.current = null;
        stop();
      },
      typedValue: (xpath: string) => typedValuesRef.current.get(xpath),
    };
  }, [suggestion, run, runRef, status, dispatch, start, stop, doStep, skip, playScenario]);

  if (!active) return null;
  return (
    <LiveWatchContext.Provider value={controller}>
      <SuggestionCard />
    </LiveWatchContext.Provider>
  );
};
