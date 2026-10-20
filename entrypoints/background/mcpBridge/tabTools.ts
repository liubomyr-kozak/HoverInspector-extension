import { browser, type Browser } from "wxt/browser";

import { Ext } from "@entrypoints/features/extension/Ext";
import { sendMessage } from "@entrypoints/features/extension/messaging";
import { HOVER_INSPECTOR_MCP_CALL } from "@entrypoints/shared/globalEvents";
import { errorMessage } from "@entrypoints/core/mcp/protocol";
import type { BridgeParams, ContentMethod } from "@entrypoints/core/mcp/types";

import { skipTab } from "../shared/utils";
import { optionalBoolean, optionalTabId } from "./params";

/** The content script registers its listeners right after injection; give it this long to answer */
const CONTENT_RETRY_DELAY_MS = 250;
const CONTENT_RETRIES = 12;
/** A tab switched to for a screenshot needs a moment to paint */
const TAB_SWITCH_PAINT_MS = 350;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface TabSummary {
  tabId: number;
  windowId: number;
  active: boolean;
  title: string;
  url: string;
  /** Hover Inspector is switched on in this tab */
  inspectorActive: boolean;
}

/** Every tab the extension can work in (not chrome:// pages, the new tab page or the web store) */
export async function listTabs(): Promise<TabSummary[]> {
  await Ext.session.ready;
  const tabs = await browser.tabs.query({});
  return tabs
    .filter((tab) => !skipTab(tab, { allowLoading: true }))
    .map((tab) => ({
      tabId: tab.id as number,
      windowId: tab.windowId,
      active: tab.active,
      title: tab.title || "",
      url: tab.url || "",
      inspectorActive: Ext.session.isActive(tab.id as number),
    }));
}

/** The requested tab, or the active tab of the window the user last focused */
async function resolveTab(params: BridgeParams): Promise<Browser.tabs.Tab> {
  const tabId = optionalTabId(params);
  if (tabId !== undefined) return browser.tabs.get(tabId);
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) throw new Error("No active tab. Pass tabId (see list_tabs).");
  return tab;
}

export async function takeScreenshot(params: BridgeParams) {
  const tab = await resolveTab(params);
  if (tab.id === undefined) throw new Error("This tab cannot be captured");
  // Only the visible tab of a window can be captured
  if (!tab.active && optionalBoolean(params, "activate") !== false) {
    await browser.tabs.update(tab.id, { active: true });
    await wait(TAB_SWITCH_PAINT_MS);
  } else if (!tab.active) {
    throw new Error("The tab is in the background. Call again with activate: true.");
  }
  const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  return {
    tabId: tab.id,
    url: tab.url || "",
    title: tab.title || "",
    mimeType: "image/png",
    data: dataUrl.replace(/^data:image\/png;base64,/, ""),
  };
}

/**
 * Runs a page operation in the tab's content script. Switches Hover Inspector on in the tab first when it
 * is off, which also opens its panel there: the tools that read the page live in the content script.
 */
export async function callContent(params: BridgeParams, method: ContentMethod): Promise<unknown> {
  const tab = await resolveTab(params);
  if (skipTab(tab, { allowLoading: true })) {
    throw new Error("Hover Inspector cannot run in this tab (browser pages, the new tab page and the web store are off limits)");
  }
  const tabId = tab.id as number;

  await Ext.session.ready;
  if (!Ext.session.isActive(tabId)) await Ext.session.activate(tabId);

  let lastError: unknown;
  for (let attempt = 0; attempt < CONTENT_RETRIES; attempt += 1) {
    try {
      const answer = await sendMessage(HOVER_INSPECTOR_MCP_CALL, { method, params }, tabId);
      if (!answer) throw new Error("The page did not answer");
      if (!answer.ok) throw new PageError(answer.error);
      return { tabId, ...toObject(answer.result) };
    } catch (error) {
      // The page answered with an error: retrying will not change it
      if (error instanceof PageError) throw error;
      lastError = error;
      await wait(CONTENT_RETRY_DELAY_MS);
    }
  }
  throw new Error(`The page did not respond: ${errorMessage(lastError)}`);
}

class PageError extends Error {}

const toObject = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : { result: value };
