import { Observable } from "rxjs";
import { finalize, share } from "rxjs/operators";

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

  private clickHandler?: (e: MouseEvent) => void;
  private escHandler?: (e: KeyboardEvent) => void;
  private mouseMoveHandler?: (e: MouseEvent) => void;

  private constructor() {
    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, {
      position: "absolute",
      zIndex: "2147483647",
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

  private generateXPath(el: Element): string {
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

  private clearHandlers() {
    if (this.clickHandler) document.removeEventListener("click", this.clickHandler, true);
    if (this.escHandler) document.removeEventListener("keydown", this.escHandler, true);
    if (this.mouseMoveHandler) document.removeEventListener("mousemove", this.mouseMoveHandler, true);

    this.clickHandler = this.escHandler = this.mouseMoveHandler = undefined;
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

  public startHighlight(xpath: string, variant: HighlightStyleVariant = 'selection', customStyles?: Partial<CSSStyleDeclaration>) {
    const el = this.getElementByXPath(xpath);

    if (!el) return this.stopHighlight();

    // Clear existing timer
    this.clearHighlightTimer();

    // Scroll element into view (centered)
    try {
      el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
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

  private _preHighlightedElement: Element | null = null;

  public startMouseMoveHighlight(variant: HighlightStyleVariant = 'hover', customStyles?: Partial<CSSStyleDeclaration>) {
    this.mouseMoveHandler = (e: MouseEvent) => {
      const target = e.target as Element;

      if (this._preHighlightedElement !== target) {
        this._preHighlightedElement = target;
      } else {
        return;
      }

      if (!target || target.nodeType !== Node.ELEMENT_NODE || this.isExtensionElement(target)) return;

      this.applyOverlayStyles(target.getBoundingClientRect(), {
        ...HIGHLIGHT_STYLES[variant],
        ...customStyles,
      });
    };

    document.addEventListener("mousemove", this.mouseMoveHandler, true);
  }

  public stopMouseMoveHighlight() {
    this.clearHandlers();
    this.stopHighlight();
  }

  public stopSelectionMode() {
    this.clearHandlers();
  }

  public isSelectionActive(): boolean {
    return !!(this.clickHandler && this.escHandler);
  }

  public streamSelectionMode(): Observable<SelectionEvent> {
    return new Observable<SelectionEvent>((subscriber) => {
      subscriber.next({ type: "started" });

      // Add hover highlighting functionality
      this.mouseMoveHandler = (e: MouseEvent) => {
        const target = e.target as Element;

        if (this._preHighlightedElement !== target) {
          this._preHighlightedElement = target;
        } else {
          return;
        }

        if (!target || target.nodeType !== Node.ELEMENT_NODE || this.isExtensionElement(target)) {
          this.overlay.style.display = "none";
          return;
        }

        this.applyOverlayStyles(target.getBoundingClientRect(), {
          ...HIGHLIGHT_STYLES.hover,
        });
      };

      this.clickHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const element = e.target as Element;
        const xpath = this.generateXPath(element);
        subscriber.next({ type: "selected", xpath, element });
        subscriber.next({ type: "stopped", reason: "completed" });
        subscriber.complete();
      };

      this.escHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          subscriber.next({ type: "stopped", reason: "escape" });
          subscriber.complete();
        }
      };

      document.addEventListener("mousemove", this.mouseMoveHandler, true);
      document.addEventListener("click", this.clickHandler, true);
      document.addEventListener("keydown", this.escHandler, true);

      return () => this.clearHandlers();
    }).pipe(
      share(),
      finalize(() => this.clearHandlers()),
    );
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
    HighlightOverlayManager.instance = undefined as any;
  }
}

export default HighlightOverlayManager;
