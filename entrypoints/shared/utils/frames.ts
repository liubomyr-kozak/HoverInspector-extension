/**
 * Iframe support for the inspector: the UI lives once, in the top document, and listens to the
 * documents of the same-origin iframes on the page directly. Cross-origin frames can't be reached from
 * here (contentDocument is null); a small frame agent runs inside them instead (see shared/frameAgent).
 */

/** The frame's document if the content script may touch it (same origin and loaded), else null. */
export function getAccessibleFrameWindow(frame: HTMLIFrameElement | HTMLFrameElement): Window | null {
  try {
    const win = frame.contentWindow;
    // Throws (or returns null) for cross-origin frames
    return win && win.document ? win : null;
  } catch {
    return null;
  }
}

export interface PlainRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The frame element's window, or null when it isn't one we can reach (a cross-origin parent). */
function getFrameElementOf(win: Window): Element | null {
  try {
    return win.frameElement;
  } catch {
    return null;
  }
}

/**
 * Where a frame's content viewport sits in its owner window's viewport: the content-box origin and the
 * scale a transform on the iframe applies (bounding box vs layout box).
 */
export function getFrameContentBox(frame: Element): PlainRect & { scaleX: number; scaleY: number } {
  const frameRect = frame.getBoundingClientRect();
  const style = frame.ownerDocument.defaultView!.getComputedStyle(frame);
  const el = frame as HTMLElement;
  const offsetWidth = el.offsetWidth;
  const offsetHeight = el.offsetHeight;
  // A transform on the iframe (scale) shows up as a bounding box larger/smaller than its layout box
  const scaleX = offsetWidth ? frameRect.width / offsetWidth : 1;
  const scaleY = offsetHeight ? frameRect.height / offsetHeight : 1;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const insetLeft = (parseFloat(style.borderLeftWidth) || 0) + paddingLeft;
  const insetTop = (parseFloat(style.borderTopWidth) || 0) + paddingTop;
  // clientWidth/Height: the padding box without scrollbars; the frame's viewport is its content box
  const contentWidth = Math.max(0, (el.clientWidth || 0) - paddingLeft - (parseFloat(style.paddingRight) || 0));
  const contentHeight = Math.max(0, (el.clientHeight || 0) - paddingTop - (parseFloat(style.paddingBottom) || 0));

  return {
    left: frameRect.left + insetLeft * scaleX,
    top: frameRect.top + insetTop * scaleY,
    width: contentWidth * scaleX,
    height: contentHeight * scaleY,
    scaleX,
    scaleY,
  };
}

/** A rect in the frame's own viewport, mapped into the viewport of the document holding the frame. */
export function mapRectThroughFrame(frame: Element, rect: PlainRect): PlainRect {
  const box = getFrameContentBox(frame);
  return {
    left: box.left + rect.left * box.scaleX,
    top: box.top + rect.top * box.scaleY,
    width: rect.width * box.scaleX,
    height: rect.height * box.scaleY,
  };
}

/**
 * A rect in `win`'s viewport mapped into this window's viewport, through every (same-origin) frame
 * between them. This window is the top one for the inspector UI, or the frame a frame agent runs in.
 */
export function mapRectFromWindow(win: Window | null, rect: PlainRect): PlainRect {
  let mapped = rect;
  while (win && win !== window.top && win !== window) {
    const frame = getFrameElementOf(win);
    if (!frame) break;
    mapped = mapRectThroughFrame(frame, mapped);
    win = frame.ownerDocument.defaultView;
  }
  return mapped;
}

/**
 * getBoundingClientRect() mapped into the top window's viewport. For elements inside (nested)
 * same-origin iframes, adds each iframe's content-box offset and scale, so overlays drawn by the
 * top-level UI land on the element.
 */
export function getRectInTopViewport(element: Element): DOMRect {
  const rect = element.getBoundingClientRect();
  const win = element.ownerDocument?.defaultView ?? null;
  if (!win || win === window || win === window.top) return rect;

  const { left, top, width, height } = mapRectFromWindow(win, rect);
  if (left === rect.left && top === rect.top && width === rect.width && height === rect.height) return rect;
  return new DOMRect(left, top, width, height);
}

/** How much the frames between the element and this window scale it (1 outside frames). */
export function getFrameScale(element: Element): number {
  let scale = 1;
  let win: Window | null = element.ownerDocument?.defaultView ?? null;
  while (win && win !== window.top && win !== window) {
    const frame = getFrameElementOf(win);
    if (!frame) break;
    scale *= getFrameContentBox(frame).scaleX;
    win = frame.ownerDocument.defaultView;
  }
  return scale;
}

export function intersectRects(a: PlainRect, b: PlainRect): PlainRect {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/**
 * The part of this window's viewport where the content of `frame` can show: its content box,
 * cut down by the frames around it.
 */
export function getFrameContentClip(frame: Element): PlainRect {
  const ownerWin = frame.ownerDocument.defaultView;
  const { left, top, width, height } = getFrameContentBox(frame);
  let clip = mapRectFromWindow(ownerWin, { left, top, width, height });
  const outer = ownerWin ? getFrameElementOf(ownerWin) : null;
  if (outer && ownerWin !== window && ownerWin !== window.top) clip = intersectRects(clip, getFrameContentClip(outer));
  return clip;
}

/**
 * Where overlays for an element inside a (same-origin) frame must be clipped, in this window's
 * viewport: the visible part of the frames it is in. Null for elements of this document.
 */
export function getFrameClipRect(element: Element): PlainRect | null {
  const win = element.ownerDocument?.defaultView ?? null;
  if (!win || win === window || win === window.top) return null;
  const frame = getFrameElementOf(win);
  return frame ? getFrameContentClip(frame) : null;
}

/** True when the node belongs to the document of a (same-origin) iframe rather than the top document. */
export function isInFrame(node: Node | null | undefined): boolean {
  return !!node && !!node.ownerDocument && node.ownerDocument !== document;
}

/**
 * The <iframe>/<frame> element, in this document or one of its same-origin frames, whose window is
 * `source`. Null for any other window (this one, a popup, a frame we can't reach).
 */
export function findFrameElementForWindow(source: unknown): HTMLIFrameElement | HTMLFrameElement | null {
  if (!source) return null;
  const visit = (doc: Document, depth: number): HTMLIFrameElement | HTMLFrameElement | null => {
    const frames = doc.querySelectorAll<HTMLIFrameElement | HTMLFrameElement>("iframe, frame");
    for (const frame of frames) {
      if (frame.contentWindow === source) return frame;
    }
    if (depth > 8) return null;
    for (const frame of frames) {
      const win = getAccessibleFrameWindow(frame);
      const found = win && visit(win.document, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return visit(document, 0);
}

/**
 * Calls `attach(frameWindow)` for every accessible same-origin iframe on the page, including nested
 * ones, iframes added later and iframes that navigate (each new document is attached again). The
 * function `attach` returns is called when that document goes away or when the watcher is stopped.
 * `onInaccessibleFrame` is told about frames whose document can't be reached (cross-origin), each
 * time one is found or (re)loads.
 */
export function watchSameOriginFrames(
  attach: (frameWindow: Window) => () => void,
  onInaccessibleFrame?: (frame: HTMLIFrameElement | HTMLFrameElement) => void,
): () => void {
  // Keyed by document: a frame's WindowProxy stays the same across navigations, its document doesn't
  const attached = new Map<Document, () => void>();
  const watchedFrames = new Set<Element>();
  const observers: MutationObserver[] = [];
  const loadListeners: Array<() => void> = [];
  let stopped = false;

  const detachDocument = (doc: Document) => {
    const detach = attached.get(doc);
    if (!detach) return;
    attached.delete(doc);
    try {
      detach();
    } catch {
      // The frame's document may already be gone
    }
  };

  const attachFrame = (frame: HTMLIFrameElement | HTMLFrameElement) => {
    if (stopped) return;

    if (!watchedFrames.has(frame)) {
      watchedFrames.add(frame);
      // A navigation replaces the frame's document (and its window listeners); attach to the new one.
      const onLoad = () => attachFrame(frame);
      frame.addEventListener("load", onLoad);
      loadListeners.push(() => frame.removeEventListener("load", onLoad));
    }

    const win = getAccessibleFrameWindow(frame);
    if (!win) {
      onInaccessibleFrame?.(frame);
      return;
    }
    if (attached.has(win.document)) return;

    // Forget documents that were navigated away from
    for (const doc of [...attached.keys()]) {
      if (!doc.defaultView) detachDocument(doc);
    }

    attached.set(win.document, attach(win));
    scanDocument(win.document);
  };

  const scanDocument = (doc: Document) => {
    doc.querySelectorAll<HTMLIFrameElement | HTMLFrameElement>("iframe, frame").forEach(attachFrame);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as Element;
          if (el.localName === "iframe" || el.localName === "frame") attachFrame(el as HTMLIFrameElement);
          el.querySelectorAll?.<HTMLIFrameElement>("iframe, frame").forEach(attachFrame);
        });
      }
    });
    observer.observe(doc.documentElement || doc, { childList: true, subtree: true });
    observers.push(observer);
  };

  scanDocument(document);

  return () => {
    stopped = true;
    observers.forEach((observer) => observer.disconnect());
    loadListeners.forEach((remove) => remove());
    [...attached.keys()].forEach(detachDocument);
    watchedFrames.clear();
  };
}
