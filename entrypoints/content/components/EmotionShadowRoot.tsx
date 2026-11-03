import React, { useRef } from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

interface EmotionShadowRootProps {
  shadowRoot: ShadowRoot;
  children: React.ReactNode;
}

/**
 * Emotion provider that injects styles into the Shadow DOM
 */
export const EmotionShadowRoot: React.FC<EmotionShadowRootProps> = ({ shadowRoot, children }) => {
  const cacheRef = useRef<ReturnType<typeof createCache> | null>(null);

  if (!cacheRef.current) {
    // Style container inside the Shadow DOM
    const styleContainer = document.createElement("div");
    styleContainer.setAttribute("data-emotion-container", "");
    shadowRoot.appendChild(styleContainer);

    cacheRef.current = createCache({
      key: "emotion-shadow-root",
      container: styleContainer,
      prepend: true, // so the styles go at the start of the container
    });
  }

  return <CacheProvider value={cacheRef.current}>{children}</CacheProvider>;
};
