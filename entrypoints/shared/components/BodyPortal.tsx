import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const BodyPortal: React.FC<{
  children?: React.ReactNode;
  containerId?: string;
}> = ({ children, containerId = "hover-inspector-body-popup-container" }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById(containerId);

    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      document.body.appendChild(el);
    }

    setContainer(el);

    return () => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, [containerId]);

  if (!container) return null;

  return createPortal(children, container);
};
