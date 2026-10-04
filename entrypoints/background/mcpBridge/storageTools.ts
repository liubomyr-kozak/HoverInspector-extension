import { browser } from "wxt/browser";

import AppStorageService from "@entrypoints/core/services/storage/AppStorageService";
import { GRID_STORAGE_KEY, THEME_STORAGE_KEY } from "@entrypoints/core/constants/designTheme";
import { LIVE_WATCH_EVENTS_KEY, LIVE_WATCH_SETTINGS_KEY } from "@entrypoints/core/constants/liveWatch";
import type { BridgeParams } from "@entrypoints/core/mcp/types";
import type { CSSSnapshot, SnapshotNode } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/types";
import type { Scenario, ScenarioMap } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import {
  describeEvent,
  eventsToSteps,
  findPatterns,
  isPatternSaved,
  sanitizeEvents,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/liveWatch/utils/patterns";
import { isDesignTheme } from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/utils/themeDiff";

import { optionalBoolean, optionalNumber, optionalString, requireString } from "./params";
import { diffSnapshots } from "./snapshotDiff";
import { newScenarioId, parseScenarioInput, SCENARIO_ID_PREFIX } from "./scenarioInput";

// ---- CSS snapshots ----

// Not snapshotStorage's isValidSnapshot: that module pulls the content script's Redux store in
const isValidSnapshot = (value: unknown): value is CSSSnapshot => {
  if (typeof value !== "object" || value === null) return false;
  const snapshot = value as Partial<CSSSnapshot>;
  return (
    typeof snapshot.id === "string" &&
    typeof snapshot.title === "string" &&
    typeof snapshot.url === "string" &&
    typeof snapshot.timestamp === "number" &&
    typeof snapshot.root === "object" &&
    snapshot.root !== null &&
    Array.isArray(snapshot.root.children)
  );
};

async function readSnapshot(id: string): Promise<CSSSnapshot> {
  const snapshot: unknown = await AppStorageService.getCSSSnapshot(id);
  if (!isValidSnapshot(snapshot)) throw new Error(`No CSS snapshot with id "${id}" (see list_css_snapshots)`);
  return snapshot;
}

export async function listCssSnapshots() {
  const ids: string[] = await AppStorageService.getAllCSSSnapshots();
  const snapshots: unknown[] = await Promise.all(ids.map((id) => AppStorageService.getCSSSnapshot(id)));
  return {
    snapshots: snapshots.filter(isValidSnapshot).map((snapshot) => ({
      id: snapshot.id,
      title: snapshot.title,
      url: snapshot.url,
      timestamp: snapshot.timestamp,
      elementCount: snapshot.elementCount,
      rootTag: snapshot.root.tagName,
      viewport: snapshot.metadata?.viewport,
    })),
  };
}

/** Cuts the tree below `depth`, leaving the number of hidden children so the agent knows to ask deeper */
function pruneTree(node: SnapshotNode, depth: number): SnapshotNode & { hiddenChildren?: number } {
  if (depth <= 0 && node.children.length > 0) return { ...node, children: [], hiddenChildren: node.children.length };
  return { ...node, children: node.children.map((child) => pruneTree(child, depth - 1)) };
}

export async function getCssSnapshot(params: BridgeParams) {
  const snapshot = await readSnapshot(requireString(params, "id"));
  const maxDepth = optionalNumber(params, "maxDepth");
  return maxDepth === undefined ? snapshot : { ...snapshot, root: pruneTree(snapshot.root, Math.max(0, maxDepth)) };
}

export async function compareCssSnapshots(params: BridgeParams) {
  const [before, after] = await Promise.all([
    readSnapshot(requireString(params, "beforeId")),
    readSnapshot(requireString(params, "afterId")),
  ]);
  return diffSnapshots(before, after, {
    limit: optionalNumber(params, "limit"),
    positionThreshold: optionalNumber(params, "positionThreshold"),
    comparePositions: optionalBoolean(params, "comparePositions"),
    compareAttributes: optionalBoolean(params, "compareAttributes"),
    ignoreProperties: Array.isArray(params.ignoreProperties)
      ? params.ignoreProperties.filter((item): item is string => typeof item === "string")
      : undefined,
  });
}

// ---- Design theme ----

export async function getDesignTheme() {
  const stored = await browser.storage.local.get([THEME_STORAGE_KEY, GRID_STORAGE_KEY]);
  const theme: unknown = stored[THEME_STORAGE_KEY];
  const appState: unknown = await AppStorageService.getAppState();
  const colorHistory =
    typeof appState === "object" && appState !== null && Array.isArray((appState as { colorHistory?: unknown }).colorHistory)
      ? (appState as { colorHistory: unknown[] }).colorHistory.filter((color): color is string => typeof color === "string")
      : [];
  return {
    theme: isDesignTheme(theme) ? theme : null,
    spacingGrid: stored[GRID_STORAGE_KEY] === 8 ? 8 : 4,
    colorHistory,
  };
}

// ---- Automation scenarios ----

async function readScenarios(): Promise<ScenarioMap> {
  const all: Record<string, unknown> = await AppStorageService.getAllAutomationScenarios();
  const scenarios: ScenarioMap = {};
  for (const [id, value] of Object.entries(all)) {
    if (id.startsWith(SCENARIO_ID_PREFIX) && isScenario(value)) scenarios[id] = value;
  }
  return scenarios;
}

const isScenario = (value: unknown): value is Scenario =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Scenario).title === "string" &&
  Array.isArray((value as Scenario).data);

export async function listScenarios() {
  const scenarios = await readScenarios();
  return {
    scenarios: Object.entries(scenarios).map(([id, scenario]) => ({
      id,
      title: scenario.title,
      description: scenario.description,
      stepCount: scenario.data.length,
      stepTypes: [...new Set(scenario.data.map((step) => step.type))],
      tags: scenario.tags,
      category: scenario.category,
      folderId: scenario.folderId,
    })),
  };
}

export async function readScenario(id: string): Promise<Scenario> {
  const scenario: unknown = await AppStorageService.getAutomationScenario({ data: id });
  if (!isScenario(scenario)) throw new Error(`No scenario with id "${id}" (see list_scenarios)`);
  return scenario;
}

export async function getScenario(params: BridgeParams) {
  const id = requireString(params, "id");
  return { id, scenario: await readScenario(id) };
}

export async function saveScenario(params: BridgeParams) {
  const requestedId = optionalString(params, "id");
  if (requestedId !== undefined && !requestedId.startsWith(SCENARIO_ID_PREFIX)) {
    throw new Error(`Scenario ids start with "${SCENARIO_ID_PREFIX}"; leave "id" out to create a new scenario`);
  }
  const existing = requestedId ? await readScenario(requestedId) : null;
  const id = requestedId ?? newScenarioId();
  const scenario = parseScenarioInput(params, existing);
  await AppStorageService.saveAutomationScenario({ id, scenario });
  return {
    id,
    created: !existing,
    scenario,
    note: "Saved to the Automation Scenarios list. A panel that is already open shows it after the page reloads.",
  };
}

// ---- Live watching ----

export async function getLiveWatchPatterns(params: BridgeParams) {
  const limit = Math.min(Math.max(optionalNumber(params, "limit") ?? 5, 1), 20);
  const stored = await browser.storage.local.get([LIVE_WATCH_SETTINGS_KEY, LIVE_WATCH_EVENTS_KEY]);
  // Read here rather than through liveWatch/store, which is a React store for the panel
  const settings: unknown = stored[LIVE_WATCH_SETTINGS_KEY];
  const settingsRecord = typeof settings === "object" && settings !== null ? (settings as Record<string, unknown>) : {};
  const dismissed = new Set(
    Array.isArray(settingsRecord.dismissedPatterns)
      ? settingsRecord.dismissedPatterns.filter((id): id is string => typeof id === "string")
      : [],
  );
  const events = sanitizeEvents(stored[LIVE_WATCH_EVENTS_KEY]);
  const scenarios = await readScenarios();

  return {
    liveWatchEnabled: settingsRecord.enabled === true,
    watchedEvents: events.length,
    patterns: findPatterns(events, limit)
      .filter((pattern) => !dismissed.has(pattern.id))
      .map((pattern) => ({
        id: pattern.id,
        occurrences: pattern.occurrences,
        actions: pattern.events.map(describeEvent),
        alreadySavedAsScenario: isPatternSaved(pattern, scenarios),
        // Typed text is never watched, so input steps come without a value: ask the user or fill it in
        steps: eventsToSteps(pattern.events),
      })),
  };
}
