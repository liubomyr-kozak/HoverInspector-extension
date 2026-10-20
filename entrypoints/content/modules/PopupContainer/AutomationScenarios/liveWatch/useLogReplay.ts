import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { ScenarioStep, StepType } from "../types";
import { getCurrentTabId, isPageUnloading } from "../utils/executionSession";
import { clearReplay, loadReplay, ReplaySession, resumeIndex, saveReplay } from "./replaySession";
import { playStep } from "./utils/playStep";

/** Where the replay of log rows is */
export enum ReplayPhase {
  PLAYING = "playing",
  /** A typing step has no text (a password field, or text typed before the browser was restarted) */
  WAITING_VALUE = "waitingValue",
  FAILED = "failed",
  DONE = "done",
}

export interface LogReplayState {
  steps: ScenarioStep[];
  rowIds: string[];
  index: number;
  phase: ReplayPhase;
  error?: string;
}

/** Pause between steps, so the page can react and the user can follow */
const STEP_PAUSE_MS = 300;
/** A page the replay continues on gets this long to settle before the next step */
const RESUME_DELAY_MS = 400;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const newReplayId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Plays log rows on the page, one step after another, without a scenario or a history entry. A step that
 * opens another page (a link, a submit) is done there: the replay is kept in storage and the panel of the
 * next page continues it (see replaySession.ts).
 */
export function useLogReplay() {
  const store = useStore();
  const [state, setState] = useState<LogReplayState | null>(null);
  const sessionRef = useRef<ReplaySession | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  // Bumped by stop/start: a loop that sees another generation ends quietly
  const generationRef = useRef(0);

  const persist = useCallback((change: Partial<ReplaySession>) => {
    if (!sessionRef.current) return Promise.resolve();
    sessionRef.current = { ...sessionRef.current, ...change, updatedAt: Date.now() };
    return saveReplay(sessionRef.current);
  }, []);

  const runFrom = useCallback(
    async (from: number, generation: number) => {
      const session = sessionRef.current;
      if (!session) return;
      const { steps, rowIds } = session;
      for (let index = from; index < steps.length; index++) {
        if (generation !== generationRef.current) return;
        const step = steps[index];
        if (step.type === StepType.INPUT && step.value === undefined) {
          setState({ steps, rowIds, index, phase: ReplayPhase.WAITING_VALUE });
          await persist({ index, started: false });
          return;
        }
        setState({ steps, rowIds, index, phase: ReplayPhase.PLAYING });
        // Saved before the step runs: if it leaves the page, the next page knows it was done
        await persist({ index, started: true });
        try {
          const { done, cancel } = playStep(store, step);
          cancelRef.current = cancel;
          await done;
        } catch (error) {
          if (isPageUnloading() || generation !== generationRef.current) return;
          setState({ steps, rowIds, index, phase: ReplayPhase.FAILED, error: error instanceof Error ? error.message : String(error) });
          await persist({ index, started: false });
          return;
        } finally {
          cancelRef.current = null;
        }
        if (isPageUnloading()) return;
        await wait(STEP_PAUSE_MS);
        // A click may start the navigation a moment later: then the next page goes on
        if (isPageUnloading()) return;
        await persist({ index: index + 1, started: false });
      }
      if (generation !== generationRef.current) return;
      sessionRef.current = null;
      await clearReplay();
      setState({ steps, rowIds, index: steps.length, phase: ReplayPhase.DONE });
    },
    [store, persist],
  );

  const stop = useCallback(() => {
    generationRef.current++;
    cancelRef.current?.();
    cancelRef.current = null;
    sessionRef.current = null;
    setState(null);
    clearReplay();
  }, []);

  const play = useCallback(
    async (steps: ScenarioStep[], rowIds: string[]) => {
      if (!steps.length) return;
      const generation = ++generationRef.current;
      cancelRef.current?.();
      const tabId = await getCurrentTabId();
      sessionRef.current = { id: newReplayId(), steps, rowIds, index: 0, tabId, updatedAt: Date.now(), started: false };
      await saveReplay(sessionRef.current);
      runFrom(0, generation);
    },
    [runFrom],
  );

  /** Does the current typing step with this text, then goes on */
  const provideValue = useCallback(
    (value: string) => {
      const session = sessionRef.current;
      if (!session || !state) return;
      const steps = session.steps.map((step, i) => (i === state.index ? { ...step, value } : step));
      sessionRef.current = { ...session, steps };
      runFrom(state.index, generationRef.current);
    },
    [state, runFrom],
  );

  const retry = useCallback(() => {
    if (state && sessionRef.current) runFrom(state.index, generationRef.current);
  }, [state, runFrom]);

  const skip = useCallback(() => {
    if (state && sessionRef.current) runFrom(state.index + 1, generationRef.current);
  }, [state, runFrom]);

  const dismiss = useCallback(() => setState(null), []);

  // A replay that a step of the previous page started goes on here
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [session, tabId] = await Promise.all([loadReplay(), getCurrentTabId()]);
      const index = resumeIndex(session, tabId);
      if (cancelled || !session) return;
      if (index === null) {
        // The last step opened this page, or the replay was abandoned: nothing is left to do
        if (session.tabId === null || tabId === null || session.tabId === tabId) clearReplay();
        return;
      }
      sessionRef.current = session;
      const generation = ++generationRef.current;
      setState({ steps: session.steps, rowIds: session.rowIds, index, phase: ReplayPhase.PLAYING });
      await persist({ index, started: false });
      await wait(RESUME_DELAY_MS);
      if (!cancelled) runFrom(index, generation);
    })();
    return () => {
      cancelled = true;
    };
  }, [persist, runFrom]);

  // Never leave a step running after the panel closes
  useEffect(() => () => cancelRef.current?.(), []);

  return { replay: state, play, stop, provideValue, retry, skip, dismiss };
}
