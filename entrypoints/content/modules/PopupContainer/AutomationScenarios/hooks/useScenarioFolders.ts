import { useDispatch, useSelector, useStore } from "react-redux";
import {
  automationActions,
  selectFolders,
  selectScenarios,
} from "@entrypoints/content/store/automation/automation.slice.ts";
import {
  generateUniqueId,
  removeFolderFromLocalStorage,
  saveScenarioToLocalStorage,
  updateFolderInLocalStorage,
} from "../utils/storage";
import { getScenarioIdsInFolder, normalizeFolderTitle, validateFolderTitle } from "../utils/folderUtils";
import { ScenarioFolder } from "../types";

/**
 * Folder management for the scenario list. Folders are stored under "fo_" keys; a scenario points at its folder
 * with `folderId`. Each change is written to storage first, then mirrored in the store.
 */
export const useScenarioFolders = () => {
  const dispatch = useDispatch();
  const store = useStore<any>();
  const folders = useSelector(selectFolders);
  const scenarios = useSelector(selectScenarios);

  // Read the latest state: several changes can run back to back (e.g. moving every scenario out of a folder)
  const latest = () => store.getState().automation as { folders: typeof folders; scenarios: typeof scenarios };

  const saveFolder = async (id: string, folder: ScenarioFolder) => {
    const ok = await updateFolderInLocalStorage(id, folder);
    if (ok) dispatch(automationActions.upsertFolder({ id, folder }));
    return ok;
  };

  /** Creates a folder; returns an error message or null */
  const createFolder = async (title: string): Promise<string | null> => {
    const error = validateFolderTitle(title, latest().folders);
    if (error) return error;
    const id = `fo_${await generateUniqueId()}`;
    return (await saveFolder(id, { title: normalizeFolderTitle(title) })) ? null : "Could not save the folder";
  };

  /** Renames a folder; returns an error message or null */
  const renameFolder = async (id: string, title: string): Promise<string | null> => {
    const folder = latest().folders[id];
    if (!folder) return "Folder not found";
    const error = validateFolderTitle(title, latest().folders, id);
    if (error) return error;
    return (await saveFolder(id, { ...folder, title: normalizeFolderTitle(title) })) ? null : "Could not save the folder";
  };

  const toggleFolderCollapsed = async (id: string) => {
    const folder = latest().folders[id];
    if (folder) await saveFolder(id, { ...folder, collapsed: !folder.collapsed });
  };

  const moveScenarioToFolder = async (scenarioId: string, folderId: string | null) => {
    const scenario = latest().scenarios[scenarioId];
    if (!scenario || (scenario.folderId || null) === folderId) return;
    const updated = { ...scenario, folderId };
    if (await saveScenarioToLocalStorage(scenarioId, updated)) {
      dispatch(automationActions.updateScenario({ id: scenarioId, scenario: updated }));
    }
    // Show the scenario where it went
    const folder = folderId ? latest().folders[folderId] : null;
    if (folderId && folder?.collapsed) await saveFolder(folderId, { ...folder, collapsed: false });
  };

  /** Deletes a folder; its scenarios move to "No folder" */
  const deleteFolder = async (id: string) => {
    for (const scenarioId of getScenarioIdsInFolder(latest().scenarios, id)) {
      await moveScenarioToFolder(scenarioId, null);
    }
    if (await removeFolderFromLocalStorage(id)) {
      dispatch(automationActions.removeFolder(id));
    }
  };

  return { folders, createFolder, renameFolder, toggleFolderCollapsed, moveScenarioToFolder, deleteFolder };
};
