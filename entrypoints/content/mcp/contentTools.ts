import { auditPageAsync, auditToCssVariables, type ValueUsage } from "@entrypoints/shared/utils/designAudit";
import { errorMessage } from "@entrypoints/core/mcp/protocol";
import { ContentMethod, type BridgeParams, type ContentCall, type ContentCallResult } from "@entrypoints/core/mcp/types";
import { store } from "@entrypoints/content/store/createStore";
import { automationActions } from "@entrypoints/content/store/automation/automation.slice";
import { playScenarioWatcher } from "@entrypoints/content/store/automation/automation.saga.action";
import type { Scenario } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types";
import type { CSSSnapshot } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/types";
import {
  buildSnapshotTree,
  createCSSSnapshot,
  getPageClasses,
} from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/snapshotBuilder";
import {
  loadSnapshots,
  trimAndSaveSnapshots,
} from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/snapshotStorage";
import { readViewportInfo } from "@entrypoints/content/modules/PopupContainer/PageRuler/utils/viewport";
import { runPageChecks } from "@entrypoints/content/modules/PopupContainer/PageRuler/utils/pageChecks";
import { themeFromAudit } from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/utils/themeFromAudit";

/**
 * Page operations an AI agent can call through the MCP bridge. The background forwards them here
 * because they read the live page. Results are plain JSON: DOM elements are replaced by short
 * descriptions such as `button#buy.btn.primary`.
 */

/** Elements listed per value or check; the count still covers all of them */
const ELEMENT_SAMPLE = 5;
/** Same caps as the panel's "Pick element" snapshot */
const ELEMENT_SNAPSHOT_MAX = 1000;

const describeElement = (element: Element): string => {
  const classes = getPageClasses(element).slice(0, 3);
  return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes.length ? `.${classes.join(".")}` : ""}`;
};

const sampleElements = (elements: Element[] | undefined) => (elements ?? []).slice(0, ELEMENT_SAMPLE).map(describeElement);

const usage = (values: ValueUsage[]) =>
  values.map(({ value, size, count, elements }) => ({ value, size, count, examples: sampleElements(elements) }));

const stringParam = (params: BridgeParams, key: string): string | undefined => {
  const value = params[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
};

function findElement(params: BridgeParams): Element | null {
  const selector = stringParam(params, "selector");
  const xpath = stringParam(params, "xpath");
  if (selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`No element matches the selector "${selector}"`);
    return element;
  }
  if (xpath) {
    const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!(node instanceof Element)) throw new Error(`No element matches the XPath "${xpath}"`);
    return node;
  }
  return null;
}

function getPageInfo() {
  return {
    url: location.href,
    title: document.title,
    viewport: readViewportInfo(window),
    checks: runPageChecks(document).map(({ elements, ...check }) => ({
      ...check,
      elementCount: elements?.length ?? 0,
      examples: sampleElements(elements),
    })),
  };
}

async function auditDesign(params: BridgeParams) {
  const audit = await auditPageAsync(document.body, { grid: params.grid === 8 ? 8 : 4 });
  return {
    url: location.href,
    title: document.title,
    scannedElements: audit.scannedElements,
    truncated: audit.truncated,
    score: audit.score,
    grid: audit.grid,
    colors: {
      text: usage(audit.colors.text),
      background: usage(audit.colors.background),
      border: usage(audit.colors.border),
    },
    typography: audit.typography.map(({ elements, ...style }) => ({ ...style, examples: sampleElements(elements) })),
    fontFamilies: usage(audit.families),
    fontSizes: usage(audit.fontSizes),
    spacing: usage(audit.spacing),
    radii: usage(audit.radii),
    shadows: usage(audit.shadows),
    cssVariables: audit.variables,
    issues: audit.issues.map(({ elements, ...issue }) => ({ ...issue, examples: sampleElements(elements) })),
    // The palette in the theme format the Color Palette tool imports, and as :root variables
    theme: themeFromAudit(audit, document.title || location.hostname),
    cssVariablesSheet: auditToCssVariables(audit),
  };
}

async function captureCssSnapshot(params: BridgeParams) {
  const element = findElement(params);
  const title = stringParam(params, "title");
  let snapshot: CSSSnapshot;
  if (element) {
    const { tree, stats } = buildSnapshotTree(element, {
      maxElements: ELEMENT_SNAPSHOT_MAX,
      skipInvisible: true,
      includeText: true,
      includeUnchanged: false,
    });
    snapshot = {
      id: `element-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
      url: location.href,
      title: title || `Element: ${describeElement(element)}`,
      elementCount: stats.totalNodes,
      root: tree,
      metadata: {
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        optimized: true,
      },
    };
  } else {
    snapshot = await createCSSSnapshot(title);
  }
  // Saved like the panel saves it, so it appears in the CSS Snapshot list and can be compared there
  await trimAndSaveSnapshots([...(await loadSnapshots()), snapshot]);
  return {
    id: snapshot.id,
    title: snapshot.title,
    url: snapshot.url,
    elementCount: snapshot.elementCount,
    scope: element ? "element" : "page",
  };
}

function isScenario(value: unknown): value is Scenario {
  return typeof value === "object" && value !== null && Array.isArray((value as Scenario).data);
}

function runScenario(params: BridgeParams) {
  const scenarioId = stringParam(params, "scenarioId");
  if (!scenarioId || !isScenario(params.scenario)) throw new Error("The scenario to run is missing");
  const { executing, activeScenarioId } = store.getState().automation;
  // Playing the running scenario again would stop it: the panel's play button toggles
  if (executing) throw new Error(`Scenario "${activeScenarioId}" is still running (see get_scenario_run)`);

  const startFromStep =
    typeof params.startFromStep === "number" && Number.isInteger(params.startFromStep) && params.startFromStep > 0
      ? params.startFromStep
      : 0;
  store.dispatch(automationActions.updateScenario({ id: scenarioId, scenario: params.scenario }));
  store.dispatch(playScenarioWatcher.getPayload({ id: scenarioId, startFromStep, triggerType: "mcp" }));
  return {
    started: true,
    scenarioId,
    stepCount: params.scenario.data.length,
    note: "Playback runs in the page. Poll get_scenario_run for progress; steps that open a page continue there.",
  };
}

function getScenarioRun() {
  const automation = store.getState().automation;
  return {
    url: location.href,
    executing: automation.executing,
    scenarioId: automation.activeScenarioId,
    status: automation.executionStatus,
    currentStepIndex: automation.currentStepIndex,
    progress: automation.executionProgress,
    error: automation.executionError,
    stepStatuses: automation.stepStatuses,
  };
}

const CONTENT_HANDLERS: Record<ContentMethod, (params: BridgeParams) => unknown> = {
  [ContentMethod.GET_PAGE_INFO]: getPageInfo,
  [ContentMethod.AUDIT_DESIGN]: auditDesign,
  [ContentMethod.CAPTURE_CSS_SNAPSHOT]: captureCssSnapshot,
  [ContentMethod.RUN_SCENARIO]: runScenario,
  [ContentMethod.GET_SCENARIO_RUN]: getScenarioRun,
};

/** Runs one forwarded call; errors are returned to the agent instead of thrown across the message channel */
export async function handleContentCall(call: ContentCall): Promise<ContentCallResult> {
  try {
    return { ok: true, result: await CONTENT_HANDLERS[call.method](call.params) };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
