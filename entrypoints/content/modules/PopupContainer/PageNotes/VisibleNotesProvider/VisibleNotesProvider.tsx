import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Note as NoteType, ColorPalette } from "@entrypoints/shared/types/notes.ts";
import { getAllNotes } from "@entrypoints/background/store/notesActionsSlice.ts";
import { getVisibleNotesForPage } from "@entrypoints/background/services/notes.ts";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext.tsx";
import { VisibleNoteContainer } from "./VisibleNote";
import { useCurrentUrl } from "./useCurrentUrl";
import { ZINDEX_POPUP_WRAPPER } from "@entrypoints/shared/constant/zIndex.ts";

// Nearest positioned ancestor of an element, crossing the shadow root boundary
const getContainingBlock = (element: HTMLElement): Element | null => {
  let current: Element | null = element.parentElement || ((element.getRootNode() as ShadowRoot).host ?? null);
  while (current) {
    if (getComputedStyle(current).position !== "static") return current;
    current = current.parentElement || ((current.getRootNode() as ShadowRoot).host ?? null);
  }
  return null;
};

// Whether the element or one of its positioned ancestors is position: fixed (laid out against the viewport)
const isInsideFixedBox = (element: Element | null): boolean => {
  for (let current = element; current; current = getContainingBlock(current as HTMLElement)) {
    if (getComputedStyle(current).position === "fixed") return true;
  }
  return false;
};

/**
 * Notes store page coordinates, but the extension's host element is positioned after the page
 * content. Returns the offset that moves the notes layer back to the document origin.
 */
const useDocumentOrigin = (layerRef: React.RefObject<HTMLDivElement | null>, currentUrl: string) => {
  const [origin, setOrigin] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    // On pages where the UI is shown in the top layer (see keepUiOutOfContainingBlocks), the layer is
    // inside a position: fixed host and doesn't scroll with the page by itself: follow the scroll then.
    let followScroll = false;

    const update = () => {
      const layer = layerRef.current;
      if (!layer) return;
      const containingBlock = getContainingBlock(layer);
      const rect = containingBlock?.getBoundingClientRect();
      const top = rect ? -(rect.top + window.scrollY) : 0;
      const left = rect ? -(rect.left + window.scrollX) : 0;
      followScroll = isInsideFixedBox(containingBlock);
      setOrigin((prev) => (prev.top === top && prev.left === left ? prev : { top, left }));
    };
    const onScroll = () => {
      if (followScroll) update();
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, { passive: true });
    // The host switching in or out of the top layer
    const host = layerRef.current?.getRootNode() instanceof ShadowRoot ? (layerRef.current.getRootNode() as ShadowRoot).host : null;
    host?.addEventListener("toggle", update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll);
      host?.removeEventListener("toggle", update);
    };
  }, [layerRef, currentUrl]);

  return origin;
};

export const VisibleNotesProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [visibleNotes, setVisibleNotes] = useState<NoteType[]>([]);
  const { refreshTrigger } = useSelector((state: any) => state?.notes || { refreshTrigger: 0 });
  const highlightOverlay = useHighlightOverlay();
  const [noteColorPalettes, setNoteColorPalettes] = useState<ColorPalette[]>([]);
  const currentUrl = useCurrentUrl();
  const layerRef = useRef<HTMLDivElement>(null);
  const origin = useDocumentOrigin(layerRef, currentUrl);

  const loadVisibleNotes = useCallback(async () => {
    try {
      const notesData = await getAllNotes();
      const currentDomain = window.location.hostname;

      setNoteColorPalettes(notesData?.colorPalettes || []);

      // Use centralized function to filter visible notes for current page
      setVisibleNotes(getVisibleNotesForPage(notesData?.notes || [], currentDomain, window.location.href));
    } catch (error) {
      console.error("Failed to load visible notes:", error);
    }
  }, []);

  // Reload on mount, after any notes change (refreshTrigger) and when the page URL changes (SPA navigation)
  useEffect(() => {
    loadVisibleNotes();
  }, [loadVisibleNotes, refreshTrigger, currentUrl]);

  return (
    <>
      {children}
      {/* Anchored at the document origin so the notes' absolute (page) coordinates line up with the page */}
      <div
        ref={layerRef}
        className="hover-inspector-visible-note"
        // Below the extension panels, above the page
        style={{ position: "absolute", top: origin.top, left: origin.left, width: 0, height: 0, zIndex: ZINDEX_POPUP_WRAPPER }}
      >
        {visibleNotes.map((note) => (
          <VisibleNoteContainer
            key={note.id}
            note={note}
            highlightOverlay={highlightOverlay}
            noteColorPalettes={noteColorPalettes}
            currentUrl={currentUrl}
          />
        ))}
      </div>
    </>
  );
};
