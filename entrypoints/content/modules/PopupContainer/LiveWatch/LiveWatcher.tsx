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
import { useScenarioActions } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/hooks/useScenarioActions";
import { getActionableTarget, getEditableRoot, isTextEntryElement } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/recordingUtils";
import { generateXPaths } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/utils/xpathUtils";
import HighlightOverlayManager from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayManager";
import { Scenario, ScenarioMap } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import { LiveWatchContext, LiveWatchController } from "./LiveWatchContext";
import { SuggestionCard } from "./components/SuggestionCard";
import { WatchLogPanel } from "./components/WatchLogPanel";
import { setWatchCaptureSuppressor, startWatchCapture, stopWatchCapture } from "./capture";
import { dismissPattern, muteField, useLiveWatchSettings } from "./store";
import { DetectedPattern, LiveWatchSettings, Suggestion, SuggestionKind, WatchEventKind } from "./types";
import { RunPhase, usePatternRun } from "./usePatternRun";
import { setWatchLogLimit, useWatchLog } from "./useWatchLog";
import { elementLabel, isExtensionTarget } from "./utils/dom";
import { patternActions } from "./utils/smartLog";
import {
  eventSignature,
  eventsToSteps,
  findFieldScenarios,
  findPatterns,
  isPatternSaved,
  matchScenarioContinuation,
} from "./utils/patterns";

/** Look for patterns once the page is idle, at most this long after the last action */
const ANALYSIS_TIMEOUT_MS = 1500;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** Identifies a suggestion, so one the user closed is not shown again on this page */
const suggestionKey = (suggestion: Suggestion): string => {
  switch (suggestion.kind) {
    case SuggestionKind.FIELD:
      return `field:${suggestion.fieldXpath}`;
    case SuggestionKind.CONTINUE_SCENARIO:
      return `scenario:${suggestion.scenarioId}:${suggestion.nextStepIndex}`;
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
 * Live watching: while it is on (off by default), every action of the user on the page is noted in the watch
 * log (see capture.ts), which the panel shows. From the log it finds sequences the user repeats and offers to
 * replay them or save them as a scenario. It also offers to finish a saved scenario the user has started
 * by hand, and lists the scenarios that use a field the user clicks.
 *
 * Built for busy pages: passive capture listeners, analysis in idle time, one small storage write per page.
 * Synthetic events (scenario playback, the replays) are never watched: only `isTrusted` events count.
 */
export const LiveWatcher: React.FC = () => {
  const settings = useLiveWatchSettings();
  const log = useWatchLog();
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

  const patternsRef = useRef<DetectedPattern[]>([]);
  // Listed under the watch log, which offers them without a card popping up
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  // The pattern being replayed, for "Save as scenario"
  const runPatternRef = useRef<DetectedPattern | null>(null);
  const closedKeysRef = useRef(new Set<string>());
  const shownPatternsRef = useRef(new Set<string>());

  const settingsRef = useRef<LiveWatchSettings>(settings);
  settingsRef.current = settings;
  const scenariosRef = useRef(scenarios);
  scenariosRef.current = scenarios;
  const executingRef = useRef(executing);
  executingRef.current = executing;
  const recordingRef = useRef(recording);
  recordingRef.current = recording;

  const enabled = settings.enabled;
  const active = enabled && !recording;

  // The actions patterns are looked for in: the smart view of this site, without page changes
  const actions = useMemo(() => patternActions(log.events, window.location.origin), [log.events]);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Typed text by locator, to prefill typing steps of patterns
  const typedValues = useMemo(() => {
    const values = new Map<string, string>();
    actions.forEach((event) => {
      const value = event.kind === WatchEventKind.INPUT ? log.values.get(event.id) : undefined;
      if (value !== undefined) values.set(event.xpath, value);
    });
    return values;
  }, [actions, log.values]);
  const typedValuesRef = useRef(typedValues);
  typedValuesRef.current = typedValues;

  useEffect(() => setWatchLogLimit(settings.limit), [settings.limit]);

  // The capture runs whenever watching is on in this tab; it started with the page when the capture
  // script was registered, else it starts here. It is paused while the extension works on the page itself.
  useEffect(() => {
    if (!enabled) return;
    setWatchCaptureSuppressor(
      () => recordingRef.current || executingRef.current || HighlightOverlayManager.getInstance().isSelectionActive(),
    );
    startWatchCapture();
    return () => {
      setWatchCaptureSuppressor(null);
      stopWatchCapture();
    };
  }, [enabled]);

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
    const events = actionsRef.current;
    const { dismissedPatterns } = settingsRef.current;
    const saved = scenariosRef.current || {};
    const patterns = findPatterns(events).filter(
      (pattern) => !dismissedPatterns.includes(pattern.id) && !isPatternSaved(pattern, saved),
    );
    patternsRef.current = patterns;
    setPatterns(patterns);
    if (runRef.current) return;

    let next: Suggestion | null = null;
    const scenarioMatch = matchScenarioContinuation(events, saved);
    // With the watch log open, repeats are listed under it instead of in a card
    const fresh = settingsRef.current.panel.open
      ? undefined
      : patterns.find((pattern) => pattern.lastEnd === events.length && !shownPatternsRef.current.has(pattern.id));
    if (scenarioMatch) next = { kind: SuggestionKind.CONTINUE_SCENARIO, ...scenarioMatch };
    else if (fresh) next = { kind: SuggestionKind.PATTERN, pattern: fresh };
    if (next && closedKeysRef.current.has(suggestionKey(next))) next = null;
    if (next?.kind === SuggestionKind.PATTERN) shownPatternsRef.current.add(next.pattern.id);

    setSuggestion((previous) => {
      if (next) return next;
      // An offer to continue is stale once the user did something else; other cards stay until closed
      return previous && previous.kind !== SuggestionKind.CONTINUE_SCENARIO ? previous : null;
    });
  }, [runRef]);

  // New actions: look for patterns once the page is idle. During a step by step replay, the user's own
  // action may be the step the card waits for.
  const lastActionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!active || !log.loaded) return;
    const newest = actions[actions.length - 1];
    const isNew = !!newest && newest.id !== lastActionRef.current;
    lastActionRef.current = newest?.id ?? null;

    const currentRun = runRef.current;
    if (currentRun) {
      const expected = currentRun.events[currentRun.index];
      const waiting = currentRun.phase === RunPhase.WAITING_USER || currentRun.phase === RunPhase.WAITING_VALUE;
      if (isNew && waiting && expected && eventSignature(expected) === eventSignature(newest)) userDidStep();
      return;
    }

    const idleWindow = window as IdleWindow;
    const runAnalysis = () => analyze();
    const handle = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(runAnalysis, { timeout: ANALYSIS_TIMEOUT_MS })
      : window.setTimeout(runAnalysis, 300);
    return () => {
      if (idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(handle);
      window.clearTimeout(handle);
    };
  }, [active, log.loaded, actions, analyze, runRef, userDidStep]);

  // Clicking a field may show the saved scenarios that fill it
  useEffect(() => {
    if (!active) return;
    const suggestFieldScenarios = (field: Element) => {
      if (runRef.current || !field.isConnected) return;
      const { primaryXPath, alternativeXpaths } = generateXPaths(field);
      if (!primaryXPath || settingsRef.current.mutedFields.includes(primaryXPath)) return;
      const current = suggestionRef.current;
      if (current?.kind === SuggestionKind.FIELD && current.fieldXpath === primaryXPath) return;
      const matches = findFieldScenarios([primaryXPath, ...alternativeXpaths], scenariosRef.current || {});
      if (!matches.length) return;
      const next: Suggestion = { kind: SuggestionKind.FIELD, fieldXpath: primaryXPath, fieldLabel: elementLabel(field), matches };
      if (!closedKeysRef.current.has(suggestionKey(next))) setSuggestion(next);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!e.isTrusted || e.button !== 0 || executingRef.current || isExtensionTarget(e.target) || !(e.target instanceof Element)) return;
      const editable = getEditableRoot(e.target);
      const target = editable || getActionableTarget(e.target);
      if (!target || !(editable || isTextEntryElement(target) || target.tagName === "SELECT")) return;
      // After the page's own handlers: the locators need several XPath lookups
      window.setTimeout(() => suggestFieldScenarios(target), 0);
    };
    const options = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", onPointerDown, options);
    return () => window.removeEventListener("pointerdown", onPointerDown, options);
  }, [active, runRef]);

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
        runPatternRef.current || (current?.kind === SuggestionKind.PATTERN ? current.pattern : null);
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
      // Just replayed: keep the text the user gave on the way
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
        if (current?.kind !== SuggestionKind.PATTERN) return;
        const { events } = current.pattern;
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

  if (!enabled) return null;
  return (
    <LiveWatchContext.Provider value={controller}>
      {settings.panel.open ? (
        <WatchLogPanel
          settings={settings}
          log={log}
          watching={active && !executing}
          patterns={active ? patterns.filter((pattern) => !settings.dismissedPatterns.includes(pattern.id)) : []}
        >
          {active && <SuggestionCard docked />}
        </WatchLogPanel>
      ) : (
        active && <SuggestionCard />
      )}
    </LiveWatchContext.Provider>
  );
};
