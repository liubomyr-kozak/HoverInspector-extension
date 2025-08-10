/**
 * Utility for handling default tag-specific styles
 */

/**
 * Cache for default styles to avoid recomputing for the same tags
 */
const defaultStylesCache = new Map<string, Record<string, string>>();

/**
 * Singleton hidden iframe used to compute UA default styles in isolation
 */
let uaDefaultsIframe: HTMLIFrameElement | null = null;

// Note: We compare against default styles directly where needed for performance.
const getUAContext = (): { win: Window; doc: Document } | null => {
  try {
    if (!uaDefaultsIframe) {
      uaDefaultsIframe = document.createElement("iframe");
      uaDefaultsIframe.setAttribute("aria-hidden", "true");
      uaDefaultsIframe.tabIndex = -1;
      uaDefaultsIframe.style.position = "absolute";
      uaDefaultsIframe.style.width = "0";
      uaDefaultsIframe.style.height = "0";
      uaDefaultsIframe.style.border = "0";
      uaDefaultsIframe.style.left = "-9999px";
      uaDefaultsIframe.style.top = "-9999px";
      uaDefaultsIframe.src = "about:blank";
      // Append to documentElement to avoid layout shifts
      (document.documentElement || document.body).appendChild(uaDefaultsIframe);
    }

    const win = uaDefaultsIframe.contentWindow;
    const doc = uaDefaultsIframe.contentDocument || (win && (win.document as Document)) || null;
    if (win && doc && doc.body) {
      return { win, doc };
    }
  } catch (_err) {
    // Ignore and fall back below
  }
  return null;
};

/**
 * Creates a basic element and extracts its default computed styles
 * This generates default styles dynamically instead of using hardcoded values
 */
const generateDefaultStylesForTag = (tagName: string): Record<string, string> => {
  const tag = tagName.toLowerCase();

  // Prefer an isolated about:blank iframe to avoid author CSS influence
  const ua = getUAContext();
  if (ua) {
    const { win, doc } = ua;
    const el = doc.createElement(tag);
    doc.body.appendChild(el);
    try {
      const computed = win.getComputedStyle(el);
      const defaults: Record<string, string> = {};
      for (let i = 0; i < computed.length; i++) {
        const property = computed[i];
        const value = computed.getPropertyValue(property);
        if (value) defaults[property] = value;
      }
      return defaults;
    } finally {
      el.remove();
    }
  }

  // Fallback: use main document but force UA defaults with 'all: revert'
  const fallbackEl = document.createElement(tag);
  // Ensure author styles are ignored
  (fallbackEl.style as any).all = "revert";
  fallbackEl.style.position = "absolute";
  fallbackEl.style.left = "-9999px";
  fallbackEl.style.top = "-9999px";
  document.body.appendChild(fallbackEl);
  try {
    const computed = window.getComputedStyle(fallbackEl);
    const defaults: Record<string, string> = {};
    for (let i = 0; i < computed.length; i++) {
      const property = computed[i];
      const value = computed.getPropertyValue(property);
      if (value) defaults[property] = value;
    }
    return defaults;
  } finally {
    fallbackEl.remove();
  }
};

/**
 * Gets the default styles for a specific HTML tag
 * This is used to avoid storing default styles in snapshots
 * Generates styles dynamically from actual elements instead of hardcoded values
 */
export const getDefaultStylesForTag = (tagName: string): Record<string, string> => {
  // Convert tag name to lowercase for consistency
  const tag = tagName.toLowerCase();

  // Check cache first
  if (defaultStylesCache.has(tag)) {
    return defaultStylesCache.get(tag)!;
  }

  // Generate default styles dynamically
  const defaultStyles = generateDefaultStylesForTag(tag);

  // Cache the result
  defaultStylesCache.set(tag, defaultStyles);

  return defaultStyles;
};

/**
 * Checks if a style property has the default value for a specific tag
 */
export const isDefaultStyleForTag = (tagName: string, property: string, value: string): boolean => {
  const defaultStyles = getDefaultStylesForTag(tagName);
  return defaultStyles[property] === value;
};
