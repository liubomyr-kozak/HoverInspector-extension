import React, { useEffect, useState, useCallback, useMemo } from "react";
import { IconPalette } from "@tabler/icons-react";
import ColorDetails from "./ColorDetails.tsx";
import { getColorInAllFormats } from "@entrypoints/shared/utils/colorAnalysis.ts";
import {
  ColorPalette,
  PaletteColor,
  ColorSystem,
  ColorExtractionStats,
  TokenTabType,
  TypographyToken,
} from "./paletteTypes";
import {
  extractCategorizedColorMaps,
  categorizeColorsIntoPalette,
  sortColorsByPaletteLogic,
} from "./utils/paletteUtils.ts";
import { useDispatch } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import ColorCategorySection from "./ColorCategorySection.tsx";
import { TabContainer, Tabs, Tab, TabContent } from "./ColorPaletteDefinition.styled";
import { TypographyTokenTab } from "./TypographyTokenTab";
import { extractTypographyTokens } from "./utils/tokenExtraction";
import { ImportSection } from "./ImportSection";

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
  const dispatch = useDispatch();
  const highlightManager = useHighlightOverlay();
  // Default palette with some initial colors based on design guidelines

  // State for the color palette
  const [colorPalette, setColorPalette] = useState<ColorPalette>(defaultPalette);

  // State for extracted tokens
  const [typographyTokens, setTypographyTokens] = useState<TypographyToken[]>([
    { id: "t1", name: "Heading Large", fontSize: "2rem", fontWeight: "600", lineHeight: "1.2" },
    { id: "t2", name: "Heading Medium", fontSize: "1.5rem", fontWeight: "600", lineHeight: "1.3" },
    { id: "t3", name: "Body Text", fontSize: "1rem", fontWeight: "400", lineHeight: "1.5" },
    { id: "t4", name: "Small Text", fontSize: "0.875rem", fontWeight: "400", lineHeight: "1.4" },
  ]);

  // State for extraction status
  const [extractionStatus, setExtractionStatus] = useState<ColorExtractionStats>({
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
  const extractColorsFromPage = useCallback(() => {
    setExtractionStatus((prev) => ({ ...prev, isExtracting: true }));

    try {
      const { categorizedElements, backgroundColors, textColors, borderColors } = extractCategorizedColorMaps();
      const newPalette = categorizeColorsIntoPalette(backgroundColors, textColors, borderColors);

      // Extract design tokens
      const extractedTypographyTokens = extractTypographyTokens();

      // Update state
      setColorPalette(newPalette);
      setTypographyTokens(extractedTypographyTokens);

      const totalTokensFound = extractedTypographyTokens.length;

      setExtractionStatus({
        isExtracting: false,
        lastExtracted: new Date(),
        totalElementsAnalyzed: categorizedElements.length,
        totalColorsFound: backgroundColors.size + textColors.size + borderColors.size + totalTokensFound,
      });
    } catch (error) {
      console.error("Error extracting colors and tokens from page:", error);
      setExtractionStatus((prev) => ({ ...prev, isExtracting: false }));
    }
  }, []);

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
  const getElementXPath = (el: Element): string => {
    if (el.id) {
      return `//*[@id="${el.id}"]`;
    }
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = node.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === node.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
      node = node.parentElement;
      if (node === document.body || node === document.documentElement) break;
    }
    return `//${parts.join("/")}`;
  };

  const navigateToElement = (element: Element) => {
    if (!document.contains(element)) return;
    try {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    } catch {
      element.scrollIntoView(true);
    }
    const xpath = getElementXPath(element);
    highlightManager.startHighlight(xpath);
  };

  // Helper function to find the selected color from all categories
  const getSelectedColor = (): (PaletteColor & { type: string }) | null => {
    if (!selectedColorId) return null;

    const allColorCategories = [
      ...colorPalette.primary.map((color) => ({ ...color, type: "Primary" })),
      ...colorPalette.secondary.map((color) => ({ ...color, type: "Secondary" })),
      ...colorPalette.tertiary.map((color) => ({ ...color, type: "Tertiary" })),
      ...colorPalette.neutral.map((color) => ({ ...color, type: "Neutral" })),
      ...colorPalette.element.map((color) => ({ ...color, type: "Element" })),
      ...colorPalette.text.map((color) => ({ ...color, type: "Text" })),
      ...colorPalette.border.map((color) => ({ ...color, type: "Border" })),
    ];

    return allColorCategories.find((color) => color.id === selectedColorId) || null;
  };

  // Sort colors by logical palette sequence: Red → Orange/Yellow → Green → Blue/Cyan → Purple → Gray → Transparent
  // (sorting moved to paletteUtils.sortColorsByPaletteLogic)

  const selectedColor = useMemo(() => selectedColorId && getSelectedColor(), [selectedColorId, colorPalette]);

  return (
    <div className="bg-white p-5 rounded-lg mb-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <IconPalette size={24} className="text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-800">Color Palette Definition</h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Complete design token system including colors, typography, spacing, borders, and shadows.
      </p>

      {/* Import Section for Colors */}
      <ImportSection
        title="Colors"
        placeholder="Paste color values here (e.g., #ff0000 rgb(255,0,0) blue)..."
        currentValues={[
          ...colorPalette.primary.map(c => c.color),
          ...colorPalette.secondary.map(c => c.color),
          ...colorPalette.tertiary.map(c => c.color),
          ...colorPalette.neutral.map(c => c.color),
          ...colorPalette.element.map(c => c.color),
          ...colorPalette.text.map(c => c.color),
          ...colorPalette.border.map(c => c.color),
        ]}
        parseValue={(value) => {
          // Normalize color values for comparison
          const trimmed = value.trim().toLowerCase();
          // Handle different color formats
          if (trimmed.startsWith('#')) return trimmed;
          if (trimmed.startsWith('rgb')) return trimmed;
          if (trimmed.startsWith('hsl')) return trimmed;
          // For named colors, return as-is
          return trimmed;
        }}
      />

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="space-y-6">
            {/* Consolidated Text Colors Section */}
            <ColorCategorySection
              key="consolidated-text"
              title="Text Colors"
              type="Text"
              colors={[
                ...colorPalette.primary,
                ...colorPalette.secondary,
                ...colorPalette.tertiary,
                ...colorPalette.neutral,
                ...colorPalette.text,
              ]}
              selectedColorId={selectedColorId}
              formatColor={formatColor}
              onSelect={setSelectedColorId}
            />

            {/* Other color categories */}
            {(
              [
                { key: "element", title: "Element Colors", type: "Element" },
                { key: "border", title: "Border Colors", type: "Border" },
              ] as const
            ).map((cfg) => (
              <ColorCategorySection
                key={cfg.key}
                title={cfg.title}
                type={cfg.type}
                colors={(colorPalette as any)[cfg.key]}
                selectedColorId={selectedColorId}
                formatColor={formatColor}
                onSelect={setSelectedColorId}
              />
            ))}
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
                Last extracted: {extractionStatus.lastExtracted.toLocaleTimeString()}(
                {extractionStatus.totalColorsFound} colors from {extractionStatus.totalElementsAnalyzed} elements)
              </p>
            )}
          </div>
        </div>

        {selectedColorId && (
          <div className="pl-6 border-l border-gray-200">
            <ColorDetails
              color={selectedColor as any}
              formatColor={formatColor}
              expandedSourceElements={expandedSourceElements}
              toggleSourceElementsExpansion={toggleSourceElementsExpansion}
              navigateToElement={navigateToElement}
            />
          </div>
        )}
      </div>
    </div>
  );
};
