import { buildStyleSummary, StyleSummary } from "@entrypoints/core/services/dom/nodeStyle";
import {
  getFrameContentBox,
  getFrameContentClip,
  getFrameScale,
  intersectRects,
  mapRectFromWindow,
  mapRectThroughFrame,
  PlainRect,
} from "@entrypoints/shared/utils/frames";
import { RemoteNodeSnapshot } from "./protocol";

const SVG_NS = "http://www.w3.org/2000/svg";
const HTML_NS = "http://www.w3.org/1999/xhtml";

/**
 * Stands in for an element inside a cross-origin frame, which the top frame can't touch. It carries
 * what the frame's agent reported and offers the few Element members the inspector UI reads (rect,
 * tag, id, class, text/image hints). Rects are mapped through the <iframe> live, so the overlays
 * follow when the top page scrolls; the agent sends fresh snapshots when the frame itself scrolls.
 */
export class RemoteFrameNode {
  readonly isRemoteFrameNode = true;
  readonly nodeType = 1;
  readonly parentElement = null;
  readonly ownerDocument = null;

  constructor(
    public frame: HTMLIFrameElement | HTMLFrameElement,
    public snapshot: RemoteNodeSnapshot,
  ) {}

  get localName() {
    return this.snapshot.tag;
  }

  get tagName() {
    return this.snapshot.isSvg ? this.snapshot.tag : this.snapshot.tag.toUpperCase();
  }

  get id() {
    return this.snapshot.elId;
  }

  get className() {
    return this.snapshot.className;
  }

  get namespaceURI() {
    return this.snapshot.isSvg ? SVG_NS : HTML_NS;
  }

  get origin() {
    return this.snapshot.origin;
  }

  /** Enough for "has text" checks on childNodes */
  get childNodes() {
    return this.snapshot.hasText ? [{ nodeType: 3 }] : [];
  }

  get naturalWidth() {
    return this.snapshot.naturalWidth;
  }

  get naturalHeight() {
    return this.snapshot.naturalHeight;
  }

  /** Role attribute and accessible name reported by the frame's agent */
  get a11y() {
    return { role: this.snapshot.role ?? null, ariaLabel: this.snapshot.ariaLabel ?? null };
  }

  /** Background behind the element's text, worked out inside the frame */
  get effectiveBackground() {
    return this.snapshot.effectiveBg || "";
  }

  get isConnected() {
    return this.frame.isConnected;
  }

  getAttribute(name: string): string | null {
    if (name === "id") return this.snapshot.elId || null;
    if (name === "class") return this.snapshot.className || null;
    if (name === "alt") return this.snapshot.alt;
    if (name === "role") return this.snapshot.role ?? null;
    if (name === "aria-label") return this.snapshot.ariaLabel ?? null;
    return null;
  }

  contains() {
    return false;
  }

  closest() {
    return null;
  }

  matches() {
    return false;
  }

  private mapFromFrame(rect: PlainRect): PlainRect {
    return mapRectFromWindow(this.frame.ownerDocument.defaultView, mapRectThroughFrame(this.frame, rect));
  }

  /** In the top viewport */
  getBoundingClientRect(): DOMRect {
    const { left, top, width, height } = this.mapFromFrame(this.snapshot.rect);
    return new DOMRect(left, top, width, height);
  }

  /** Where overlays for this element may show, in the top viewport */
  getClipRect(): PlainRect {
    return intersectRects(this.mapFromFrame(this.snapshot.clip), getFrameContentClip(this.frame));
  }

  /** CSS px of the element -> px of the top viewport */
  getScale(): number {
    return this.snapshot.zoom * getFrameContentBox(this.frame).scaleX * getFrameScale(this.frame);
  }

  /** Same shape as DomNodeManager.getStyleByNode() for local elements */
  getStyleSummary(): StyleSummary {
    const { computed, rect, className, elId, tag } = this.snapshot;
    return buildStyleSummary((prop) => computed[prop] ?? "", rect, { className, id: elId, tag });
  }

  /** A read-only stand-in for getComputedStyle() with the properties the agent reported */
  getComputedStyle(): CSSStyleDeclaration {
    const computed = this.snapshot.computed;
    const getPropertyValue = (prop: string) => computed[prop] ?? "";
    return new Proxy({} as CSSStyleDeclaration, {
      get(_target, prop) {
        if (prop === "getPropertyValue") return getPropertyValue;
        if (typeof prop !== "string") return undefined;
        // camelCase -> kebab-case (borderRadius -> border-radius)
        return getPropertyValue(prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
      },
    });
  }
}

export function isRemoteFrameNode(node: unknown): node is RemoteFrameNode {
  return !!node && (node as any).isRemoteFrameNode === true;
}

/** getComputedStyle() that also takes elements of cross-origin frames */
export function getNodeComputedStyle(node: Element | RemoteFrameNode): CSSStyleDeclaration {
  return isRemoteFrameNode(node) ? node.getComputedStyle() : getComputedStyle(node);
}
