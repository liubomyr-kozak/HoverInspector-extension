import { categorizeAllElements } from "@entrypoints/shared/utils/categorizeElements.ts";
import { CategorizedColorInfo } from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/paletteTypes.ts";
import { analyzeButtonColors } from "@entrypoints/shared/utils/colorAnalysis.ts";

export function extractCategorizedColorMaps() {
  const categorizedElements = categorizeAllElements();
  const backgroundColors = new Map<string, CategorizedColorInfo>();
  const textColors = new Map<string, CategorizedColorInfo>();
  const borderColors = new Map<string, CategorizedColorInfo>();

  categorizedElements.forEach(({ element, category }) => {
    const elementAnalysis = analyzeButtonColors(element);
    if (elementAnalysis.backgroundColor !== "rgba(0, 0, 0, 0)" && elementAnalysis.backgroundColor !== "transparent") {
      const bgColor = elementAnalysis.backgroundColor;
      const bgInfo = backgroundColors.get(bgColor) || { count: 0, elements: [], category };
      bgInfo.count++;
      bgInfo.elements.push(element);
      backgroundColors.set(bgColor, bgInfo);
    }
    if (elementAnalysis.textColor) {
      const textColor = elementAnalysis.textColor;
      const textInfo = textColors.get(textColor) || { count: 0, elements: [], category };
      textInfo.count++;
      textInfo.elements.push(element);
      textColors.set(textColor, textInfo);
    }
    if (elementAnalysis.borderColor !== "rgba(0, 0, 0, 0)" && elementAnalysis.borderColor !== "transparent") {
      const borderColor = elementAnalysis.borderColor;
      const borderInfo = borderColors.get(borderColor) || { count: 0, elements: [], category };
      borderInfo.count++;
      borderInfo.elements.push(element);
      borderColors.set(borderColor, borderInfo);
    }
  });

  return { categorizedElements, backgroundColors, textColors, borderColors };
}
