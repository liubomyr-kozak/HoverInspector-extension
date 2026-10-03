import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { ScenarioStep, StepType } from "../types";
import { WatchEvent } from "./types";
import { playStep } from "./utils/playStep";

/** Where a pattern run is */
export enum RunPhase {
  /** The extension is doing the current step */
  PLAYING = "playing",
  /** Step by step: the user does the step, or presses "Do it" */
  WAITING_USER = "waitingUser",
  /** A typing step needs its text */
  WAITING_VALUE = "waitingValue",
  DONE = "done",
  FAILED = "failed",
}

export interface PatternRun {
  /** The watched actions being replayed (labels for the card) */
  events: WatchEvent[];
  steps: ScenarioStep[];
  index: number;
  /** Semi-automatic: every step waits for the user */
  guided: boolean;
  phase: RunPhase;
  error?: string;
}

/** Short pause between automatic steps, so the user can follow and the page can react */
const STEP_PAUSE_MS = 350;

/**
 * Replays a suggested pattern on this page, automatically or step by step. Typing steps without a known
 * text stop and ask for it (the text of watched typing is never stored).
 */
export function usePatternRun() {
  const store = useStore();
  const [run, setRun] = useState<PatternRun | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  // The step index already started: the effect below must not start it again when the run re-renders
  const playedIndexRef = useRef(-1);
  const runRef = useRef(run);
  runRef.current = run;

  const stop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    playedIndexRef.current = -1;
    setRun(null);
  }, []);

  const start = useCallback((events: WatchEvent[], steps: ScenarioStep[], guided: boolean) => {
    cancelRef.current?.();
    playedIndexRef.current = -1;
    setRun({ events, steps, index: 0, guided, phase: RunPhase.PLAYING });
  }, []);

  const advance = useCallback(() => {
    setRun((current) => (current ? { ...current, index: current.index + 1, phase: RunPhase.PLAYING } : current));
  }, []);

  /** Does the current step, with the text for a typing step */
  const doStep = useCallback(
    (value?: string) => {
      const current = runRef.current;
      if (!current) return;
      const step = current.steps[current.index];
      const resolved: ScenarioStep = value === undefined ? step : { ...step, value };
      const steps = current.steps.map((item, i) => (i === current.index ? resolved : item));
      playedIndexRef.current = current.index;
      setRun({ ...current, steps, phase: RunPhase.PLAYING });
      const { done, cancel } = playStep(store, resolved);
      cancelRef.current = cancel;
      done
        .then(() => {
          if (runRef.current?.index !== current.index) return;
          window.setTimeout(advance, STEP_PAUSE_MS);
        })
        .catch((error: unknown) => {
          setRun((latest) =>
            latest && latest.index === current.index
              ? { ...latest, phase: RunPhase.FAILED, error: error instanceof Error ? error.message : String(error) }
              : latest,
          );
        })
        .finally(() => {
          if (cancelRef.current === cancel) cancelRef.current = null;
        });
    },
    [store, advance],
  );

  // Entering a step: finish, wait for the user, or play it
  useEffect(() => {
    if (!run || run.phase !== RunPhase.PLAYING || playedIndexRef.current === run.index) return;
    if (run.index >= run.steps.length) {
      setRun({ ...run, phase: RunPhase.DONE });
      return;
    }
    const step = run.steps[run.index];
    if (step.type === StepType.INPUT && (run.guided || step.value === undefined)) {
      setRun({ ...run, phase: RunPhase.WAITING_VALUE });
    } else if (run.guided) {
      setRun({ ...run, phase: RunPhase.WAITING_USER });
    } else {
      doStep();
    }
  }, [run, doStep]);

  // Never leave a step running after the card closes
  useEffect(() => () => cancelRef.current?.(), []);

  return {
    run,
    runRef,
    start,
    stop,
    doStep,
    /** Skip the current step */
    skip: advance,
    /** The user did the current step by hand (step by step mode) */
    userDidStep: advance,
  };
}
