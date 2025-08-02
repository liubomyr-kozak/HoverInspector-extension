export const CSS_SNAPSHOT_PREFIX = "CSS_SNAPSHOT_";

export const CSS_SNAPSHOT_KEY = (id: string) => {
  // Ensure id is not undefined or empty
  if (!id) {
    console.error("CSS_SNAPSHOT_KEY called with undefined or empty id");
    // Generate a fallback ID to prevent "CSS_SNAPSHOT_undefined" keys
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return `${CSS_SNAPSHOT_PREFIX}${fallbackId}`;
  }
  return `${CSS_SNAPSHOT_PREFIX}${id}`;
};

export const CSS_SNAPSHOTS_LIST_KEY = "CSS_SNAPSHOTS_LIST";