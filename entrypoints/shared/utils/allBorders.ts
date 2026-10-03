const OUTLINE_STYLE_ID = "hover-inspector-element-outline";

/**
 * "Show All Borders": outlines every element of a document with a single stylesheet. Outlines take no
 * space, so the page layout stays the same, and removing the stylesheet restores the page exactly.
 */
export function setAllBordersVisible(doc: Document, visible: boolean) {
  const existing = doc.getElementById(OUTLINE_STYLE_ID);

  if (!visible) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const styleElement = doc.createElement("style");
  styleElement.id = OUTLINE_STYLE_ID;
  styleElement.textContent = `
    body *:not(hover-inspector) {
      outline: 1px dashed rgba(255, 140, 0, 0.6) !important;
      outline-offset: -1px !important;
    }
  `;
  (doc.head || doc.documentElement).appendChild(styleElement);
}
