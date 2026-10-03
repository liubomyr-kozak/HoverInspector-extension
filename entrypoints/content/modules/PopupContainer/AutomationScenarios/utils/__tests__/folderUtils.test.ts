import { describe, expect, it } from "vitest";
import {
  getScenarioFolderId,
  getScenarioIdsInFolder,
  groupScenariosByFolder,
  normalizeFolderTitle,
  validateFolderTitle,
} from "../folderUtils";
import { ScenarioFolderMap, ScenarioMap } from "../../types";

const scenario = (title: string, folderId?: string | null) => ({ title, data: [], repeat: 1, folderId });

const scenarios: ScenarioMap = {
  sc_a: scenario("Login 10", "fo_work"),
  sc_b: scenario("Login 2", "fo_work"),
  sc_c: scenario("Loose"),
  sc_d: scenario("Orphan", "fo_deleted"),
  sc_e: scenario("Null", null),
};

const folders: ScenarioFolderMap = {
  fo_work: { title: "Work" },
  fo_alpha: { title: "Alpha", collapsed: true },
};

describe("groupScenariosByFolder", () => {
  it("lists folders by title, then the scenarios in no folder", () => {
    const groups = groupScenariosByFolder(scenarios, folders);
    expect(groups.map((g) => g.folderId)).toEqual(["fo_alpha", "fo_work", null]);
    expect(groups[0]).toMatchObject({ title: "Alpha", collapsed: true, scenarioIds: [] });
    // natural order inside a folder
    expect(groups[1].scenarioIds).toEqual(["sc_b", "sc_a"]);
    // a scenario whose folder was deleted shows up in "No folder"
    expect(groups[2]).toMatchObject({ title: "No folder", collapsed: false });
    expect(groups[2].scenarioIds.sort()).toEqual(["sc_c", "sc_d", "sc_e"]);
  });

  it("leaves out the no-folder group when every scenario is in a folder", () => {
    const groups = groupScenariosByFolder({ sc_a: scenarios.sc_a }, folders);
    expect(groups.map((g) => g.folderId)).toEqual(["fo_alpha", "fo_work"]);
  });

  it("returns a single group without folders", () => {
    const groups = groupScenariosByFolder({ sc_c: scenarios.sc_c }, {});
    expect(groups).toEqual([{ folderId: null, title: "No folder", collapsed: false, scenarioIds: ["sc_c"] }]);
  });
});

describe("folder helpers", () => {
  it("resolves the folder a scenario is shown in", () => {
    expect(getScenarioFolderId(scenarios, folders, "sc_a")).toBe("fo_work");
    expect(getScenarioFolderId(scenarios, folders, "sc_d")).toBeNull();
    expect(getScenarioFolderId(scenarios, folders, "sc_c")).toBeNull();
  });

  it("finds the scenarios stored in a folder", () => {
    expect(getScenarioIdsInFolder(scenarios, "fo_work").sort()).toEqual(["sc_a", "sc_b"]);
    expect(getScenarioIdsInFolder(scenarios, "fo_deleted")).toEqual(["sc_d"]);
  });

  it("normalizes and validates titles", () => {
    expect(normalizeFolderTitle("  My   folder ")).toBe("My folder");
    expect(validateFolderTitle("   ", folders)).toMatch(/Enter/);
    expect(validateFolderTitle("x".repeat(41), folders)).toMatch(/at most/);
    expect(validateFolderTitle(" work ", folders)).toMatch(/already exists/);
    expect(validateFolderTitle("no folder", folders)).toMatch(/reserved/);
    // renaming a folder to its own name (or another case) is fine
    expect(validateFolderTitle("WORK", folders, "fo_work")).toBeNull();
    expect(validateFolderTitle("Personal", folders)).toBeNull();
  });
});
