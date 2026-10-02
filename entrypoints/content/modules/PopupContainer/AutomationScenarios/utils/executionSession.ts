/**
 * Execution session: lets a scenario keep playing after the page navigates or a step opens a new tab.
 *
 * The content script (and its Redux store) is destroyed on every page load, so the playing scenario,
 * the step to continue from and the tab that owns the playback are kept in extension storage.
 * Before each step the session is moved forward; when the page unloads mid-scenario the next content
 * script in the same tab picks the session up and continues. The background script hands the session
 * over to a new tab when a step opens one; the handoff is kept under its own key so that the opener tab,
 * which keeps writing its progress, can't overwrite it.
 */

import { ScenarioStep, StepType } from "../types";

export const EXECUTION_SESSION_KEY = "hi_automation_execution_session";
export const EXECUTION_HANDOFF_KEY = "hi_automation_execution_handoff";
export const AUTOMATION_TAB_PORT = "hi-automation-tab";

// The session is refreshed before and after every step, so a page that loads later than this after the
// last refresh belongs to an abandoned playback (browser closed, crash...) and is not resumed
export const EXECUTION_SESSION_MAX_AGE = 60 * 1000;

export interface ExecutionSession {
  scenarioId: string;
  nextStepIndex: number;
  tabId: number | null;
  updatedAt: number;
}

export interface ExecutionHandoff {
  scenarioId: string;
  fromTabId: number;
  toTabId: number;
}

/**
 * The tab that plays the session now: the tab it was handed over to, if any, else the tab that started it.
 */
export function getSessionOwner(session: ExecutionSession, handoff?: ExecutionHandoff | null): number | null {
  if (handoff && handoff.scenarioId === session.scenarioId) return handoff.toTabId;
  return session.tabId;
}

const storage = () => (globalThis as any).chrome?.storage?.local;

export async function loadExecutionSession(): Promise<ExecutionSession | null> {
  try {
    const result = await storage()?.get(EXECUTION_SESSION_KEY);
    return (result?.[EXECUTION_SESSION_KEY] as ExecutionSession) || null;
  } catch {
    return null;
  }
}

export async function loadExecutionHandoff(): Promise<ExecutionHandoff | null> {
  try {
    const result = await storage()?.get(EXECUTION_HANDOFF_KEY);
    return (result?.[EXECUTION_HANDOFF_KEY] as ExecutionHandoff) || null;
  } catch {
    return null;
  }
}

/**
 * Starts a new playback session (and forgets the handoff of a previous one)
 */
export async function startExecutionSession(session: ExecutionSession): Promise<void> {
  try {
    await storage()?.remove(EXECUTION_HANDOFF_KEY);
  } catch {
    // ignore
  }
  await saveExecutionSession(session);
}

export async function saveExecutionSession(session: ExecutionSession): Promise<void> {
  try {
    await storage()?.set({ [EXECUTION_SESSION_KEY]: session });
  } catch (error) {
    console.error("Error saving execution session:", error);
  }
}

export async function clearExecutionSession(): Promise<void> {
  try {
    await storage()?.remove([EXECUTION_SESSION_KEY, EXECUTION_HANDOFF_KEY]);
  } catch (error) {
    console.error("Error clearing execution session:", error);
  }
}

export type SessionAdvanceResult = "continue" | "handed-off" | "stopped";

/**
 * Moves the session of a playing scenario to the given step.
 * Returns "handed-off" when another tab owns the playback now (a step opened a new tab), and "stopped"
 * when the session is gone or belongs to another scenario (another playback was started meanwhile).
 */
export async function advanceExecutionSession(
  scenarioId: string,
  tabId: number | null,
  nextStepIndex: number,
): Promise<SessionAdvanceResult> {
  const session = await loadExecutionSession();
  if (!session || session.scenarioId !== scenarioId) return "stopped";
  const owner = getSessionOwner(session, await loadExecutionHandoff());
  if (tabId !== null && owner !== null && owner !== tabId) return "handed-off";
  await saveExecutionSession({ ...session, tabId: owner, nextStepIndex, updatedAt: Date.now() });
  return "continue";
}

/**
 * Removes the session when the playback ends, unless another tab or another playback owns it now.
 */
export async function releaseExecutionSession(scenarioId: string, tabId: number | null): Promise<void> {
  const session = await loadExecutionSession();
  if (!session || session.scenarioId !== scenarioId) return;
  const owner = getSessionOwner(session, await loadExecutionHandoff());
  if (tabId !== null && owner !== null && owner !== tabId) return;
  await clearExecutionSession();
}

/**
 * Whether a session found by a freshly loaded page should be continued there.
 */
export function shouldResumeSession(
  session: ExecutionSession | null,
  tabId: number | null,
  handoff: ExecutionHandoff | null = null,
  now: number = Date.now(),
): session is ExecutionSession {
  if (!session) return false;
  if (now - session.updatedAt > EXECUTION_SESSION_MAX_AGE) return false;
  const owner = getSessionOwner(session, handoff);
  return owner === null || owner === tabId;
}

/**
 * Steps that may leave the page. They are marked as done before they run, so after the navigation
 * the playback continues with the next step instead of repeating them (e.g. submitting a form twice).
 * Any other step interrupted by a navigation is repeated on the new page.
 */
export function canLeavePage(step: ScenarioStep | undefined): boolean {
  if (!step) return false;
  return [
    StepType.CLICK,
    StepType.NAVIGATE,
    StepType.REDIRECT,
    StepType.UPDATE,
    StepType.CODE,
    StepType.FUNCTION,
  ].includes(step.type as StepType);
}

let tabIdPromise: Promise<number | null> | null = null;

/**
 * Asks the background script which tab this content script runs in (content scripts can't know it).
 */
export function getCurrentTabId(): Promise<number | null> {
  if (!tabIdPromise) {
    tabIdPromise = new Promise((resolve) => {
      try {
        const runtime = (globalThis as any).chrome?.runtime;
        if (!runtime?.connect) return resolve(null);
        const port = runtime.connect({ name: AUTOMATION_TAB_PORT });
        const timer = setTimeout(() => {
          resolve(null);
          port.disconnect();
        }, 2000);
        port.onMessage.addListener((message: { tabId?: number }) => {
          clearTimeout(timer);
          resolve(typeof message?.tabId === "number" ? message.tabId : null);
          port.disconnect();
        });
      } catch {
        resolve(null);
      }
    }).then((tabId) => {
      // Retry next time if the background could not answer
      if (tabId === null) tabIdPromise = null;
      return tabId;
    });
  }
  return tabIdPromise;
}

let pageUnloading = false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => (pageUnloading = true));
  window.addEventListener("pagehide", () => (pageUnloading = true));
  // Fires synchronously when a click on a link starts a cross-document navigation
  (window as any).navigation?.addEventListener?.("navigate", (event: any) => {
    if (event?.destination && event.destination.sameDocument === false && !event.downloadRequest) {
      pageUnloading = true;
    }
  });
  window.addEventListener("pageshow", () => (pageUnloading = false));
}

/**
 * True once the current document started navigating away: playback continues on the next page.
 */
export function isPageUnloading(): boolean {
  return pageUnloading;
}
