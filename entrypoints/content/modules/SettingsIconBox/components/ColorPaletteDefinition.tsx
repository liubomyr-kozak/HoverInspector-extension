import React, { useEffect, useState } from "react";
import { IconPalette } from "@tabler/icons-react";
import { analyzeButtonColors, getColorInAllFormats, isLightColor } from "@entrypoints/shared/utils/colorAnalysis";
import ColorDetails from "./ColorDetails";
import { categorizeAllElements, ElementCategory } from "@entrypoints/shared/utils/categorizeElements";

// Type for color system options
type ColorSystem = "rgb" | "hex" | "hsl" | "hsv";

// Interface for a color in the palette
interface PaletteColor {
  id: string;
  color: string;
  name: string;
  sourceElements?: Element[]; // Elements where this color was found
  frequency?: number; // How many times this color appears
}

// Interface for the entire color palette
interface ColorPalette {
  // Role-based categories
  primary: PaletteColor[];
  secondary: PaletteColor[];
  tertiary: PaletteColor[];
  neutral: PaletteColor[];

  // Usage-based categories
  element: PaletteColor[]; // Background colors for elements
  text: PaletteColor[]; // Text colors
  border: PaletteColor[]; // Border colors
}

/**
 * ColorPaletteDefinition Component
 *
 * This component allows users to define their color palette with:
 * - Primary colors (maximum of three)
 * - Secondary colors
 * - Tertiary colors
 * - Neutral colors
 */
export const ColorPaletteDefinition: React.FC = () => {
  // Default palette with some initial colors based on design guidelines
  const defaultPalette: ColorPalette = {
    // Role-based categories
    primary: [{ id: "p1", color: "#15803d", name: "Primary Green" }],
    secondary: [{ id: "s1", color: "#3aca70", name: "Secondary Green" }],
    tertiary: [],
    neutral: [
      { id: "n1", color: "#374151", name: "Text Gray" },
      { id: "n2", color: "#ffffff", name: "Background White" },
    ],

    // Usage-based categories
    element: [{ id: "e1", color: "#15803d", name: "Element Green" }],
    text: [{ id: "t1", color: "#374151", name: "Text Gray" }],
    border: [],
  };

  // State for the color palette
  const [colorPalette, setColorPalette] = useState<ColorPalette>(defaultPalette);

  // State for extraction status
  const [extractionStatus, setExtractionStatus] = useState<{
    isExtracting: boolean;
    lastExtracted: Date | null;
    totalElementsAnalyzed: number;
    totalColorsFound: number;
  }>({
    isExtracting: false,
    lastExtracted: null,
    totalElementsAnalyzed: 0,
    totalColorsFound: 0,
  });

  // Color system state
  const [selectedColorSystem, setSelectedColorSystem] = useState<ColorSystem>("hex");

  // State to track which color is selected
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  // State to track which color's source elements are expanded
  const [expandedSourceElements, setExpandedSourceElements] = useState<Set<string>>(new Set());

  // Extract colors from page elements and categorize them
  const extractColorsFromPage = () => {
    setExtractionStatus((prev) => ({ ...prev, isExtracting: true }));

    try {
      // Get all categorized elements from the page
      const categorizedElements = categorizeAllElements();

      // Maps to store colors and their frequencies
      const backgroundColors = new Map<string, { count: number; elements: Element[]; category: ElementCategory }>();
      const textColors = new Map<string, { count: number; elements: Element[]; category: ElementCategory }>();
      const borderColors = new Map<string, { count: number; elements: Element[]; category: ElementCategory }>();

      // Analyze each element
      categorizedElements.forEach(({ element, category }) => {
        const elementAnalysis = analyzeButtonColors(element);

        // Process background color
        if (
          elementAnalysis.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          elementAnalysis.backgroundColor !== "transparent"
        ) {
          const bgColor = elementAnalysis.backgroundColor;
          const bgInfo = backgroundColors.get(bgColor) || { count: 0, elements: [], category };
          bgInfo.count++;
          bgInfo.elements.push(element);
          backgroundColors.set(bgColor, bgInfo);
        }

        // Process text color
        if (elementAnalysis.textColor) {
          const textColor = elementAnalysis.textColor;
          const textInfo = textColors.get(textColor) || { count: 0, elements: [], category };
          textInfo.count++;
          textInfo.elements.push(element);
          textColors.set(textColor, textInfo);
        }

        // Process border color
        if (elementAnalysis.borderColor !== "rgba(0, 0, 0, 0)" && elementAnalysis.borderColor !== "transparent") {
          const borderColor = elementAnalysis.borderColor;
          const borderInfo = borderColors.get(borderColor) || { count: 0, elements: [], category };
          borderInfo.count++;
          borderInfo.elements.push(element);
          borderColors.set(borderColor, borderInfo);
        }
      });

      // Categorize colors into the palette
      const newPalette = categorizeColorsIntoPalette(backgroundColors, textColors, borderColors);

      // Update state
      setColorPalette(newPalette);
      setExtractionStatus({
        isExtracting: false,
        lastExtracted: new Date(),
        totalElementsAnalyzed: categorizedElements.length,
        totalColorsFound: backgroundColors.size + textColors.size + borderColors.size,
      });
    } catch (error) {
      console.error("Error extracting colors from page:", error);
      setExtractionStatus((prev) => ({ ...prev, isExtracting: false }));
    }
  };

  // Categorize colors into primary, secondary, tertiary, neutral, and usage-based categories
  const categorizeColorsIntoPalette = (
    backgroundColors: Map<string, { count: number; elements: Element[]; category: ElementCategory }>,
    textColors: Map<string, { count: number; elements: Element[]; category: ElementCategory }>,
    borderColors: Map<string, { count: number; elements: Element[]; category: ElementCategory }>,
  ): ColorPalette => {
    const newPalette: ColorPalette = {
      // Role-based categories
      primary: [],
      secondary: [],
      tertiary: [],
      neutral: [],

      // Usage-based categories
      element: [],
      text: [],
      border: [],
    };

    // Helper function to add a color to the palette
    const addColorToPalette = (
      color: string,
      count: number,
      elements: Element[],
      category: keyof ColorPalette,
      name: string,
    ) => {
      const id = `${category[0]}${newPalette[category].length + 1}`;
      newPalette[category].push({
        id,
        color,
        name,
        sourceElements: elements,
        frequency: count,
      });
    };

    // Process background colors (most likely to be primary/secondary colors)
    const sortedBackgroundColors = Array.from(backgroundColors.entries()).sort((a, b) => b[1].count - a[1].count); // Sort by frequency

    // Primary colors: Most frequent background colors from primary buttons (max 3)
    const primaryButtonColors = sortedBackgroundColors
      .filter(
        ([_, info]) =>
          info.category === "primary-button" || info.category === "secondary-button" || info.category === "container",
      )
      .slice(0, 3);

    primaryButtonColors.forEach(([color, info]) => {
      // Convert to hex for consistency
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;

      // Generate a name based on the element category
      let name = "Primary Color";
      if (info.category === "primary-button") name = "Primary Button";
      else if (info.category === "secondary-button") name = "Secondary Button";
      else if (info.category === "container") name = "Container";

      addColorToPalette(hexColor, info.count, info.elements, "primary", name);
    });

    // Secondary colors: Next most frequent background colors
    const secondaryColors = sortedBackgroundColors
      .filter(([color]) => !primaryButtonColors.some(([c]) => c === color))
      .filter(
        ([_, info]) =>
          info.category === "tertiary-button" || info.category === "icon-button" || info.category === "navigation",
      )
      .slice(0, 4);

    secondaryColors.forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;

      let name = "Secondary Color";
      if (info.category === "tertiary-button") name = "Tertiary Button";
      else if (info.category === "icon-button") name = "Icon Button";
      else if (info.category === "navigation") name = "Navigation";

      addColorToPalette(hexColor, info.count, info.elements, "secondary", name);
    });

    // Tertiary colors: Less frequent but still significant colors
    const tertiaryColors = sortedBackgroundColors
      .filter(
        ([color]) => !primaryButtonColors.some(([c]) => c === color) && !secondaryColors.some(([c]) => c === color),
      )
      .slice(0, 5);

    tertiaryColors.forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;

      let name = "Accent Color";
      if (info.category) {
        name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")}`;
      }

      addColorToPalette(hexColor, info.count, info.elements, "tertiary", name);
    });

    // Neutral colors: Text colors and common background colors
    // Process text colors
    const sortedTextColors = Array.from(textColors.entries()).sort((a, b) => b[1].count - a[1].count);

    // Add most common text colors to neutral palette
    sortedTextColors.slice(0, 3).forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;

      addColorToPalette(hexColor, info.count, info.elements, "neutral", "Text Color");
    });

    // Add common background colors that are likely neutral (white, black, grays)
    sortedBackgroundColors
      .filter(([color]) => {
        const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
        if (rgb) {
          const r = parseInt(rgb[1], 10);
          const g = parseInt(rgb[2], 10);
          const b = parseInt(rgb[3], 10);

          // Check if it's a grayscale color (r, g, b values are close)
          const isGrayscale = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
          return isGrayscale;
        }
        return false;
      })
      .slice(0, 3)
      .forEach(([color, info]) => {
        const colorFormats = getColorInAllFormats(color);
        const hexColor = colorFormats?.hex || color;

        // Check if this color is already in the neutral palette
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

    // Populate usage-based categories

    // Process background colors for element category
    sortedBackgroundColors.forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;

      // Check if this color is already in the element category
      const alreadyExists = newPalette.element.some((c) => c.color === hexColor);
      if (!alreadyExists) {
        const id = `e${newPalette.element.length + 1}`;
        let name = "Element Color";
        if (info.category) {
          name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")} Background`;
        }

        newPalette.element.push({
          id,
          color: hexColor,
          name,
          sourceElements: info.elements,
          frequency: info.count,
        });
      }
    });

    // Process text colors for text category
    sortedTextColors.forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;

      // Check if this color is already in the text category
      const alreadyExists = newPalette.text.some((c) => c.color === hexColor);
      if (!alreadyExists) {
        const id = `t${newPalette.text.length + 1}`;
        let name = "Text Color";
        if (info.category) {
          name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")} Text`;
        }

        newPalette.text.push({
          id,
          color: hexColor,
          name,
          sourceElements: info.elements,
          frequency: info.count,
        });
      }
    });

    // Process border colors for border category
    const sortedBorderColors = Array.from(borderColors.entries()).sort((a, b) => b[1].count - a[1].count);
    sortedBorderColors.forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;

      // Check if this color is already in the border category
      const alreadyExists = newPalette.border.some((c) => c.color === hexColor);
      if (!alreadyExists) {
        const id = `b${newPalette.border.length + 1}`;
        let name = "Border Color";
        if (info.category) {
          name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, " ")} Border`;
        }

        newPalette.border.push({
          id,
          color: hexColor,
          name,
          sourceElements: info.elements,
          frequency: info.count,
        });
      }
    });

    return newPalette;
  };

  // Load palette from localStorage on component mount
  useEffect(() => {
    const savedPalette = localStorage.getItem("colorPalette");
    if (savedPalette) {
      try {
        setColorPalette(JSON.parse(savedPalette));
      } catch (error) {
        console.error("Error loading saved color palette:", error);
      }
    }
  }, []);

  // Save palette to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("colorPalette", JSON.stringify(colorPalette));
  }, [colorPalette]);

  /**
   * Formats a color string based on the selected color system
   */
  const formatColor = (color: string): string => {
    if (selectedColorSystem === "hex") {
      return color; // Most colors are stored in HEX format by default
    }

    // Convert the color to all formats
    const formattedColors = getColorInAllFormats(color);
    if (!formattedColors) return color; // Return original if conversion fails

    // Return the color in the selected format
    return formattedColors[selectedColorSystem];
  };

  /**
   * Toggles the expanded state of a color's source elements
   */
  const toggleSourceElementsExpansion = (colorId: string) => {
    setExpandedSourceElements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(colorId)) {
        newSet.delete(colorId);
      } else {
        newSet.add(colorId);
      }
      return newSet;
    });
  };

  // Color editing functions removed as per requirements

  // Run extraction on component mount automatically
  useEffect(() => {
    // Always extract colors on component mount
    extractColorsFromPage();
  }, []);

  // Navigate to a source element
  const navigateToElement = (element: Element) => {
    try {
      // Check if element is still in the DOM
      if (!document.contains(element)) {
        console.warn("Element is no longer in the DOM");
        return;
      }

      // Scroll to the element
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Store original styles
      const htmlElement = element as HTMLElement;
      const originalStyles = {
        outline: htmlElement.style.outline,
        outlineOffset: htmlElement.style.outlineOffset,
        backgroundColor: htmlElement.style.backgroundColor,
        transition: htmlElement.style.transition,
        zIndex: htmlElement.style.zIndex,
        position: htmlElement.style.position,
      };

      // Add highlight effect
      htmlElement.style.transition = "all 0.3s ease-in-out";
      htmlElement.style.outline = "3px solid rgba(59, 130, 246, 0.7)";
      htmlElement.style.outlineOffset = "2px";

      // Remove highlight after a delay
      setTimeout(() => {
        // Restore original styles
        htmlElement.style.outline = originalStyles.outline;
        htmlElement.style.outlineOffset = originalStyles.outlineOffset;
        htmlElement.style.backgroundColor = originalStyles.backgroundColor;
        htmlElement.style.transition = originalStyles.transition;
        htmlElement.style.zIndex = originalStyles.zIndex;
        htmlElement.style.position = originalStyles.position;
      }, 2000);
    } catch (err) {
      console.error("Error navigating to element:", err);
    }
  };

  // Sort colors by logical palette sequence: Red → Orange/Yellow → Green → Blue/Cyan → Purple → Gray → Transparent
  const sortColorsByPaletteLogic = (
    colors: (PaletteColor & { type: string })[],
  ): (PaletteColor & { type: string })[] => {
    const opaqueColors: (PaletteColor & { type: string })[] = [];
    const transparentColors: (PaletteColor & { type: string })[] = [];

    // Separate transparent colors
    colors.forEach((color) => {
      if (color.color.includes("rgba") && color.color.match(/rgba\([^)]+,\s*([01]?(?:\.\d+)?)\)/)) {
        const alphaMatch = color.color.match(/rgba\([^)]+,\s*([01]?(?:\.\d+)?)\)/);
        const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
        if (alpha < 1) {
          transparentColors.push(color);
        } else {
          opaqueColors.push(color);
        }
      } else {
        opaqueColors.push(color);
      }
    });

    // Define hue ranges for color families (HSL hue is 0-360)
    const getHueFamily = (hue: number): number => {
      // Red: 0-15, 345-360
      if (hue >= 345 || hue <= 15) return 0;
      // Orange/Yellow: 16-60
      if (hue >= 16 && hue <= 60) return 1;
      // Green: 61-150
      if (hue >= 61 && hue <= 150) return 2;
      // Blue/Cyan: 151-240
      if (hue >= 151 && hue <= 240) return 3;
      // Purple: 241-300
      if (hue >= 241 && hue <= 300) return 4;
      // Gray (low saturation): 301-344
      return 5;
    };

    // Sort opaque colors by hue family and lightness
    const sortedOpaqueColors = opaqueColors.sort((a, b) => {
      const aFormats = getColorInAllFormats(a.color);
      const bFormats = getColorInAllFormats(b.color);

      if (!aFormats || !bFormats) return 0;

      // Extract HSL values
      const aHSL = aFormats.hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      const bHSL = bFormats.hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);

      if (!aHSL || !bHSL) return 0;

      const aHue = parseInt(aHSL[1], 10);
      const bHue = parseInt(bHSL[1], 10);
      const aSat = parseInt(aHSL[2], 10);
      const bSat = parseInt(bHSL[2], 10);
      const aLight = parseInt(aHSL[3], 10);
      const bLight = parseInt(bHSL[3], 10);

      // Handle grayscale colors (low saturation)
      const aIsGray = aSat < 10;
      const bIsGray = bSat < 10;

      const aFamily = aIsGray ? 5 : getHueFamily(aHue);
      const bFamily = bIsGray ? 5 : getHueFamily(bHue);

      // First sort by hue family
      if (aFamily !== bFamily) return aFamily - bFamily;

      // Within same family, sort by lightness (lightest to darkest)
      return bLight - aLight;
    });

    // Sort transparent colors by lightness
    const sortedTransparentColors = transparentColors.sort((a, b) => {
      const aFormats = getColorInAllFormats(a.color);
      const bFormats = getColorInAllFormats(b.color);

      if (!aFormats || !bFormats) return 0;

      const aHSL = aFormats.hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      const bHSL = bFormats.hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);

      if (!aHSL || !bHSL) return 0;

      const aLight = parseInt(aHSL[3], 10);
      const bLight = parseInt(bHSL[3], 10);

      return bLight - aLight; // Lightest to darkest
    });

    return [...sortedOpaqueColors, ...sortedTransparentColors];
  };

  return (
    <div className="bg-white p-5 rounded-lg mb-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <IconPalette size={24} className="text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-800">Color Palette Definition</h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Colors from your page palette organized by category, with each category sorted by logical palette sequence.
      </p>

      {/* Colors split by categories */}
      <div className="space-y-6">
        {/* Primary Colors */}
        {colorPalette.primary.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Primary Colors</h4>
            <div className="flex gap-4 flex-wrap">
              {sortColorsByPaletteLogic(colorPalette.primary.map((color) => ({ ...color, type: "Primary" }))).map(
                (color) => (
                  <div key={color.id} className="flex flex-col">
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded border cursor-pointer transition-all duration-200 ${
                          selectedColorId === color.id
                            ? "border-gray-500 shadow-lg scale-105"
                            : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={`${color.name}: ${formatColor(color.color)}`}
                        onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                      />
                    </div>
                    {/* Color Details */}
                    {selectedColorId === color.id && (
                      <ColorDetails
                        color={color}
                        formatColor={formatColor}
                        expandedSourceElements={expandedSourceElements}
                        toggleSourceElementsExpansion={toggleSourceElementsExpansion}
                        navigateToElement={navigateToElement}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Secondary Colors */}
        {colorPalette.secondary.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Secondary Colors</h4>
            <div className="flex gap-4 flex-wrap">
              {sortColorsByPaletteLogic(colorPalette.secondary.map((color) => ({ ...color, type: "Secondary" }))).map(
                (color) => (
                  <div key={color.id} className="flex flex-col">
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded border cursor-pointer transition-all duration-200 ${
                          selectedColorId === color.id
                            ? "border-gray-500 shadow-lg scale-105"
                            : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={`${color.name}: ${formatColor(color.color)}`}
                        onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                      />
                    </div>
                    {/* Color Details */}
                    {selectedColorId === color.id && (
                      <ColorDetails
                        color={color}
                        formatColor={formatColor}
                        expandedSourceElements={expandedSourceElements}
                        toggleSourceElementsExpansion={toggleSourceElementsExpansion}
                        navigateToElement={navigateToElement}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Tertiary Colors */}
        {colorPalette.tertiary.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Tertiary Colors</h4>
            <div className="flex gap-4 flex-wrap">
              {sortColorsByPaletteLogic(colorPalette.tertiary.map((color) => ({ ...color, type: "Tertiary" }))).map(
                (color) => (
                  <div key={color.id} className="flex flex-col">
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded border cursor-pointer transition-all duration-200 ${
                          selectedColorId === color.id
                            ? "border-gray-500 shadow-lg scale-105"
                            : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={`${color.name}: ${formatColor(color.color)}`}
                        onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                      />
                    </div>
                    {/* Color Details */}
                    {selectedColorId === color.id && (
                      <ColorDetails
                        color={color}
                        formatColor={formatColor}
                        expandedSourceElements={expandedSourceElements}
                        toggleSourceElementsExpansion={toggleSourceElementsExpansion}
                        navigateToElement={navigateToElement}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Neutral Colors */}
        {colorPalette.neutral.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Neutral Colors</h4>
            <div className="flex gap-4 flex-wrap">
              {sortColorsByPaletteLogic(colorPalette.neutral.map((color) => ({ ...color, type: "Neutral" }))).map(
                (color) => (
                  <div key={color.id} className="flex flex-col">
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded border cursor-pointer transition-all duration-200 ${
                          selectedColorId === color.id
                            ? "border-gray-500 shadow-lg scale-105"
                            : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={`${color.name}: ${formatColor(color.color)}`}
                        onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                      />
                    </div>
                    {/* Color Details */}
                    {selectedColorId === color.id && (
                      <ColorDetails
                        color={color}
                        formatColor={formatColor}
                        expandedSourceElements={expandedSourceElements}
                        toggleSourceElementsExpansion={toggleSourceElementsExpansion}
                        navigateToElement={navigateToElement}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Element Colors */}
        {colorPalette.element.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Element Colors</h4>
            <div className="flex gap-4 flex-wrap">
              {sortColorsByPaletteLogic(colorPalette.element.map((color) => ({ ...color, type: "Element" }))).map(
                (color) => (
                  <div key={color.id} className="flex flex-col">
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded border cursor-pointer transition-all duration-200 ${
                          selectedColorId === color.id
                            ? "border-gray-500 shadow-lg scale-105"
                            : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={`${color.name}: ${formatColor(color.color)}`}
                        onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                      />
                    </div>
                    {/* Color Details */}
                    {selectedColorId === color.id && (
                      <ColorDetails
                        color={color}
                        formatColor={formatColor}
                        expandedSourceElements={expandedSourceElements}
                        toggleSourceElementsExpansion={toggleSourceElementsExpansion}
                        navigateToElement={navigateToElement}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Text Colors */}
        {colorPalette.text.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Text Colors</h4>
            <div className="flex gap-4 flex-wrap">
              {sortColorsByPaletteLogic(colorPalette.text.map((color) => ({ ...color, type: "Text" }))).map((color) => (
                <div key={color.id} className="flex flex-col">
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded border cursor-pointer transition-all duration-200 ${
                        selectedColorId === color.id
                          ? "border-gray-500 shadow-lg scale-105"
                          : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={`${color.name}: ${formatColor(color.color)}`}
                      onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                    />
                  </div>
                  {/* Color Details */}
                  {selectedColorId === color.id && (
                    <ColorDetails
                      color={color}
                      formatColor={formatColor}
                      expandedSourceElements={expandedSourceElements}
                      toggleSourceElementsExpansion={toggleSourceElementsExpansion}
                      navigateToElement={navigateToElement}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Border Colors */}
        {colorPalette.border.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Border Colors</h4>
            <div className="flex gap-4 flex-wrap">
              {sortColorsByPaletteLogic(colorPalette.border.map((color) => ({ ...color, type: "Border" }))).map(
                (color) => (
                  <div key={color.id} className="flex flex-col">
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded border cursor-pointer transition-all duration-200 ${
                          selectedColorId === color.id
                            ? "border-gray-500 shadow-lg scale-105"
                            : "border-gray-300 shadow-inner hover:shadow-md hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={`${color.name}: ${formatColor(color.color)}`}
                        onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                      />
                    </div>
                    {/* Color Details */}
                    {selectedColorId === color.id && (
                      <ColorDetails
                        color={color}
                        formatColor={formatColor}
                        expandedSourceElements={expandedSourceElements}
                        toggleSourceElementsExpansion={toggleSourceElementsExpansion}
                        navigateToElement={navigateToElement}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* Extract colors button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          onClick={extractColorsFromPage}
          disabled={extractionStatus.isExtracting}
        >
          {extractionStatus.isExtracting ? "Extracting..." : "Extract Colors from Page"}
        </button>
        {extractionStatus.lastExtracted && (
          <p className="text-sm text-gray-600 mt-2">
            Last extracted: {extractionStatus.lastExtracted.toLocaleTimeString()}({extractionStatus.totalColorsFound}{" "}
            colors from {extractionStatus.totalElementsAnalyzed} elements)
          </p>
        )}
      </div>
    </div>
  );
};
