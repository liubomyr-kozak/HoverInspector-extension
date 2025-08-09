import React, { useRef } from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

interface EmotionShadowRootProps {
  shadowRoot: ShadowRoot;
  children: React.ReactNode;
}

/**
 * Провайдер для Emotion, який інжектить стилі у Shadow DOM
 */
export const EmotionShadowRoot: React.FC<EmotionShadowRootProps> = ({ shadowRoot, children }) => {
  const cacheRef = useRef<ReturnType<typeof createCache> | null>(null);

  if (!cacheRef.current) {
    // Контейнер для стилів усередині Shadow DOM
    const styleContainer = document.createElement("div");
    styleContainer.setAttribute("data-emotion-container", "");
    shadowRoot.appendChild(styleContainer);

    cacheRef.current = createCache({
      key: "emotion-shadow-root",
      container: styleContainer,
      prepend: true, // щоб стилі були на початку контейнера
    });
  }

  return <CacheProvider value={cacheRef.current}>{children}</CacheProvider>;
};
