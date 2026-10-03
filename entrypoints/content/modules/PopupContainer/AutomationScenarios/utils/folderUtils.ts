import { ScenarioFolderMap, ScenarioMap } from "../types";

/**
 * Pure helpers for organising scenarios into folders.
 * Folder ids are their storage ids ("fo_..."); a scenario points at its folder with `folderId`.
 */

export const MAX_FOLDER_TITLE_LENGTH = 40;

export interface ScenarioFolderGroup {
  /** The folder's id, or null for the scenarios that are in no folder */
  folderId: string | null;
  title: string;
  collapsed: boolean;
  scenarioIds: string[];
}

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/**
 * Scenario ids in natural title order ("Scenario 2" before "Scenario 10")
 */
export function sortScenarioIds(scenarios: ScenarioMap): string[] {
  return Object.keys(scenarios).sort((a, b) => naturalCompare(scenarios[a]?.title || "", scenarios[b]?.title || ""));
}

/**
 * The folder a scenario is shown in: null when it has none or its folder no longer exists
 */
export function getScenarioFolderId(scenarios: ScenarioMap, folders: ScenarioFolderMap, scenarioId: string) {
  const folderId = scenarios[scenarioId]?.folderId;
  return folderId && folders[folderId] ? folderId : null;
}

/**
 * Splits the scenarios into one group per folder (sorted by title), followed by the scenarios that are in no
 * folder. Empty folders are kept so they can be shown and filled; the "no folder" group is left out when empty.
 */
export function groupScenariosByFolder(scenarios: ScenarioMap, folders: ScenarioFolderMap): ScenarioFolderGroup[] {
  const folderIds = Object.keys(folders).sort((a, b) => naturalCompare(folders[a]?.title || "", folders[b]?.title || ""));
  const byFolder = new Map<string | null, string[]>(folderIds.map((id) => [id, []]));
  const loose: string[] = [];

  for (const scenarioId of sortScenarioIds(scenarios)) {
    const folderId = getScenarioFolderId(scenarios, folders, scenarioId);
    if (folderId) byFolder.get(folderId)!.push(scenarioId);
    else loose.push(scenarioId);
  }

  const groups: ScenarioFolderGroup[] = folderIds.map((id) => ({
    folderId: id,
    title: folders[id]?.title || "Untitled folder",
    collapsed: !!folders[id]?.collapsed,
    scenarioIds: byFolder.get(id) || [],
  }));

  if (loose.length) {
    groups.push({ folderId: null, title: "No folder", collapsed: false, scenarioIds: loose });
  }
  return groups;
}

/**
 * Trims a folder title and collapses its inner whitespace
 */
export function normalizeFolderTitle(title: string): string {
  return (title || "").replace(/\s+/g, " ").trim();
}

/**
 * Returns why a folder title can't be used, or null when it is fine.
 * Titles must be non-empty, short and unique (ignoring case); `excludeId` is the folder being renamed.
 */
export function validateFolderTitle(title: string, folders: ScenarioFolderMap, excludeId?: string): string | null {
  const normalized = normalizeFolderTitle(title);
  if (!normalized) return "Enter a folder name";
  if (normalized.length > MAX_FOLDER_TITLE_LENGTH) return `Use at most ${MAX_FOLDER_TITLE_LENGTH} characters`;
  if (normalized.toLowerCase() === "no folder") return "This name is reserved";
  const taken = Object.keys(folders).some(
    (id) => id !== excludeId && normalizeFolderTitle(folders[id]?.title).toLowerCase() === normalized.toLowerCase(),
  );
  return taken ? "A folder with this name already exists" : null;
}

/**
 * Ids of the scenarios stored in a folder (what has to be moved out when the folder is deleted)
 */
export function getScenarioIdsInFolder(scenarios: ScenarioMap, folderId: string): string[] {
  return Object.keys(scenarios).filter((id) => scenarios[id]?.folderId === folderId);
}
