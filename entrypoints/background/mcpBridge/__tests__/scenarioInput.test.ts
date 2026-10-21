import { describe, expect, it } from "vitest";

import { StepType, type Scenario } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import { newScenarioId, parseScenarioInput, parseStep } from "../scenarioInput";

const existing: Scenario = {
  title: "Log in",
  description: "Old",
  data: [{ type: StepType.CLICK, xpath: "//button" }],
  repeat: 3,
  folderId: "fo_1",
};

describe("parseStep", () => {
  it("keeps the fields playback understands and drops the rest", () => {
    expect(parseStep({ type: "input", xpath: "//input", value: "a", extra: true }, 0)).toEqual({
      type: StepType.INPUT,
      xpath: "//input",
      value: "a",
    });
  });

  it("rejects unknown and empty step types", () => {
    expect(() => parseStep({ type: "teleport" }, 1)).toThrow(/Step 2/);
    expect(() => parseStep({ type: "" }, 0)).toThrow(/type/);
    expect(() => parseStep("click", 0)).toThrow(/object/);
  });

  it("rejects non-string values", () => {
    expect(() => parseStep({ type: "click", xpath: 5 }, 0)).toThrow(/xpath/);
  });
});

describe("parseScenarioInput", () => {
  it("creates a scenario with the panel's defaults", () => {
    const scenario = parseScenarioInput({ title: " New ", steps: [{ type: "click", xpath: "//a" }] }, null);
    expect(scenario).toEqual({
      title: "New",
      description: undefined,
      data: [{ type: StepType.CLICK, xpath: "//a" }],
      repeat: 1,
      tags: undefined,
    });
  });

  it("keeps the fields an update leaves out", () => {
    const scenario = parseScenarioInput({ description: "New" }, existing);
    expect(scenario).toMatchObject({ title: "Log in", description: "New", repeat: 3, folderId: "fo_1" });
    expect(scenario.data).toEqual(existing.data);
  });

  it("needs a title and at least one step", () => {
    expect(() => parseScenarioInput({ steps: [{ type: "click" }] }, null)).toThrow(/title/);
    expect(() => parseScenarioInput({ title: "A", steps: [] }, null)).toThrow(/at least one step/);
    expect(() => parseScenarioInput({ title: "A", steps: "click" }, null)).toThrow(/array/);
  });
});

describe("newScenarioId", () => {
  it("uses the panel's format", () => {
    expect(newScenarioId()).toMatch(/^sc_[a-z][0-9a-f]{15}$/);
  });
});
