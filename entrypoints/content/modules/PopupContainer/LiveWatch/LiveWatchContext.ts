import { createContext, useContext } from "react";
import { Suggestion } from "./types";
import { PatternRun } from "./usePatternRun";

/** What the suggestion card can show and do; provided by LiveWatcher */
export interface LiveWatchController {
  suggestion: Suggestion | null;
  run: PatternRun | null;
  /** Close the card for now */
  close: () => void;
  /** Don't suggest this pattern or field again */
  dismissForever: () => void;
  /** Replay the suggested pattern (or its rest), automatically or step by step */
  playPattern: (guided: boolean) => void;
  /** Save the suggested (or just replayed) pattern as a scenario */
  savePattern: () => void;
  playScenario: (scenarioId: string, fromStep?: number) => void;
  doStep: (value?: string) => void;
  skipStep: () => void;
  stopRun: () => void;
  /** The last text typed in a field on this page (memory only), to prefill step by step typing */
  typedValue: (xpath: string) => string | undefined;
}

export const LiveWatchContext = createContext<LiveWatchController | null>(null);

export function useLiveWatch(): LiveWatchController {
  const controller = useContext(LiveWatchContext);
  if (!controller) throw new Error("useLiveWatch must be used inside LiveWatcher");
  return controller;
}
