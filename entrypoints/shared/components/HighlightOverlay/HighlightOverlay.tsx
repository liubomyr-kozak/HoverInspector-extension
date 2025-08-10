// HighlightOverlay.tsx
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";

export default function HighlightOverlay() {
  const { hoverMode, xpath } = useSelector((state: RootState) => state.highlight);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Створюємо overlay
  useEffect(() => {
    const overlay = document.createElement("div");
    overlay.id = "hover-inspector-highlight-node"; // Assign a stable id to the overlay
    overlayRef.current = overlay;
    Object.assign(overlay.style, {
      position: "absolute",
      zIndex: 2147483647,
      pointerEvents: "none",
      border: "2px solid red",
      backgroundColor: "rgba(255, 0, 0, 0.1)",
      boxSizing: "border-box",
      display: "none",
    });
    document.body.appendChild(overlay);
    return () => overlay.remove();
  }, []);

  // Пошук елемента за XPath
  const getElementByXPath = (xp: string): Element | null => {
    if (!xp) return null;

    // Normalize common malformed patterns like leading triple slashes
    const normalizeXPath = (raw: string): string => {
      let s = raw.trim();
      // If starts with 3+ slashes followed by 'html', treat as absolute path
      s = s.replace(/^\/{3,}(?=html\b)/, "/");
      // Otherwise collapse 3+ leading slashes to '//'
      s = s.replace(/^\/{3,}/, "//");
      // Collapse any accidental 4+ slashes at start to '//'
      s = s.replace(/^\/\/{2,}/, "//");
      return s;
    };

    const safeXp = normalizeXPath(xp);

    try {
      return document.evaluate(safeXp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue as Element | null;
    } catch (error) {
      console.error("Invalid XPath expression:", safeXp, error);
      return null;
    }
  };

  // Підсвітка елемента
  const highlightElement = (el: Element | EventTarget | null) => {
    if (!el || !overlayRef.current) return;
    const element = el as Element;
    const rect = element.getBoundingClientRect();
    const overlay = overlayRef.current;
    overlay.style.top = rect.top + window.scrollY + "px";
    overlay.style.left = rect.left + window.scrollX + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.style.display = "block";
  };

  const removeHighlight = () => {
    if (overlayRef.current) overlayRef.current.style.display = "none";
  };

  // Перевіряє, чи елемент видимий у viewport
  const isElementInViewport = (el: Element) => {
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= vh && rect.right <= vw;
  };

  // Hover-режим
  useEffect(() => {
    const onMouseOver = (e: MouseEvent) => highlightElement(e.target);
    const onMouseOut = () => removeHighlight();

    if (!hoverMode) {
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      removeHighlight();
      return;
    }

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);

    return () => {
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [hoverMode]);

  // Підсвітка за XPath
  useEffect(() => {
    if (!xpath) return;

    const el = getElementByXPath(xpath);
    if (!el) {
      removeHighlight();
      return;
    }

    // Якщо елемент поза видимою зоною — прокручуємо до нього і підлаштовуємо overlay під час анімації
    if (!isElementInViewport(el)) {
      // Пробуємо прокрутити до центру екрана
      try {
        (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } catch {
        // Fallback, якщо smooth не підтримується
        (el as HTMLElement).scrollIntoView(true);
      }

      let rafId = 0;
      const start = performance.now();
      const followScroll = () => {
        highlightElement(el);
        // Оновлюємо позицію overlay протягом короткого часу, поки триває анімація прокрутки
        if (performance.now() - start < 700) {
          rafId = requestAnimationFrame(followScroll);
        }
      };
      rafId = requestAnimationFrame(followScroll);
      return () => cancelAnimationFrame(rafId);
    }

    // Якщо елемент вже у viewport — просто підсвічуємо
    highlightElement(el);
  }, [xpath]);

  return null; // Це utility-компонент, він нічого не рендерить
}
