import {
  CategorizedColorInfo,
  ColorPalette,
} from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/paletteTypes.ts";
import { colorToRgb, getColorInAllFormats, isLightColor } from "@entrypoints/shared/utils/colorAnalysis.ts";

export function categorizeColorsIntoPalette(
  backgroundColors: Map<string, CategorizedColorInfo>,
  textColors: Map<string, CategorizedColorInfo>,
  borderColors: Map<string, CategorizedColorInfo>,
): ColorPalette {
  const newPalette: ColorPalette = {
    primary: [],
    secondary: [],
    tertiary: [],
    neutral: [],
    element: [],
    text: [],
    border: [],
  };

  const addColorToPalette = (
    color: string,
    count: number,
    elements: Element[],
    category: keyof ColorPalette,
    name: string,
  ) => {
    // Use the full category name: first letters collide (tertiary/text both gave "t1")
    const id = `${category}-${newPalette[category].length + 1}`;
    newPalette[category].push({ id, color, name, sourceElements: elements, frequency: count });
  };

  const sortedBackgroundColors = Array.from(backgroundColors.entries()).sort((a, b) => b[1].count - a[1].count);

  const primaryButtonColors = sortedBackgroundColors
    .filter(([_, info]) => ["primary-button", "secondary-button", "container"].includes(info.category))
    .slice(0, 3);

  primaryButtonColors.forEach(([color, info]) => {
    const hexColor = getColorInAllFormats(color)?.hex || color;
    let name = "Primary Color";
    if (info.category === "primary-button") name = "Primary Button";
    else if (info.category === "secondary-button") name = "Secondary Button";
    else if (info.category === "container") name = "Container";
    addColorToPalette(hexColor, info.count, info.elements, "primary", name);
  });

  const secondaryColors = sortedBackgroundColors
    .filter(([color]) => !primaryButtonColors.some(([c]) => c === color))
    .filter(([_, info]) => ["tertiary-button", "icon-button", "navigation"].includes(info.category))
    .slice(0, 4);

  secondaryColors.forEach(([color, info]) => {
    const hexColor = getColorInAllFormats(color)?.hex || color;
    let name = "Secondary Color";
    if (info.category === "tertiary-button") name = "Tertiary Button";
    else if (info.category === "icon-button") name = "Icon Button";
    else if (info.category === "navigation") name = "Navigation";
    addColorToPalette(hexColor, info.count, info.elements, "secondary", name);
  });

  const tertiaryColors = sortedBackgroundColors
    .filter(([color]) => !primaryButtonColors.some(([c]) => c === color) && !secondaryColors.some(([c]) => c === color))
    .slice(0, 5);

  tertiaryColors.forEach(([color, info]) => {
    const hexColor = getColorInAllFormats(color)?.hex || color;
    let name = "Accent Color";
    if (info.category) {
      name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")}`;
    }
    addColorToPalette(hexColor, info.count, info.elements, "tertiary", name);
  });

  const sortedTextColors = Array.from(textColors.entries()).sort((a, b) => b[1].count - a[1].count);

  sortedTextColors.slice(0, 3).forEach(([color, info]) => {
    const hexColor = getColorInAllFormats(color)?.hex || color;
    addColorToPalette(hexColor, info.count, info.elements, "neutral", "Text Color");
  });

  sortedBackgroundColors
    .filter(([color]) => {
      const rgb = colorToRgb(color);
      if (rgb) {
        const { r, g, b } = rgb;
        const isGrayscale = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
        return isGrayscale;
      }
      return false;
    })
    .slice(0, 3)
    .forEach(([color, info]) => {
      const hexColor = getColorInAllFormats(color)?.hex || color;
      const alreadyExists = newPalette.neutral.some((c) => c.color === hexColor);
      if (!alreadyExists) {
        const isLight = isLightColor(color);
        addColorToPalette(
          hexColor,
          info.count,
          info.elements,
          "neutral",
          isLight ? "Background Light" : "Background Dark",
        );
      }
    });

  // Usage-based categories
  sortedBackgroundColors.forEach(([color, info]) => {
    const hexColor = getColorInAllFormats(color)?.hex || color;
    if (!newPalette.element.some((c) => c.color === hexColor)) {
      const id = `element-${newPalette.element.length + 1}`;
      let name = "Element Color";
      if (info.category)
        name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")} Background`;
      newPalette.element.push({ id, color: hexColor, name, sourceElements: info.elements, frequency: info.count });
    }
  });

  sortedTextColors.forEach(([color, info]) => {
    const hexColor = getColorInAllFormats(color)?.hex || color;
    if (!newPalette.text.some((c) => c.color === hexColor)) {
      const id = `text-${newPalette.text.length + 1}`;
      let name = "Text Color";
      if (info.category)
        name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")} Text`;
      newPalette.text.push({ id, color: hexColor, name, sourceElements: info.elements, frequency: info.count });
    }
  });

  const sortedBorderColors = Array.from(borderColors.entries()).sort((a, b) => b[1].count - a[1].count);
  sortedBorderColors.forEach(([color, info]) => {
    const hexColor = getColorInAllFormats(color)?.hex || color;
    if (!newPalette.border.some((c) => c.color === hexColor)) {
      const id = `border-${newPalette.border.length + 1}`;
      let name = "Border Color";
      if (info.category)
        name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")} Border`;
      newPalette.border.push({ id, color: hexColor, name, sourceElements: info.elements, frequency: info.count });
    }
  });

  return newPalette;
}
