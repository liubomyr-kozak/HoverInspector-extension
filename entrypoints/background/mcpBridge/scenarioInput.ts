import {
  StepType,
  type Scenario,
  type ScenarioStep,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import type { BridgeParams } from "@entrypoints/core/mcp/types";

/** Scenario ids carry the type prefix the panel filters on ("sc_<id>") */
export const SCENARIO_ID_PREFIX = "sc_";
const MAX_STEPS = 500;
const MAX_TEXT = 20_000;

const STEP_TYPES = new Set<string>(Object.values(StepType).filter((type) => type !== StepType.NOT_SET));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown, field: string, index: number): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`Step ${index + 1}: "${field}" must be a string`);
  if (value.length > MAX_TEXT) throw new Error(`Step ${index + 1}: "${field}" is too long`);
  return value;
};

/** One step from an agent, reduced to the fields playback understands */
export function parseStep(raw: unknown, index: number): ScenarioStep {
  if (!isRecord(raw)) throw new Error(`Step ${index + 1} must be an object`);
  if (typeof raw.type !== "string" || !STEP_TYPES.has(raw.type)) {
    throw new Error(`Step ${index + 1}: "type" must be one of ${[...STEP_TYPES].join(", ")}`);
  }
  const step: ScenarioStep = { type: raw.type as StepType };
  const xpath = text(raw.xpath, "xpath", index);
  if (xpath) step.xpath = xpath;
  const value = text(raw.value, "value", index);
  if (value !== undefined) step.value = value;
  if (Array.isArray(raw.alternativeXpaths)) {
    step.alternativeXpaths = raw.alternativeXpaths.filter((item): item is string => typeof item === "string");
  }
  if (typeof raw.delay === "number" && Number.isFinite(raw.delay) && raw.delay >= 0) step.delay = raw.delay;
  if (typeof raw.enableNavigation === "boolean") step.enableNavigation = raw.enableNavigation;
  return step;
}

/**
 * Builds the scenario to save from save_scenario's parameters. Fields the agent leaves out keep their
 * value from `existing` (when it updates a scenario) or the panel's defaults.
 */
export function parseScenarioInput(params: BridgeParams, existing: Scenario | null): Scenario {
  const title = params.title ?? existing?.title;
  if (typeof title !== "string" || title.trim() === "") throw new Error(`"title" must be a non-empty string`);

  let data = existing?.data;
  if (params.steps !== undefined) {
    if (!Array.isArray(params.steps)) throw new Error(`"steps" must be an array`);
    if (params.steps.length > MAX_STEPS) throw new Error(`A scenario can have at most ${MAX_STEPS} steps`);
    data = params.steps.map(parseStep);
  }
  if (!data || data.length === 0) throw new Error(`"steps" must contain at least one step`);

  const description = params.description ?? existing?.description;
  const tags = Array.isArray(params.tags)
    ? params.tags.filter((tag): tag is string => typeof tag === "string")
    : existing?.tags;

  return {
    ...existing,
    title: title.trim(),
    description: typeof description === "string" ? description : undefined,
    data,
    repeat: existing?.repeat ?? 1,
    tags,
  };
}

/** A new id in the panel's format: a lowercase letter and 15 random characters after the prefix */
export function newScenarioId(): string {
  const random = crypto.randomUUID().replace(/-/g, "");
  const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  return `${SCENARIO_ID_PREFIX}${letter}${random.slice(0, 15)}`;
}
