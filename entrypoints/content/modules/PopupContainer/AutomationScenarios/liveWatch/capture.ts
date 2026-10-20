import { browser } from "wxt/browser";
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
import { isReplayingIn, isReplayLanding, LIVE_WATCH_REPLAY_KEY, ReplaySession, sanitizeReplay } from "./replaySession";
import { NavigationKind, WatchEvent, WatchEventKind } from "./types";
import { elementLabel, isActionableElement, isExtensionTarget, isSensitiveField } from "./utils/dom";
import { ChunkWriter, chunkIdOf } from "./watchLogStorage";

/**
 * Live watching capture: notes what the user does on the page (clicks, typing, choices, keys, page changes)
 * and writes it to the watch log at once (see watchLogStorage.ts).
 *
 * It runs from the start of every page load (the `watch-capture` content script, registered while live
 * watching is on) so the first click after a page loads is not missed, and the panel's content script
 * starts it too when watching is turned on in an open page. Both share the extension's isolated world in
 * the page, so a global keeps it to one capture per page.
 *
 * - Locators are computed in the capture phase of pointerdown, before the page's own handlers run: a
 *   button that removes itself on mousedown, or a link that leaves the page, is still noted.
 * - Typing is one event per field, created at the first key and updated as the user types: a form
 *   submitted with Enter, or a page left right after typing, keeps what was typed.
 * - Only trusted events count: scenario playback and the log's own replay are never watched.
 */

interface CaptureOptions {
  /** Started with the page: note the page load itself */
  pageStart?: boolean;
  /** Events are kept in memory until this resolves with capture: true (the background said this tab is watched) */
  confirmed?: Promise<{ capture: boolean; tabId: number | null }>;
}

interface CaptureInstance {
  stop: () => void;
}

const INSTANCE = Symbol.for("hoverInspector.liveWatchCapture");
const SUPPRESS = Symbol.for("hoverInspector.liveWatchSuppress");

type CaptureGlobal = typeof globalThis & {
  [INSTANCE]?: CaptureInstance;
  [SUPPRESS]?: () => boolean;
};

const shared = () => globalThis as CaptureGlobal;

/** Keys that only move the focus or the caret: kept in the raw log, dropped by the smart view */
const MINOR_KEYS = ["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"];
/** A click that comes this soon after a pointerdown on the same element is that pointerdown's click */
const POINTER_CLICK_MS = 1000;
/** Same-document URL changes are checked this often when the Navigation API is missing */
const URL_POLL_MS = 500;

let counter = 0;
const newEventId = () => `${Date.now().toString(36)}${(counter++ % 1296).toString(36).padStart(2, "0")}${Math.random().toString(36).slice(2, 5)}`;

export function isWatchCaptureRunning(): boolean {
  return !!shared()[INSTANCE];
}

/**
 * Lets the panel pause the capture while it works on the page itself (picking an element for a step,
 * playing a scenario): those are not the user's actions
 */
export function setWatchCaptureSuppressor(isSuppressed: (() => boolean) | null) {
  if (isSuppressed) shared()[SUPPRESS] = isSuppressed;
  else delete shared()[SUPPRESS];
}

export function stopWatchCapture() {
  shared()[INSTANCE]?.stop();
}

/** Starts the capture in this page, unless it runs already */
export function startWatchCapture({ pageStart = false, confirmed }: CaptureOptions = {}): void {
  const global = shared();
  if (global[INSTANCE] || typeof window === "undefined" || window.top !== window) return;

  const writer = new ChunkWriter();
  // Until the background confirms that this tab is watched, events wait here
  let pending: { event: WatchEvent; value?: string }[] | null = confirmed ? [] : null;
  let stopped = false;
  // The log's own replay in this tab (checked each time: an abandoned replay goes stale by itself)
  let replay: ReplaySession | null = null;
  let tabId: number | null = null;
  let lastEventId: string | null = null;
  let typing: { field: Element; eventId: string } | null = null;
  let lastPointer: { element: Element; time: number } | null = null;
  let lastEnter: { field: Element; time: number } | null = null;
  let lastUrl = window.location.href;

  const suppressed = () => isReplayingIn(replay, tabId) || !!shared()[SUPPRESS]?.();

  const write = (event: WatchEvent, value?: string) => {
    lastEventId = event.id;
    if (pending) pending.push({ event, value });
    else writer.add(event, value);
  };

  const update = (id: string, change: Partial<WatchEvent>, value?: string) => {
    const queued = pending?.find((item) => item.event.id === id);
    if (queued) {
      queued.event = { ...queued.event, ...change };
      if (value !== undefined) queued.value = value;
      return;
    }
    writer.update(id, change, value);
  };

  const baseEvent = (kind: WatchEventKind): Pick<WatchEvent, "id" | "kind" | "origin" | "time" | "url"> => ({
    id: newEventId(),
    kind,
    origin: window.location.origin,
    time: Date.now(),
    url: window.location.href,
  });

  const elementEvent = (kind: WatchEventKind, element: Element, value?: string, minor = false): WatchEvent | null => {
    const { primaryXPath, alternativeXpaths } = generateXPaths(element);
    if (!primaryXPath) return null;
    return {
      ...baseEvent(kind),
      xpath: primaryXPath,
      alternativeXpaths: alternativeXpaths.slice(0, 3),
      label: elementLabel(element),
      ...(value !== undefined ? { value } : {}),
      ...(minor ? { minor: true } : {}),
    };
  };

  const record = (kind: WatchEventKind, element: Element, value?: string, minor = false) => {
    const event = elementEvent(kind, element, value, minor);
    if (event) write(event);
  };

  const pageLabel = () => (document.title || "").replace(/\s+/g, " ").trim().slice(0, 60) || window.location.pathname;

  const recordNavigation = (navigation: NavigationKind) => {
    lastUrl = window.location.href;
    typing = null;
    const event: WatchEvent = { ...baseEvent(WatchEventKind.NAVIGATE), xpath: "", label: pageLabel(), navigation };
    write(event);
    return event;
  };

  // ---- pointer and keyboard clicks

  const onPointerDown = (e: PointerEvent) => {
    if (!e.isTrusted || e.button !== 0 || suppressed() || isExtensionTarget(e.target) || !(e.target instanceof Element)) return;
    const raw = e.target;
    const editable = getEditableRoot(raw);
    const target = editable || getActionableTarget(raw);
    if (!target) return;
    lastPointer = { element: target, time: Date.now() };
    // Clicking a field only focuses it: the typing or the choice that follows is the action
    const focusOnly = !!editable || isTextEntryElement(target) || target.tagName === "SELECT" || target.tagName === "OPTION";
    const checkboxState = getCheckboxTargetState(target) ?? undefined;
    record(WatchEventKind.CLICK, target, checkboxState, focusOnly || !isActionableElement(target));
  };

  // Enter / Space on a button, a link or a checkbox: the browser fires a click with no pointer
  const onClick = (e: MouseEvent) => {
    if (!e.isTrusted || e.detail !== 0 || suppressed() || isExtensionTarget(e.target) || !(e.target instanceof Element)) return;
    const target = getActionableTarget(e.target);
    if (!target) return;
    if (lastPointer && Date.now() - lastPointer.time < POINTER_CLICK_MS && (lastPointer.element === target || lastPointer.element.contains(target))) return;
    if (isTextEntryElement(target) || target.tagName === "SELECT" || target.tagName === "OPTION") return;
    // Enter in a field "clicks" the form's submit button: the key press is the action
    const form = target instanceof HTMLButtonElement || target instanceof HTMLInputElement ? target.form : null;
    if (form && lastEnter && Date.now() - lastEnter.time < POINTER_CLICK_MS && form.contains(lastEnter.field)) return;
    // The box is already toggled when the click fires
    const box = target instanceof HTMLLabelElement ? target.control : target;
    const state = box instanceof HTMLInputElement && box.type === "checkbox" ? (box.checked ? "checked" : "unchecked") : undefined;
    record(WatchEventKind.CLICK, target, state);
  };

  // ---- typing and choices

  const onInput = (e: Event) => {
    if (!e.isTrusted || suppressed() || isExtensionTarget(e.target) || !(e.target instanceof Element)) return;
    const field = getEditableRoot(e.target) || e.target;
    if (!isTextEntryElement(field)) return;
    const sensitive = isSensitiveField(field);
    // Password and card fields are never read: only the fact that they were filled is noted
    const value = sensitive ? undefined : getTypedValue(field);
    if (typing && typing.field === field && lastEventId === typing.eventId) {
      update(typing.eventId, { time: Date.now() }, value);
      return;
    }
    const event = elementEvent(WatchEventKind.INPUT, field);
    if (!event) return;
    if (sensitive) event.sensitive = true;
    typing = { field, eventId: event.id };
    write(event, value);
  };

  const onChange = (e: Event) => {
    if (!e.isTrusted || suppressed() || isExtensionTarget(e.target)) return;
    const target = e.target;
    if (target instanceof HTMLSelectElement) {
      record(WatchEventKind.SELECT, target, getSelectValue(target));
      return;
    }
    // Arrow keys on a radio group check another radio without any click
    if (target instanceof HTMLInputElement && target.type === "radio" && target.checked) {
      const clicked = lastPointer && Date.now() - lastPointer.time < POINTER_CLICK_MS;
      if (!clicked) record(WatchEventKind.CLICK, target);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!e.isTrusted || e.repeat || suppressed() || isExtensionTarget(e.target) || !(e.target instanceof Element)) return;
    const target = e.target;
    const key = formatKeyCombo(e);
    if (e.key === "Enter" && isTextEntryElement(target)) lastEnter = { field: target, time: Date.now() };
    if (shouldRecordKeyPress(e, target)) {
      record(WatchEventKind.KEY_PRESS, target, key);
      return;
    }
    if (MINOR_KEYS.includes(e.key)) record(WatchEventKind.KEY_PRESS, target, key, true);
  };

  // ---- page changes

  const checkUrl = () => {
    if (window.location.href === lastUrl) return;
    if (suppressed()) {
      lastUrl = window.location.href;
      return;
    }
    recordNavigation(NavigationKind.SAME_DOCUMENT);
  };

  const onPageShow = (e: PageTransitionEvent) => {
    // Back / forward restored this page from the cache: no new script, no load
    if (e.persisted && !suppressed()) recordNavigation(NavigationKind.BACK_FORWARD);
  };

  const onHide = () => {
    if (document.visibilityState === "hidden") writer.flush();
  };

  const onStorageChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area !== "local") return;
    Object.keys(changes).forEach((key) => {
      const chunkId = chunkIdOf(key);
      if (chunkId && changes[key].newValue === undefined) writer.onChunkRemoved(chunkId);
    });
    if (changes[LIVE_WATCH_REPLAY_KEY]) replay = sanitizeReplay(changes[LIVE_WATCH_REPLAY_KEY].newValue);
  };

  const listen = { capture: true, passive: true } as const;
  window.addEventListener("pointerdown", onPointerDown, listen);
  window.addEventListener("click", onClick, listen);
  window.addEventListener("input", onInput, listen);
  window.addEventListener("change", onChange, listen);
  window.addEventListener("keydown", onKeyDown, listen);
  window.addEventListener("popstate", checkUrl);
  window.addEventListener("hashchange", checkUrl);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("pagehide", writer.flush.bind(writer));
  document.addEventListener("visibilitychange", onHide);
  // The Navigation API reports pushState / replaceState to every world; the poll covers browsers without it
  const navigation = (window as Window & { navigation?: EventTarget }).navigation;
  navigation?.addEventListener("currententrychange", checkUrl);
  const poll = window.setInterval(checkUrl, URL_POLL_MS);
  try {
    browser.storage.onChanged.addListener(onStorageChanged);
  } catch {
    // No storage events (tests)
  }

  // A page opened by the log's own replay is not something the user did
  const replayChecked =
    browser?.storage?.local
      ?.get(LIVE_WATCH_REPLAY_KEY)
      .then((stored) => sanitizeReplay(stored?.[LIVE_WATCH_REPLAY_KEY]))
      .catch(() => null) ?? Promise.resolve(null);
  replayChecked.then((session) => {
    replay = session;
  });

  if (pageStart) {
    const entry = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    const kind =
      entry?.type === "reload" ? NavigationKind.RELOAD : entry?.type === "back_forward" ? NavigationKind.BACK_FORWARD : NavigationKind.LOAD;
    const first = recordNavigation(kind);
    // At document_start the title is not parsed yet
    const nameThePage = () => update(first.id, { label: pageLabel() });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", nameThePage, { once: true });
  }

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.removeEventListener("pointerdown", onPointerDown, listen);
    window.removeEventListener("click", onClick, listen);
    window.removeEventListener("input", onInput, listen);
    window.removeEventListener("change", onChange, listen);
    window.removeEventListener("keydown", onKeyDown, listen);
    window.removeEventListener("popstate", checkUrl);
    window.removeEventListener("hashchange", checkUrl);
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", onHide);
    navigation?.removeEventListener("currententrychange", checkUrl);
    window.clearInterval(poll);
    try {
      browser.storage.onChanged.removeListener(onStorageChanged);
    } catch {
      // No storage events
    }
    if (!pending) writer.dispose();
    if (shared()[INSTANCE] === instance) delete shared()[INSTANCE];
  };
  const instance: CaptureInstance = { stop };
  global[INSTANCE] = instance;

  confirmed
    ?.then(async (answer) => {
      if (stopped) return;
      if (!answer.capture) {
        pending = null;
        stop();
        return;
      }
      tabId = answer.tabId;
      replay = await replayChecked;
      const landed = isReplayLanding(replay, tabId);
      const queued = (pending || []).filter(({ event }) => !(landed && event.kind === WatchEventKind.NAVIGATE));
      pending = null;
      queued.forEach(({ event, value }) => writer.add(event, value));
    })
    .catch(() => stop());
}
