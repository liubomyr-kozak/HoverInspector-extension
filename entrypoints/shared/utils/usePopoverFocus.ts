import React, { useEffect, useRef } from "react";

const FOCUSABLE = "button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])";

/**
 * Keyboard support for an antd Popover whose content renders at the end of the shadow root, far from
 * its trigger in tab order:
 * - opened while its trigger has focus (Enter, Space or a click), focus moves to the first control inside;
 * - Esc closes it and returns focus to the trigger;
 * - tabbing from inside it to another control closes it.
 * Opening on hover leaves focus where it is.
 */
export function usePopoverFocus(open: boolean, setOpen: (open: boolean) => void) {
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = triggerRef.current?.getRootNode() as Document | ShadowRoot | undefined;
    const openedFromTrigger = !!root && root.activeElement === triggerRef.current;
    const frame = openedFromTrigger
      ? requestAnimationFrame(() => contentRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus())
      : 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Handled here, so the global Esc shortcut doesn't also switch the extension off
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, setOpen]);

  const onContentBlur = (event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || contentRef.current?.contains(next) || triggerRef.current?.contains(next)) return;
    setOpen(false);
  };

  return { triggerRef, contentRef, onContentBlur };
}
