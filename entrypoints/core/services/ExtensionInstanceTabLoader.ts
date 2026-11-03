import { skipTab } from "../../background/shared/utils.ts";
import {
  HOVER_INSPECTOR_ACTIVATE,
  HOVER_INSPECTOR_CHECK_SCRIPT,
  HOVER_INSPECTOR_EMIT_ERROR,
  HOVER_INSPECTOR_INIT,
  HOVER_INSPECTOR_UPDATE_GLOBAL_APP_STATE,
} from "@entrypoints/shared/globalEvents.ts";
import { Ext } from "@entrypoints/features/extension/Ext";
import { sendMessage } from "@entrypoints/features/extension/messaging.ts";
import { createSerialByKey } from "@entrypoints/shared/utils/serialByKey.ts";

const PATH_TO_JS_FILE = "content-scripts/content.js";

export const Status = {
  EXECUTED: "EXECUTED",
  REMOVED: "REMOVED",
  INITIAL: "INITIAL",
};

export class ExtensionInstanceTabLoader {
  tabId = 0;
  status = Status.INITIAL;

  // executeScript waits until the page is idle, and the content script answers the health check only
  // after that. A second check in the meantime (the page changed its URL while loading, a click on the
  // toolbar button) found no answer and injected another copy of the whole content script; the old
  // copies stayed in memory (about 6 MB each) with their listeners. Checks for one tab now wait for the
  // previous one, so the second check finds the injected script and only activates it.
  private serialPerTab = createSerialByKey<number>();

  // init = (tabId) => {
  //   this.tabId = tabId;
  //   // this.executeScript();
  //
  //   chrome.tabs.query({}, function gotTabs(tabs) {
  //     for (let index = 0; index < tabs.length; index++) {
  //       try {
  //         if (tabs[index].url && !tabs[index].url.includes("chrome://") && !tabs[index].url.includes("chrome.com")) {
  //           chrome.tabs.sendMessage(tabs[index].id, {
  //             action: LINGUAREEF_ACTIVE_APP,
  //           });
  //           chrome.tabs.sendMessage(tabs[index].id, {
  //             action: LINGUAREEF_UPDATE_GLOBAL_APP_SETTING,
  //           });
  //         }
  //       } catch (error) {
  //         console.error("Error in sending message: ", error);
  //       }
  //     }
  //   });
  // };

  injectScript = async (tabId) => {

    try {
      await browser?.scripting.executeScript({
        target: { tabId },
        files: [PATH_TO_JS_FILE],
      });
      // await browser.scripting.insertCSS({
      //     target: {tabId},
      //     files: ['content-scripts/content.css'],
      // });
    } catch (error) {
    }
  };

  checkScript = (tabId: number) => this.serialPerTab(tabId, () => this.checkScriptNow(tabId));

  private checkScriptNow = async (tabId: number) => {
    let action = "idle";

    try {
      const response = await sendMessage(HOVER_INSPECTOR_CHECK_SCRIPT, null, tabId);

      action = response?.checkAppHealth !== true ? "inject" : "activate";
    } catch (error) {
      const isActive = Ext.session.isActive(tabId);
      // The script is added on page load by default. If something fails and the background script
      // has no connection to the page, it gets an error,
      // so the script is injected again manually,
      // but only while the extension is active.
      if (isActive) {
        action = "inject";
      }
    }

    try {
      switch (action) {
        case "inject":
          await this.injectScript(tabId);
          break;
        case "activate":
          await sendMessage(HOVER_INSPECTOR_ACTIVATE, null, tabId);
          break;
        default:
      }
    } catch (error) {
      console.error("[Error:_check_] sending message to tab:", error);
    }
  };

  updateScriptManual = async (tabId: number) => {
    await this.checkScript(tabId);
  };

  updateStatusInAllTab = async () => {
    try {
      const tabs = await browser.tabs?.query({});

      tabs.forEach((tab) => {
        if (skipTab(tab)) return;

        tab.id &&
          browser.tabs.sendMessage(tab.id, {
            action: HOVER_INSPECTOR_UPDATE_GLOBAL_APP_STATE,
          });
      });
    } catch (error) {
      console.info("[Error:   updateStatusInAllTab  ] sending message to tab:", error);
    }
  };

  updateStatusInActiveTab = async () => {
    try {
      const tabs = await browser.tabs.query({});

      tabs.forEach(function (tab) {
        if (skipTab(tab)) return;

        tab.id &&
          browser.tabs.sendMessage(tab.id, {
            action: HOVER_INSPECTOR_UPDATE_GLOBAL_APP_STATE,
          });
      });
    } catch (error) {
      console.info("[Error:   updateStatusInAllTab  ] sending message to tab:", error);
    }
  };

  emitErrorsInAllTab = async () => {
    try {
      const tabs = await browser.tabs.query({});

      tabs.forEach(function (tab) {
        if (skipTab(tab)) return;

        tab.id &&
          browser.tabs.sendMessage(tab.id, {
            action: HOVER_INSPECTOR_EMIT_ERROR,
          });
      });
    } catch (error) {
      console.info("[Error:   updateStatusInAllTab  ] sending message to tab:", error);
    }
  };

  firstInitAppSendEventToInitSettings = async () => {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    tabs.forEach((tab) => {
      tab.id &&
        browser.tabs.sendMessage(tab.id, {
          action: HOVER_INSPECTOR_INIT,
        });
    });
  };

  async deactivate(tabId?: number) {
    // Deactivate the tab that asked for it; fall back to the active tab for callers without a sender
    if (tabId === undefined) {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      tabId = activeTab?.id;
    }

    if (tabId !== undefined) {
      await Ext.session.deactivate(tabId);
    }
  }

  // removeScript = () => {
  //   this.status = Status.REMOVED;
  //
  //   chrome.tabs.query({}, function gotTabs(tabs) {
  //     for (let index = 0; index < tabs.length; index++) {
  //       try {
  //         if (tabs[index].url && !tabs[index].url.includes("chrome://") && !tabs[index].url.includes("chrome.com")) {
  //           chrome.tabs.sendMessage(tabs[index].id, {
  //             action: LINGUAREEF_INACTIVE_APP,
  //           });
  //         }
  //       } catch (error) {
  //         console.error("[Error:_check_] in sending message: ", error);
  //       }
  //     }
  //   });
  // };
}
