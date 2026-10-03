/**
 * Same-origin iframe support for the inspector: the UI lives once, in the top document, and listens to
 * the documents of the same-origin iframes on the page directly. Cross-origin frames can't be reached
 * from here (contentDocument is null) and are left alone.
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

/**
 * getBoundingClientRect() mapped into the top window's viewport. For elements inside (nested)
 * same-origin iframes, adds each iframe's content-box offset and scale, so overlays drawn by the
 * top-level UI land on the element.
 */
export function getRectInTopViewport(element: Element): DOMRect {
  const rect = element.getBoundingClientRect();
  let { left, top, width, height } = rect;

  let win: Window | null = element.ownerDocument?.defaultView ?? null;
  while (win && win !== window.top && win !== window) {
    let frame: Element | null = null;
    try {
      frame = win.frameElement;
    } catch {
      frame = null;
    }
    if (!frame) break;

    const frameRect = frame.getBoundingClientRect();
    const style = frame.ownerDocument.defaultView!.getComputedStyle(frame);
    const offsetWidth = (frame as HTMLElement).offsetWidth;
    const offsetHeight = (frame as HTMLElement).offsetHeight;
    // A transform on the iframe (scale) shows up as a bounding box larger/smaller than its layout box
    const scaleX = offsetWidth ? frameRect.width / offsetWidth : 1;
    const scaleY = offsetHeight ? frameRect.height / offsetHeight : 1;
    const insetLeft = (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.paddingLeft) || 0);
    const insetTop = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.paddingTop) || 0);

    left = frameRect.left + (insetLeft + left) * scaleX;
    top = frameRect.top + (insetTop + top) * scaleY;
    width *= scaleX;
    height *= scaleY;

    win = frame.ownerDocument.defaultView;
  }

  if (left === rect.left && top === rect.top && width === rect.width && height === rect.height) return rect;
  return new DOMRect(left, top, width, height);
}

/** True when the node belongs to the document of a (same-origin) iframe rather than the top document. */
export function isInFrame(node: Node | null | undefined): boolean {
  return !!node && !!node.ownerDocument && node.ownerDocument !== document;
}

/**
 * Calls `attach(frameWindow)` for every accessible same-origin iframe on the page, including nested
 * ones, iframes added later and iframes that navigate (each new document is attached again). The
 * function `attach` returns is called when that document goes away or when the watcher is stopped.
 */
export function watchSameOriginFrames(attach: (frameWindow: Window) => () => void): () => void {
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
    if (!win || attached.has(win.document)) return;

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
