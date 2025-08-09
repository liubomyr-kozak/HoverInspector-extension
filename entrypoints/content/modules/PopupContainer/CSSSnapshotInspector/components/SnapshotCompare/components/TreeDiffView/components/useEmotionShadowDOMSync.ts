import { useEffect } from "react";

/**
 * Hook to copy emotion styles from document head to shadow DOM
 */
export function useEmotionShadowDOMSync() {
  useEffect(() => {
    const shadowRoot = document.querySelector("hover-inspector")?.shadowRoot as ShadowRoot;
    if (!shadowRoot) return;

    const headElement = shadowRoot.querySelector("html > head") as HTMLElement;
    if (!headElement) return;

    // Function to copy styles from document head to shadow DOM
    const syncStyles = () => {
      // Find all emotion-generated style tags in document head
      const emotionStyles = document.querySelectorAll<HTMLStyleElement>('style[data-emotion]');
      
      emotionStyles.forEach((style) => {
        const emotionKey = style.getAttribute('data-emotion');
        const existingStyle = headElement.querySelector(`style[data-emotion="${emotionKey}"]`);
        
        // If style doesn't exist in shadow DOM, clone and add it
        if (!existingStyle && emotionKey?.includes('react-diff')) {
          const clone = style.cloneNode(true) as HTMLStyleElement;
          headElement.appendChild(clone);
        }
        // If style exists but content is different, update it
        else if (existingStyle && existingStyle.textContent !== style.textContent && emotionKey?.includes('react-diff')) {
          existingStyle.textContent = style.textContent;
        }
      });
    };

    // Initial sync
    syncStyles();

    // Set up observer to watch for new styles being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'STYLE' && element.getAttribute('data-emotion')?.includes('react-diff')) {
              syncStyles();
            }
          }
        });
      });
    });

    // Observe document head for style changes
    observer.observe(document.head, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);
}
