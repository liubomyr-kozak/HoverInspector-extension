export const ELEMENT_DETAILS_PREFIX = "ELEMENT_DETAILS_";

export const ELEMENT_DETAILS_KEY = (id: string) => {
  // Ensure id is not undefined or empty
  if (!id) {
    console.error("ELEMENT_DETAILS_KEY called with undefined or empty id");
    // Generate a fallback ID to prevent "ELEMENT_DETAILS_undefined" keys
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${ELEMENT_DETAILS_PREFIX}${fallbackId}`;
  }
  return `${ELEMENT_DETAILS_PREFIX}${id}`;
};

export const ELEMENT_DETAILS_LIST_KEY = "ELEMENT_DETAILS_LIST";

// Storage key for ElementDetails panel position and size
export const ELEMENT_DETAILS_PANEL_POSITION_KEY = "ELEMENT_DETAILS_PANEL_POSITION";