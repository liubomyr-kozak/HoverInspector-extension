import { Observable } from "rxjs";
import { share } from "rxjs/operators";

// Predefined highlight style variants
export const HIGHLIGHT_STYLES = {
  selection: {
    border: "2px solid red",
    backgroundColor: "rgba(255,0,0,0.1)",
  },
  hover: {
    border: "2px solid #3b82f6",
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  note: {
    border: "2px solid #22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  picker: {
    border: "2px solid #22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
} as const;

// Pointer presses swallowed while an element is being picked (the click itself picks it)
const PRESS_EVENTS = ["pointerdown", "mousedown", "pointerup", "mouseup", "touchstart", "touchend"] as const;

export type HighlightStyleVariant = keyof typeof HIGHLIGHT_STYLES;

export interface SelectionEvent {
  type: "started" | "selected" | "stopped";
  xpath?: string;
  element?: Element;
  reason?: "completed" | "cancelled" | "escape";
}

class HighlightOverlayManager {
  private static instance: HighlightOverlayManager;
  private overlay: HTMLDivElement;
  private highlightTimer?: NodeJS.Timeout;

  // Handlers of the active selection stream (click / Esc / hover)
  private clickHandler?: (e: MouseEvent) => void;
  private escHandler?: (e: KeyboardEvent) => void;
  private mouseMoveHandler?: (e: MouseEvent) => void;
  // Standalone hover highlight (startMouseMoveHighlight); kept separate so it never
  // overwrites — and leaks — the selection stream's mousemove handler
  private hoverMoveHandler?: (e: MouseEvent) => void;
  // Ends the active selection stream with a "stopped" event
  private stopActiveSelection?: (reason: SelectionEvent["reason"]) => void;

  private constructor() {
    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, {
      position: "absolute",
      // One below the extension UI (content/index.tsx), so the highlight never covers the panel
      zIndex: "2147483646",
      pointerEvents: "none",
      display: "none",
      boxSizing: "border-box",
    });
    document.body.appendChild(this.overlay);

    // Add CSS keyframes for blink animation
    this.injectBlinkAnimationStyles();
  }

  public static getInstance(): HighlightOverlayManager {
    if (!HighlightOverlayManager.instance) {
      HighlightOverlayManager.instance = new HighlightOverlayManager();
    }
    return HighlightOverlayManager.instance;
  }

  private applyOverlayStyles(rect: DOMRect, styles: Partial<CSSStyleDeclaration>) {
    Object.assign(this.overlay.style, {
      top: rect.top + window.scrollY + "px",
      left: rect.left + window.scrollX + "px",
      width: rect.width + "px",
      height: rect.height + "px",
      display: "block",
      ...styles,
    });
  }

  generateXPath(el: Element): string {
    if (el.id) return `//*[@id="${el.id}"]`;
    const segments: string[] = [];
    let current: Element | null = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tag = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentNode?.children || []).filter(
        (child) => child.tagName === current!.tagName,
      );
      const index = siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : "";
      segments.unshift(tag + index);
      current = current.parentElement;
    }
    return "/" + segments.join("/");
  }

  public getElementByXPath(xpath: string): Element | null {
    try {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue as Element | null;
    } catch {
      return null;
    }
  }

  private clearSelectionHandlers() {
    if (this.clickHandler) document.removeEventListener("click", this.clickHandler, true);
    if (this.escHandler) document.removeEventListener("keydown", this.escHandler, true);
    if (this.mouseMoveHandler) document.removeEventListener("mousemove", this.mouseMoveHandler, true);

    this.clickHandler = this.escHandler = this.mouseMoveHandler = undefined;
    this.stopActiveSelection = undefined;
  }

  private clearHoverHandler() {
    if (this.hoverMoveHandler) document.removeEventListener("mousemove", this.hoverMoveHandler, true);
    this.hoverMoveHandler = undefined;
  }

  private clearHandlers() {
    this.clearSelectionHandlers();
    this.clearHoverHandler();
  }

  private clearHighlightTimer() {
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
      this.highlightTimer = undefined;
    }
  }

  private injectBlinkAnimationStyles() {
    // Check if styles are already injected
    if (document.getElementById("highlight-overlay-blink-styles")) return;

    const style = document.createElement("style");
    style.id = "highlight-overlay-blink-styles";
    style.textContent = `
      @keyframes highlightBlink {
        0%, 50% { opacity: 1; }
        25%, 75% { opacity: 0.3; }
      }
      .highlight-overlay-blink {
        animation: highlightBlink 0.6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  public startHighlight(
    xpath: string,
    variant: HighlightStyleVariant = "selection",
    customStyles?: Partial<CSSStyleDeclaration>,
  ) {
    const el = this.getElementByXPath(xpath);

    if (!el) return this.stopHighlight();

    // Clear existing timer
    this.clearHighlightTimer();

    // Scroll element into view (centered)
    try {
      el.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
    } catch {
      // Fallback for older browsers
      (el as any).scrollIntoView && (el as any).scrollIntoView();
    }

    // Apply styles on next frame to account for scroll layout changes
    requestAnimationFrame(() => {
      this.applyOverlayStyles(el.getBoundingClientRect(), {
        ...HIGHLIGHT_STYLES[variant],
        ...customStyles,
      });

      // Add blink animation
      this.overlay.classList.add("highlight-overlay-blink");

      // Set up 2-second auto-stop timer
      this.highlightTimer = setTimeout(() => {
        this.stopHighlight();
      }, 2000);
    });
  }

  public stopHighlight() {
    this.clearHighlightTimer();
    this.overlay.classList.remove("highlight-overlay-blink");
    this.overlay.style.display = "none";
  }

  public startMouseMoveHighlight(
    variant: HighlightStyleVariant = "hover",
    customStyles?: Partial<CSSStyleDeclaration>,
  ) {
    this.clearHoverHandler();

    let lastTarget: Element | null = null;
    this.hoverMoveHandler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (lastTarget === target) return;
      lastTarget = target;

      if (!target || target.nodeType !== Node.ELEMENT_NODE || this.isExtensionEvent(e)) {
        this.overlay.style.display = "none";
        return;
      }

      this.applyOverlayStyles(target.getBoundingClientRect(), {
        ...HIGHLIGHT_STYLES[variant],
        ...customStyles,
      });
    };

    document.addEventListener("mousemove", this.hoverMoveHandler, true);
  }

  /** Stops hover highlighting and any active selection, removing every listener. */
  public stopMouseMoveHighlight() {
    this.stopSelectionMode();
    this.clearHandlers();
    this.stopHighlight();
  }

  /** Cancels the active selection; subscribers receive { type: "stopped", reason: "cancelled" }. */
  public stopSelectionMode() {
    if (this.stopActiveSelection) {
      this.stopActiveSelection("cancelled");
    } else {
      this.clearSelectionHandlers();
    }
  }

  public isSelectionActive(): boolean {
    return !!(this.clickHandler && this.escHandler);
  }

  public streamSelectionMode(): Observable<SelectionEvent> {
    return new Observable<SelectionEvent>((subscriber) => {
      // Only one selection can be active at a time: cancel the previous one
      this.stopSelectionMode();

      let finished = false;
      const finish = (reason: SelectionEvent["reason"], selected?: { xpath: string; element: Element }) => {
        if (finished) return;
        finished = true;
        teardown();
        if (selected) subscriber.next({ type: "selected", ...selected });
        subscriber.next({ type: "stopped", reason });
        subscriber.complete();
      };

      // Add hover highlighting functionality
      let lastTarget: Element | null = null;
      const mouseMoveHandler = (e: MouseEvent) => {
        const target = e.target as Element;
        if (lastTarget === target) return;
        lastTarget = target;

        if (!target || target.nodeType !== Node.ELEMENT_NODE || this.isExtensionEvent(e)) {
          this.overlay.style.display = "none";
          return;
        }

        this.applyOverlayStyles(target.getBoundingClientRect(), {
          ...HIGHLIGHT_STYLES.hover,
        });
      };

      const clickHandler = (e: MouseEvent) => {
        // Clicks on the extension's own UI (e.g. the cancel button) must keep working
        if (this.isExtensionEvent(e)) return;
        e.preventDefault();
        e.stopPropagation();
        const element = e.target as Element;
        finish("completed", { xpath: this.generateXPath(element), element });
      };

      // The press that picks an element must not reach the page: no focus change, no menu opening on mousedown
      const pressHandler = (e: Event) => {
        if (this.isExtensionEvent(e)) return;
        e.preventDefault();
        e.stopPropagation();
      };

      const escHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish("escape");
        }
      };

      const teardown = () => {
        document.removeEventListener("mousemove", mouseMoveHandler, true);
        document.removeEventListener("click", clickHandler, true);
        document.removeEventListener("keydown", escHandler, true);
        PRESS_EVENTS.forEach((type) => window.removeEventListener(type, pressHandler, true));
        // Only reset the shared state if it still belongs to this stream
        if (this.clickHandler === clickHandler) {
          this.clickHandler = this.escHandler = this.mouseMoveHandler = undefined;
          this.stopActiveSelection = undefined;
          this.overlay.style.display = "none";
        }
      };

      this.mouseMoveHandler = mouseMoveHandler;
      this.clickHandler = clickHandler;
      this.escHandler = escHandler;
      this.stopActiveSelection = (reason) => finish(reason);

      document.addEventListener("mousemove", mouseMoveHandler, true);
      document.addEventListener("click", clickHandler, true);
      document.addEventListener("keydown", escHandler, true);
      PRESS_EVENTS.forEach((type) => window.addEventListener(type, pressHandler, { capture: true, passive: false }));

      subscriber.next({ type: "started" });

      // Unsubscribing (without a click/Esc) just removes the listeners
      return () => {
        finished = true;
        teardown();
      };
    }).pipe(share());
  }

  /** True when the event originated inside the extension's own UI (incl. its shadow DOM). */
  private isExtensionEvent(e: Event): boolean {
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    if (path.length) {
      // The path already contains every ancestor (across shadow roots), so check nodes individually
      return path.some(
        (node) =>
          node instanceof Element &&
          (node.tagName.toLowerCase() === "hover-inspector" ||
            node.classList.contains("hover-inspector") ||
            node.hasAttribute("data-hover-inspector")),
      );
    }
    return e.target instanceof Element && this.isExtensionElement(e.target);
  }

  private isExtensionElement(el: Element): boolean {
    let current: Element | null = el;
    while (current) {
      if (
        current.classList?.contains("hover-inspector") ||
        current.tagName?.toLowerCase() === "hover-inspector" ||
        current.hasAttribute("data-hover-inspector")
      )
        return true;
      current = current.parentElement;
    }
    return false;
  }

  public destroy() {
    this.stopHighlight();
    this.clearHandlers();
    this.overlay.remove();
    document.getElementById("highlight-overlay-blink-styles")?.remove();
    HighlightOverlayManager.instance = undefined as any;
  }
}

export default HighlightOverlayManager;
