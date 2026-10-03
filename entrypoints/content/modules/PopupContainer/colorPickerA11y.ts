import { useEffect, type RefObject } from "react";
import { tokens } from "@entrypoints/shared/styles/tokens";

/**
 * react-best-gradient-color-picker renders its tabs, tool buttons, presets and inputs as unnamed,
 * mouse-only <div>s and plain <input>s. We can't change its markup, so after every render we give
 * those elements a role, a tab stop and an accessible name, and route Enter/Space to their click.
 */

/** Library styles for the parts we restyle; passed through its own `style` prop */
export const colorPickerStyles = {
  // The default selected tab colour (#568cf5) is 3.25:1 on white
  rbgcpControlBtnSelected: {
    background: tokens.color.surface,
    color: tokens.color.primary,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
  },
  rbgcpControlBtn: {
    color: tokens.color.textSecondary,
  },
  rbgcpInputLabel: {
    color: tokens.color.textSecondary,
  },
  rbgcpControlBtnWrapper: {
    background: "#eef0f4",
  },
  rbgcpColorModelDropdown: {
    background: "#eef0f4",
  },
};

const INPUT_NAMES: Record<string, string> = {
  hex: "HEX colour",
  R: "Red",
  G: "Green",
  B: "Blue",
  A: "Opacity (%)",
  H: "Hue",
  S: "Saturation",
  L: "Lightness",
  V: "Brightness",
  C: "Cyan",
  M: "Magenta",
  Y: "Yellow",
  K: "Black",
};

/** Mouse-only elements we turn into keyboard buttons, with their accessible names */
const BUTTONS: Array<[selector: string, name: (el: HTMLElement) => string | null]> = [
  ['[id^="rbgcp-solid-btn"]', () => null],
  ['[id^="rbgcp-gradient-btn"]', () => null],
  ['[id^="rbgcp-eyedropper-btn"]', () => "Pick a colour from the screen"],
  ['[id^="rbgcp-advanced-btn"]', () => "Saturation, lightness and brightness sliders"],
  ['[id^="rbgcp-comparibles-btn"]', () => "Colour guide"],
  ['[id^="rbgcp-color-model-btn"]', () => "Input colour model"],
  ['[id^="rbgcp-color-model-"][id$="-btn"]:not([id^="rbgcp-color-model-btn"])', () => null],
  ['[id^="rbgcp-linear-btn"]', () => "Linear gradient"],
  ['[id^="rbgcp-radial-btn"]', () => "Radial gradient"],
  ['[id^="rbgcp-point-delete-btn"]', () => "Delete the selected gradient stop"],
  ['[id^="rbgcp-preset-"]:not([id$="-wrapper"])', (el) => `Use preset ${el.style.background || "colour"}`],
  ['[id^="rbgcp-comparible-"][id*="-color-"]', (el) => `Use ${el.style.background || "colour"}`],
];

function setAttr(el: Element, name: string, value: string) {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

function decorate(root: HTMLElement, isGradient: boolean) {
  for (const [selector, name] of BUTTONS) {
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      setAttr(el, "role", "button");
      setAttr(el, "tabindex", "0");
      el.dataset.hiKeyClick = "";
      const label = name(el);
      if (label) setAttr(el, "aria-label", label);
    });
  }

  const solid = root.querySelector('[id^="rbgcp-solid-btn"]');
  const gradient = root.querySelector('[id^="rbgcp-gradient-btn"]');
  if (solid) setAttr(solid, "aria-pressed", String(!isGradient));
  if (gradient) setAttr(gradient, "aria-pressed", String(isGradient));

  root.querySelectorAll<HTMLElement>('[id^="rbgcp-color-model-btn"]').forEach((el) => {
    const dropdown = el.querySelector<HTMLElement>('[id^="rbgcp-color-model-dropdown"]');
    setAttr(el, "aria-expanded", String(dropdown?.style.visibility === "visible"));
  });

  // The handle you drag along the hue bar; the library gives it role=button but no name
  root.querySelectorAll('[id^="rbgcp-hue-handle"]').forEach((el) => setAttr(el, "aria-label", "Hue"));
  root.querySelectorAll<HTMLElement>('[id^="rbgcp-advanced-bar-"][id$="-handle"]').forEach((el) => {
    const bar = el.id.replace(/^rbgcp-advanced-bar-/, "").replace(/-handle.*$/, "");
    setAttr(el, "aria-label", bar);
  });

  root.querySelectorAll<HTMLInputElement>('input[id^="rbgcp-"][id$="-input"]').forEach((input) => {
    const key = input.id.replace(/^rbgcp-/, "").replace(/-input.*$/, "");
    setAttr(input, "aria-label", INPUT_NAMES[key] ?? key);
  });
}

export function useColorPickerA11y(ref: RefObject<HTMLElement | null>, isGradient: boolean) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    decorate(root, isGradient);
    const observer = new MutationObserver(() => decorate(root, isGradient));
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !("hiKeyClick" in target.dataset)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      target.click();
    };
    root.addEventListener("keydown", onKeyDown);

    return () => {
      observer.disconnect();
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, isGradient]);
}
