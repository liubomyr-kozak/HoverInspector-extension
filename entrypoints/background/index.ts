import ExtensionLoader from "@entrypoints/core/services/ExtensionLoader.ts";
import { Ext } from "@entrypoints/features/extension/Ext";

import { skipTab } from "./shared/utils.ts";
import { actionsContextSlice } from "./store/backgroundSlice.ts";
import { appBackgroundSlice } from "./store/appBackgroundSlice.ts";
import { handleAutomationTabPort, registerAutomationTabListeners } from "./automationTabs.ts";

let lastBrowserAction;

export default defineBackground({
  /**
   * This is the main entry point for the background script.
   */
  main() {
    // Ext.events.register();
    //

    actionsContextSlice.initMiddleware();
    appBackgroundSlice.initMiddleware();
    ExtensionLoader.init();

    browser.action.onClicked.addListener(async (tab) => {
      const checkTwiceClick = lastBrowserAction && Date.now() - lastBrowserAction < 10;
      if (checkTwiceClick) {
        // fix bug in Chrome Version 49.0.2623.87
        // that triggers browserAction.onClicked twice
        // when called from shortcut _execute_browser_action
        return;
      }

      lastBrowserAction = Date.now();

      // A tab that is still loading can be activated: the script is injected once the document is idle
      if (skipTab(tab, { allowLoading: true })) {
        return;
      }

      await Ext.session.ready;

      if (Ext.session.isActive(tab.id as number)) {
        await Ext.session.deactivate(tab.id as number);
      } else {
        await Ext.session.activate(tab.id as number);
      }
    });

    // browser.runtime and chrome.runtime are the same object in Chrome, so one listener handles every port
    chrome.runtime.onConnect.addListener(function (port) {
      if (handleAutomationTabPort(port)) return;
      if (!port.sender?.tab?.id) return;

      Ext.session.initializePort(port);
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      if (Ext.session.isActive(tabId)) {
        Ext.session.clear(tabId);
      }
    });

    // Prerendered or instant pages swap in a new tab id; carry the active state over to it
    chrome.tabs.onReplaced?.addListener(async (addedTabId, removedTabId) => {
      await Ext.session.ready;
      if (!Ext.session.isActive(removedTabId)) return;
      Ext.session.clear(removedTabId);
      try {
        await Ext.session.activate(addedTabId);
      } catch (error) {
        console.warn("Could not re-activate replaced tab", error);
      }
    });

    browser.runtime.onSuspend.addListener(() => {
      for (const [tabId] of Ext.session.getActivePorts()) {
        Ext.session.deactivate(tabId);
      }
    });

    registerAutomationTabListeners();

    const debounceMap: Record<number, NodeJS.Timeout> = {};

    /**
     * Listener for tab updates, specifically when a tab begins loading.
     * Слухаємо обновлення вкладок, зокрема коли вкладка починає завантажуватись.
     * Або користувач перезавантажив сторінку cmd+r.
     *
     * @param tabId - The ID of the updated tab.
     * @param changeInfo - An object containing information about the tab update.
     */
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.status === "loading") {
        if (debounceMap[tabId]) {
          clearTimeout(debounceMap[tabId]);
        }

        debounceMap[tabId] = setTimeout(async () => {
          delete debounceMap[tabId];

          await Ext.session.ready;
          if (Ext.session.isActive(tabId)) {
            Ext.session.activate(tabId);
          }
          // наче цього часу має бути достатньо, так як  статус loading може виникати декілька раз
          // інжект скрипту правцє з цим таймаутом нормально, так як перший скрипт встигає ініціалізуватись
          // і другий раз вже код не вставляється
        }, 700);
      }
    });
  },
});
