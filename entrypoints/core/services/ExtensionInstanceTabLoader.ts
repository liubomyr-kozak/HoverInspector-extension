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

const PATH_TO_JS_FILE = "content-scripts/content.js";

export const Status = {
  EXECUTED: "EXECUTED",
  REMOVED: "REMOVED",
  INITIAL: "INITIAL",
};

export class ExtensionInstanceTabLoader {
  tabId = 0;
  status = Status.INITIAL;

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
    console.log("ExtensionInstanceTabLoader::injectScript -> ???? injectScript");

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
      console.log("[Error:_inject_] tab: " + tabId + " lastError: " + JSON.stringify(error));
    }
  };

  checkScript = async (tabId: number) => {
    let action = "idle";

    try {
      const response = await sendMessage(HOVER_INSPECTOR_CHECK_SCRIPT, null, tabId);

      action = response?.checkAppHealth !== true ? "inject" : "activate";
    } catch (error) {
      const isActive = Ext.session.isActive(tabId);
      // я додаю скрипт при загрузці сторнки по дефолту (мабуть це було одне із ріщень де я раніше бачив
      // але якщо виникла якась помилка і бекграунд скрипт не має звязка з сторінкою то він отримає помилку
      // для цього ми ручками че раз вставляємо скрипт
      // але при умові що екстеншен [активний]
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
          console.log("Unknown action: ", action);
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

  async deactivate() {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Якщо вкладка знайдена — викликаємо деактивацію
    if (activeTab?.id !== undefined) {
      await Ext.session.deactivate(activeTab.id as number);
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
