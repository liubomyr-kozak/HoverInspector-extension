// HighlightOverlay.tsx
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";
import { clearHighlight, setAutoHideTimer } from "@entrypoints/content/store/highlight/highlightSlice";

export default function HighlightOverlay() {
  const { 
    hoverMode, 
    xpath, 
    autoHideEnabled, 
    autoHideDelay, 
    displayStyle, 
    customStyles 
  } = useSelector((state: RootState) => state.highlight);
  const dispatch = useDispatch();
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Створюємо overlay з CSS анімаціями
  useEffect(() => {
    // Add CSS animations to document head if not already present
    const styleId = "hover-inspector-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes highlight-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        @keyframes highlight-pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    const overlay = document.createElement("div");
    overlay.id = "hover-inspector-highlight-node"; // Assign a stable id to the overlay
    overlayRef.current = overlay;
    Object.assign(overlay.style, {
      position: "absolute",
      zIndex: 2147483647,
      pointerEvents: "none",
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

  // Підсвітка елемента з динамічним стилем
  const highlightElement = (el: Element | EventTarget | null) => {
    if (!el || !overlayRef.current) return;
    const element = el as Element;
    const rect = element.getBoundingClientRect();
    const overlay = overlayRef.current;
    
    // Apply position
    overlay.style.top = rect.top + window.scrollY + "px";
    overlay.style.left = rect.left + window.scrollX + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.style.display = "block";
    
    // Apply dynamic styling based on displayStyle
    const currentStyle = customStyles[displayStyle];
    if (currentStyle) {
      overlay.style.border = currentStyle.border;
      overlay.style.backgroundColor = currentStyle.backgroundColor;
      overlay.style.animation = currentStyle.animation || 'none';
    }
    
    // Start auto-hide timer if enabled and not in hover mode
    if (autoHideEnabled && !hoverMode) {
      const timer = setTimeout(() => {
        dispatch(clearHighlight());
      }, autoHideDelay);
      dispatch(setAutoHideTimer(timer));
    }
  };

  const removeHighlight = () => {
    if (overlayRef.current) {
      overlayRef.current.style.display = "none";
      // Clear any active auto-hide timer when manually removing highlight
      dispatch(setAutoHideTimer(null));
    }
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
