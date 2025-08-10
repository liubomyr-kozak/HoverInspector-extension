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
    overlayRef.current = overlay;
    Object.assign(overlay.style, {
      position: "absolute",
      zIndex: 999999,
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
    return document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
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
    if (xpath) {
      const el = getElementByXPath(xpath);
      if (el) highlightElement(el);
    }
  }, [xpath]);

  return null; // Це utility-компонент, він нічого не рендерить
}
