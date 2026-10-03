import type React from "react";

/**
 * Props that make a non-button element (a row, a chip, a code line) behave like a button for keyboard
 * users: focusable, announced as a button, and activated with Enter or Space. Prefer a real <button>;
 * use this where the element's layout or semantics make a button awkward.
 */
export function clickableProps<E extends HTMLElement = HTMLElement>(
  onActivate: (event: React.MouseEvent<E> | React.KeyboardEvent<E>) => void,
  label?: string,
) {
  return {
    role: "button" as const,
    tabIndex: 0,
    ...(label ? { "aria-label": label } : {}),
    onClick: (event: React.MouseEvent<E>) => onActivate(event),
    onKeyDown: (event: React.KeyboardEvent<E>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate(event);
      }
    },
  };
}
