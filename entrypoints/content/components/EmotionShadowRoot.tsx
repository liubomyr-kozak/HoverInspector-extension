import React, { useEffect, useRef } from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

interface EmotionShadowRootProps {
  shadowRoot: ShadowRoot;
  children: React.ReactNode;
}

/**
 * A component that provides an emotion cache that injects styles into a Shadow DOM
 * This is necessary because emotion by default injects styles into the document head
 */
export const EmotionShadowRoot: React.FC<EmotionShadowRootProps> = ({ shadowRoot, children }) => {
  // Реф для кешу
  const cacheRef = useRef<ReturnType<typeof createCache> | null>(null);

  if (!cacheRef.current) {
    // Створюємо тег <style> у shadow root
    const styleElement = document.createElement("style");
    shadowRoot.appendChild(styleElement);

    // Створюємо cache, вказуючи container як цей style тег
    cacheRef.current = createCache({
      key: "emotion-shadow-root",
      container: styleElement,
    });
  }

  return <CacheProvider value={cacheRef.current!}>{children}</CacheProvider>;
};
