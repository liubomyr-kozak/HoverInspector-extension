import React, { createRoot } from "react-dom/client";
import { ExtensionRoot } from "./extension-root.tsx";

import {
  HOVER_INSPECTOR_ACTIVATE,
  HOVER_INSPECTOR_CHECK_SCRIPT,
  HOVER_INSPECTOR_DEACTIVATE,
  DEV_SCRIPT_INJECTED,
  PROD_SCRIPT_INJECTED,
  SCRIPT_INJECTION_ERROR,
} from "@entrypoints/shared/globalEvents";
import { isProduction } from "@entrypoints/shared/helpers";
import browserApi from "@entrypoints/core/services/api/BrowserApi.ts";

// import {onMessage} from "webext-bridge/content-script";
import "./style.scss";

import { onMessage } from "@entrypoints/features/extension/messaging.ts";
import { store } from "@entrypoints/content/store/createStore.ts";
import { setActiveApp, setDisableApp } from "@entrypoints/content/store/app/app.slice.ts";
import hotkeys from "hotkeys-js";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";

debugger;

declare global {
  interface Window {
    __HOVER_INSPECTOR_CONTENTALL_INSERTED__?: boolean;
  }
}

export default defineContentScript({
  matches: ["*://*/*"],
  registration: "runtime",
  cssInjectionMode: "ui",
  runAt: "document_idle",
  /**
   * Main entry point for the content script.
   */
  async main(ctx) {
    if (ctx.isInvalid) {
      return;
    }

    // у випадку якщо було створено заінджекшено декілька разів скрипт, це може бути або глюк або логіка з
    //  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    //             if (changeInfo.status === 'loading') { не спрацювала коректно
    // я добавив цю перевірку
    if (window.__HOVER_INSPECTOR_CONTENTALL_INSERTED__) {
      return;
    }

    window.__HOVER_INSPECTOR_CONTENTALL_INSERTED__ = true;

    onMessage(HOVER_INSPECTOR_CHECK_SCRIPT, (data) => {
      return { checkAppHealth: true };
    });

    onMessage(HOVER_INSPECTOR_DEACTIVATE, (data) => {
      store.dispatch(setDisableApp());
    });

    onMessage(HOVER_INSPECTOR_ACTIVATE, (data) => {
      store.dispatch(setActiveApp());
    });

    // Script injection message handlers
    onMessage(DEV_SCRIPT_INJECTED, (message) => {
      console.log("Content: Received DEV script injection:", message);

      // In development mode, inject script via DOM
      if (message.data?.scriptUrl) {
        const script = document.createElement("script");
        script.src = message.data.scriptUrl;
        script.setAttribute("data-hover-inspector", message.data.filename);
        script.onload = () => {
          console.log(`Content: Successfully loaded DEV script: ${message.data?.filename}`);
        };
        script.onerror = (error) => {
          console.error(`Content: Failed to load DEV script: ${message.data?.filename}`, error);
        };
        (document.head || document.documentElement).appendChild(script);
      }

      return { success: true, mode: "development" };
    });

    onMessage(PROD_SCRIPT_INJECTED, (message) => {
      console.log("Content: Received PROD script injection notification:", message);
      return { success: true, mode: "production" };
    });

    onMessage(SCRIPT_INJECTION_ERROR, (message) => {
      console.error("Content: Script injection error:", message);
      return { received: true };
    });

    const ui = await createShadowRootUi(ctx, {
      name: "hover-inspector", // this is tag
      position: "overlay",
      zIndex: 2147483646,
      anchor: "body",
      onMount: (container) => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement("div");
        container.append(wrapper);

        const root = createRoot(wrapper);

        const head = container!.parentElement!.childNodes[0];

        root.render(<ExtensionRoot shadowRoot={ui.shadow} />);

        function checkAppHealth() {
          if (browserApi?.runtime?.id) {
            // window.dispatchEvent(new Event(HOVER_INSPECTOR_UPDATE_GLOBAL_ON_PAGE_FOCUS));
            // window.removeEventListener(HOVER_INSPECTOR_REINITAPP, checkAppInit);
          }

          if (!isProduction()) return;
          if (browserApi?.runtime?.id) return;

          root.unmount();
          wrapper.remove();

          window.removeEventListener("focus", checkAppHealth);
        }

        checkAppHealth();

        hotkeys("esc", function () {
          ExtensionStorageManager.deactivateAppInTab();
        });

        return { root, wrapper };
      },
      onRemove: (elements) => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    ui.mount();
  },
});
