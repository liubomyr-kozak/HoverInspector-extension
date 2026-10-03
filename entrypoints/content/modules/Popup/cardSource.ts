import { CardSource } from "@entrypoints/shared/hoverCard/catalog";
import { readA11yAttributes, readEffectiveBackground } from "@entrypoints/shared/hoverCard/elementInfo";
import { getNodeComputedStyle, isRemoteFrameNode } from "@entrypoints/shared/frameAgent/remoteNode";

const px = (v: unknown) => parseFloat(String(v ?? "")) || 0;

/**
 * What the hover card reads for an element: live computed style for local elements (same-origin frames
 * included), the agent's whitelisted snapshot for elements in cross-origin frames.
 */
export function cardSourceFor(node: any, summary: Record<string, any> | null): CardSource | null {
  if (!node) return null;
  let computed: CSSStyleDeclaration | null = null;
  try {
    computed = getNodeComputedStyle(node);
  } catch {
    computed = null;
  }
  const remote = isRemoteFrameNode(node);
  const tag = String(node.localName || summary?.tag || "");
  const hasText = Array.prototype.some.call(node.childNodes || [], (n: Node) => n.nodeType === 3);
  const a11y = remote ? node.a11y : readA11yAttributes(node);
  let effectiveBg: string | undefined;

  return {
    get: (prop) => (computed ? computed.getPropertyValue(prop) || "" : ""),
    tag,
    isSvg: node.namespaceURI === "http://www.w3.org/2000/svg",
    hasText,
    width: px(summary?.width),
    height: px(summary?.height),
    role: a11y.role,
    ariaLabel: a11y.ariaLabel,
    alt: tag === "img" ? node.getAttribute("alt") : null,
    naturalWidth: tag === "img" ? node.naturalWidth || 0 : 0,
    naturalHeight: tag === "img" ? node.naturalHeight || 0 : 0,
    // Walks the ancestors: only worked out when the contrast row asks for it
    get effectiveBg() {
      if (effectiveBg === undefined) effectiveBg = remote ? node.effectiveBackground : hasText ? readEffectiveBackground(node) : "";
      return effectiveBg;
    },
  };
}
