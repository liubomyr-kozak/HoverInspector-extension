import { categorizeAllElements } from "@entrypoints/shared/utils/categorizeElements.ts";
import { CategorizedColorInfo } from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/paletteTypes.ts";
import { colorToRgb } from "@entrypoints/shared/utils/colorAnalysis.ts";

const BORDER_SIDES = ["top", "right", "bottom", "left"] as const;

/** True for colours that are actually visible (alpha > 0) */
const isVisibleColor = (color: string) => {
  const rgba = colorToRgb(color);
  return !!rgba && rgba.a > 0;
};

/**
 * Colours of the borders that are actually drawn. `border-color` is always set
 * (it defaults to currentColor) and is a multi-value string when sides differ,
 * so look at each side's style/width instead.
 */
const getVisibleBorderColors = (style: CSSStyleDeclaration): string[] => {
  const colors = new Set<string>();
  for (const side of BORDER_SIDES) {
    const borderStyle = style.getPropertyValue(`border-${side}-style`);
    const width = parseFloat(style.getPropertyValue(`border-${side}-width`)) || 0;
    if (borderStyle === "none" || borderStyle === "hidden" || width <= 0) continue;
    const color = style.getPropertyValue(`border-${side}-color`);
    if (isVisibleColor(color)) colors.add(color);
  }
  return [...colors];
};

const addColor = (
  map: Map<string, CategorizedColorInfo>,
  color: string,
  element: Element,
  category: CategorizedColorInfo["category"],
) => {
  const info = map.get(color) || { count: 0, elements: [], category };
  info.count++;
  info.elements.push(element);
  map.set(color, info);
};

export function extractCategorizedColorMaps() {
  const categorizedElements = categorizeAllElements();
  const backgroundColors = new Map<string, CategorizedColorInfo>();
  const textColors = new Map<string, CategorizedColorInfo>();
  const borderColors = new Map<string, CategorizedColorInfo>();

  categorizedElements.forEach(({ element, category }) => {
    const style = window.getComputedStyle(element);

    if (isVisibleColor(style.backgroundColor)) {
      addColor(backgroundColors, style.backgroundColor, element, category);
    }
    if (style.color && isVisibleColor(style.color)) {
      addColor(textColors, style.color, element, category);
    }
    getVisibleBorderColors(style).forEach((color) => addColor(borderColors, color, element, category));
  });

  return { categorizedElements, backgroundColors, textColors, borderColors };
}
