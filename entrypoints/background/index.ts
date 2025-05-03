import ExtensionLoader from "@entrypoints/core/services/ExtensionLoader.ts";
import {Ext} from "@entrypoints/features/extension/Ext";

import {skipTab} from "./shared/utils.ts";
import {actionsContextSlice} from "./features/backgroundSlice.ts";

let lastBrowserAction;


debugger;
export default defineBackground({
    /**
     * This is the main entry point for the background script.
     */
    main() {
        // Ext.events.register();
        //

        actionsContextSlice.initMiddleware();
        ExtensionLoader.init();

        browser.action.onClicked.addListener(async (tab) => {
            const checkTwiceClick = lastBrowserAction && Date.now() - lastBrowserAction < 10;
            if (checkTwiceClick) {
                // fix bug in Chrome Version 49.0.2623.87
                // that triggers browserAction.onClicked twice
                // when called from shortcut _execute_browser_action
                return;
            }

            if (skipTab(tab)) {
                return;
            }

            if (Ext.session.isActive(tab.id as number)) {
                await Ext.session.deactivate(tab.id as number);
            } else {
                await Ext.session.activate(tab.id as number);
            }

            lastBrowserAction = Date.now();
        })


        browser.runtime.onConnect.addListener((port) => {
            if (!port.sender?.tab?.id) return;

            Ext.session.initializePort(port);
        });


        chrome.runtime.onConnect.addListener(function (port) {
            // tabs[port.sender.tab.id].initialize(port);
            Ext.session.initializePort(port);
        });

        browser.runtime.onSuspend.addListener(() => {
            for (const [tabId] of Ext.session.getActivePorts()) {
                Ext.session.deactivate(tabId);
            }
        });

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
            if (changeInfo.status === 'loading') {
                if (debounceMap[tabId]) {
                    clearTimeout(debounceMap[tabId]);
                }

                debounceMap[tabId] = setTimeout(() => {
                    delete debounceMap[tabId];

                    if (Ext.session.isActive(tabId)) {
                        Ext.session.activate(tabId);
                    }
                    // наче цього часу має бути достатньо, так як  статус loading може виникати декілька раз
                    // інжект скрипту правцє з цим таймаутом нормально, так як перший скрипт встигає ініціалізуватись
                    // і другий раз вже код не вставляється
                }, 700);
            }
        });
    }
});