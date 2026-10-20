import React, { createRoot } from "react-dom/client";
import { ExtensionRoot } from "./extension-root";

import {
  HOVER_INSPECTOR_ACTIVATE,
  HOVER_INSPECTOR_CHECK_SCRIPT,
  HOVER_INSPECTOR_DEACTIVATE,
  DEV_SCRIPT_INJECTED,
  PROD_SCRIPT_INJECTED,
  SCRIPT_INJECTION_ERROR,
  HOVER_INSPECTOR_MCP_CALL,
} from "@entrypoints/shared/globalEvents";
import { isProduction } from "@entrypoints/shared/helpers";

// import {onMessage} from "webext-bridge/content-script";
import "./style.css";

import { onMessage } from "@entrypoints/features/extension/messaging.ts";
import { store } from "@entrypoints/content/store/createStore.ts";
import { setActiveApp, setDisableApp } from "@entrypoints/content/store/app/app.slice.ts";
import { selectRecording, selectRecordingPaused } from "@entrypoints/content/store/automation/automation.slice.ts";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { injectScript } from "@entrypoints/shared/utils/scriptInjection.ts";
import { isContentCall } from "@entrypoints/core/mcp/protocol";
import type { ContentCallResult } from "@entrypoints/core/mcp/types";
import { handleContentCall } from "./mcp/contentTools";

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

    // An AI agent's request through the MCP bridge, forwarded by our background
    removeListeners.push(onMessage(HOVER_INSPECTOR_MCP_CALL, async (message): Promise<ContentCallResult> => {
      if (message.sender.id !== browser.runtime.id || !isContentCall(message.data)) {
        return { ok: false, error: "Invalid request" };
      }
      return handleContentCall(message.data);
    }));

    removeListeners.push(onMessage(SCRIPT_INJECTION_ERROR, (message) => {
      console.error("Content: Script injection error:", message);
      return { received: true };
    }));

    const ui = await createShadowRootUi(ctx, {
      name: "hover-inspector", // this is tag
      position: "overlay",
      // The highest z-index there is: sites with a 2147483647 header would otherwise cover the panel's
      // header. As the last element of its parent, the UI wins against equal z-indexes.
      zIndex: 2147483647,
      anchor: getUiAnchor,
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
          // A scenario pressing Esc on the page (key press step) must not switch the extension off mid-playback
          if (!event.isTrusted) return;

          const path = event.composedPath();
          // While recording, Esc on the page (closing the page's own dialog...) is a step of the scenario
          const state = store.getState();
          if (selectRecording(state) && !selectRecordingPaused(state) && !path.includes(ui.shadowHost)) return;
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

        // Focus rings only while the user navigates with the keyboard: Chrome also matches :focus-visible
        // after clicks on tabs, after programmatic focus and on focusable containers, which drew blue
        // outlines all over the panels for mouse users.
        const host = ui.shadowHost;
        const onKeyboardNav = (event: KeyboardEvent) => {
          if (event.key === "Tab" || event.key.startsWith("Arrow")) host.setAttribute("data-hi-keyboard", "");
        };
        const onPointerNav = () => host.removeAttribute("data-hi-keyboard");
        window.addEventListener("keydown", onKeyboardNav, true);
        window.addEventListener("pointerdown", onPointerNav, true);

        const removeListeners = () => {
          document.removeEventListener("keydown", onEscape);
          window.removeEventListener("keydown", onKeyboardNav, true);
          window.removeEventListener("pointerdown", onPointerNav, true);
        };
        ctx.onInvalidated(removeListeners);

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

        return { root, wrapper, removeListeners };
      },
      onRemove: (elements) => {
        elements?.removeListeners();
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    ui.mount();

    // `zoom` on the page's <html>/<body> would scale the whole UI and shift every overlay drawn from
    // getBoundingClientRect() (already in zoomed viewport pixels). Cancel the inherited zoom on our host.
    const cancelPageZoom = () => {
      let inherited = 1;
      for (let el = ui.shadowHost.parentElement; el; el = el.parentElement) {
        inherited *= parseFloat(getComputedStyle(el).zoom) || 1;
      }
      const zoom = inherited === 1 ? "" : String(1 / inherited);
      if (ui.shadowHost.style.zoom !== zoom) ui.shadowHost.style.zoom = zoom;
    };
    cancelPageZoom();
    window.addEventListener("resize", cancelPageZoom);
    keepUiOutOfContainingBlocks(ui.shadowHost, ctx);
    ctx.onInvalidated(() => window.removeEventListener("resize", cancelPageZoom));
  },
});

/**
 * Everything in the UI is position: fixed, which breaks as soon as an ancestor of the host creates a
 * containing block for fixed elements: a transform/filter/perspective/contain on <html> (the anchor
 * fallback below can't move above that) would make the toolbar and panel scroll off with the page.
 *
 * On such pages the host is shown as a manual popover in the browser's top layer, where it is laid out
 * against the viewport whatever its ancestors do (and paints above every page z-index). Other pages
 * keep the plain host, so page-anchored content in it (sticky notes) keeps scrolling natively with the
 * page. The UA styles for [popover] (centered, padded, bordered, scrollable, opaque) are cancelled with
 * inline !important so the host stays the 0x0 overflow-visible box WXT expects, also against page
 * rules such as `[popover] { ... !important }`.
 */
function keepUiOutOfContainingBlocks(host: HTMLElement, ctx: { onInvalidated: (cb: () => void) => void }) {
  if (typeof host.showPopover !== "function") return;

  const topLayerStyles: Record<string, string> = {
    position: "fixed",
    inset: "0 auto auto 0",
    margin: "0",
    padding: "0",
    border: "0",
    width: "0",
    height: "0",
    "min-width": "0",
    "min-height": "0",
    "max-width": "none",
    "max-height": "none",
    overflow: "visible",
    background: "transparent",
    color: "inherit",
    display: "block",
    opacity: "1",
    visibility: "visible",
    transform: "none",
    translate: "none",
    scale: "none",
    rotate: "none",
    filter: "none",
    clip: "auto",
    "clip-path": "none",
    contain: "none",
  };
  const plainCssText = host.style.cssText;
  let inTopLayer = false;

  const show = () => {
    if (!inTopLayer || !host.isConnected || host.matches(":popover-open")) return;
    try {
      host.showPopover();
    } catch {
      // In a document that can't show popovers: stays a regular fixed overlay.
    }
  };

  const enter = () => {
    inTopLayer = true;
    const zoom = host.style.zoom;
    for (const [prop, value] of Object.entries(topLayerStyles)) host.style.setProperty(prop, value, "important");
    host.style.zoom = zoom;
    host.setAttribute("popover", "manual");
    show();
  };

  const leave = () => {
    inTopLayer = false;
    const zoom = host.style.zoom;
    if (host.matches(":popover-open")) host.hidePopover();
    host.removeAttribute("popover");
    host.style.cssText = plainCssText;
    host.style.zoom = zoom;
  };

  const update = () => {
    if (!host.isConnected) return;
    const needed = hasFixedContainingBlockAncestor(host);
    if (needed && !inTopLayer) enter();
    else if (!needed && inTopLayer) leave();
    else show();
  };
  update();

  // Re-show if anything (a page script toggling every [popover], a re-mount) hides it
  host.addEventListener("toggle", (event) => {
    if ((event as ToggleEvent).newState === "closed") queueMicrotask(show);
  });
  // Pages switch these styles at runtime (classes/inline styles on <html>/<body>, media queries)
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
  window.addEventListener("resize", update);
  ctx.onInvalidated(() => {
    observer.disconnect();
    window.removeEventListener("resize", update);
  });
}

/** Whether a computed style makes the element the containing block of its position: fixed descendants. */
function createsFixedContainingBlock(style: CSSStyleDeclaration): boolean {
  return (
    style.transform !== "none" ||
    (!!style.translate && style.translate !== "none") ||
    (!!style.scale && style.scale !== "none") ||
    (!!style.rotate && style.rotate !== "none") ||
    style.filter !== "none" ||
    style.perspective !== "none" ||
    (!!style.backdropFilter && style.backdropFilter !== "none") ||
    /paint|layout|strict|content/.test(style.contain) ||
    /transform|filter|perspective|translate|scale|rotate/.test(style.willChange) ||
    (!!style.containerType && style.containerType !== "normal")
  );
}

function hasFixedContainingBlockAncestor(element: Element): boolean {
  for (let el = element.parentElement; el; el = el.parentElement) {
    if (createsFixedContainingBlock(getComputedStyle(el))) return true;
  }
  return false;
}

/**
 * The UI is position: fixed, which breaks when <body> creates a containing block for fixed elements
 * (transform, filter, contain, ...): the toolbar and panel would then be placed relative to the body
 * and scroll away with the page. On such pages the UI goes on <html> instead. Also used while the
 * body doesn't exist yet (script injected into a page that is still parsing).
 */
function getUiAnchor(): Element {
  const body = document.body;
  if (!body) return document.documentElement;

  return createsFixedContainingBlock(getComputedStyle(body)) ? document.documentElement : body;
}
