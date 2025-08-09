import createCache from "@emotion/cache";

/**
 * Creates and returns an emotion cache for the shadow DOM
 */
export function getEmotionCache(): ReturnType<typeof createCache> {
  const shadowRoot = document.querySelector("hover-inspector")?.shadowRoot as ShadowRoot;
  
  if (!shadowRoot) {
    throw new Error("Shadow root not found for hover-inspector");
  }

  const headElement = shadowRoot.querySelector("html > head") as HTMLElement;
  
  if (!headElement) {
    throw new Error("Head element not found in shadow root");
  }

  return createCache({
    key: "shadow-diff",
    container: headElement,
  });
}
