import React, { createRoot } from "react-dom/client";
import { ExtensionRoot } from "./extension-root";

import {
  HOVER_INSPECTOR_ACTIVATE,
  HOVER_INSPECTOR_CHECK_SCRIPT,
  HOVER_INSPECTOR_DEACTIVATE,
  DEV_SCRIPT_INJECTED,
  PROD_SCRIPT_INJECTED,
  SCRIPT_INJECTION_ERROR,
} from "@entrypoints/shared/globalEvents";
import { isProduction } from "@entrypoints/shared/helpers";

// import {onMessage} from "webext-bridge/content-script";
import "./style.css";

import { onMessage } from "@entrypoints/features/extension/messaging.ts";
import { store } from "@entrypoints/content/store/createStore.ts";
import { setActiveApp, setDisableApp } from "@entrypoints/content/store/app/app.slice.ts";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { injectScript } from "@entrypoints/shared/utils/scriptInjection.ts";

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

    // When the script is injected a second time, WXT invalidates the previous instance's context and
    // removes its UI. The new instance therefore always mounts (an early return here used to leave the
    // tab with no UI at all), and the old instance drops its message handlers so only one answers.
    const removeListeners: Array<() => void> = [];
    ctx.onInvalidated(() => removeListeners.forEach((remove) => remove()));

    removeListeners.push(onMessage(HOVER_INSPECTOR_CHECK_SCRIPT, (data) => {
      return { checkAppHealth: true };
    }));

    removeListeners.push(onMessage(HOVER_INSPECTOR_DEACTIVATE, (data) => {
      store.dispatch(setDisableApp());
    }));

    removeListeners.push(onMessage(HOVER_INSPECTOR_ACTIVATE, (data) => {
      store.dispatch(setActiveApp());
    }));

    // Script injection message handlers
    removeListeners.push(onMessage(DEV_SCRIPT_INJECTED, (message) => {
      // In development mode, inject script via DOM
      if (message.data?.downloadUrl) {
        // Use the utility function to inject the script
        injectScript({
          downloadUrl: message.data.downloadUrl,
          filename: message.data.filename,
          groupPrefix: "functions_",
        });
      }

      return { success: true, mode: "development" };
    }));

    removeListeners.push(onMessage(PROD_SCRIPT_INJECTED, (message) => {
      return { success: true, mode: "production" };
    }));

    removeListeners.push(onMessage(SCRIPT_INJECTION_ERROR, (message) => {
      console.error("Content: Script injection error:", message);
      return { received: true };
    }));

    const ui = await createShadowRootUi(ctx, {
      name: "hover-inspector", // this is tag
      position: "overlay",
      zIndex: 2147483646,
      onMount: (container) => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement("div");
        container.append(wrapper);
        //
        const root = createRoot(wrapper);

        root.render(<ExtensionRoot shadowRoot={ui.shadow} />);

        // Esc turns the extension off, except while typing (in the page or in our panels) or while one of
        // our dropdowns/dialogs is open. Events from the shadow root reach the document retargeted to the
        // host, so hotkeys-js could not tell an Esc in our own input apart and closed everything.
        const onEscape = (event: KeyboardEvent) => {
          if (event.key !== "Escape" || event.defaultPrevented) return;

          const path = event.composedPath();
          const target = path[0] as HTMLElement | undefined;
          if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")) return;

          // Inside our UI, Esc first closes the open dropdown / dialog / menu
          const inOverlay = path.some(
            (node) =>
              node instanceof HTMLElement &&
              (/^(dialog|listbox|menu|combobox)$/.test(node.getAttribute("role") || "") ||
                /ant-(select|dropdown|popover|modal)/.test(typeof node.className === "string" ? node.className : "")),
          );
          if (path.includes(ui.shadowHost) && inOverlay) return;

          ExtensionStorageManager.deactivateAppInTab();
        };
        document.addEventListener("keydown", onEscape);
        ctx.onInvalidated(() => document.removeEventListener("keydown", onEscape));

        function checkAppHealth() {
          if (browser?.runtime?.id) {
            // window.dispatchEvent(new Event(HOVER_INSPECTOR_UPDATE_GLOBAL_ON_PAGE_FOCUS));
            // window.removeEventListener(HOVER_INSPECTOR_REINITAPP, checkAppInit);
          }

          if (!isProduction()) return;
          if (browser?.runtime?.id) return;

          root.unmount();
          wrapper.remove();

          window.removeEventListener("focus", checkAppHealth);
        }

        checkAppHealth();

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
