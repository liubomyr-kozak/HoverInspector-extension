import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { IconX } from "@tabler/icons-react";
import { IconPalette } from "@tabler/icons-react";
import ColorDetails from "./ColorDetails.tsx";
import { getColorInAllFormats } from "@entrypoints/shared/utils/colorAnalysis.ts";
import {
  ColorPalette,
  PaletteColor,
  ColorSystem,
  ColorExtractionStats,
} from "./paletteTypes";
import {
  extractCategorizedColorMaps,
  categorizeColorsIntoPalette,
  sortColorsByPaletteLogic,
} from "./utils/paletteUtils.ts";
import { useDispatch } from "react-redux";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import ColorCategorySection from "./ColorCategorySection.tsx";
import { ImportSection } from "./ImportSection";

let colorContext: CanvasRenderingContext2D | null = null;

/**
 * Canonical form of a CSS colour ("#fff", "white" and "rgb(255,255,255)" all give "#ffffff"), null when
 * the value isn't a colour. The canvas only accepts valid colours into fillStyle.
 */
const normalizeColor = (value: string): string | null => {
  colorContext = colorContext || document.createElement("canvas").getContext("2d");
  if (!colorContext) return value.toLowerCase();
  colorContext.fillStyle = "#000001";
  colorContext.fillStyle = value;
  const first = String(colorContext.fillStyle);
  colorContext.fillStyle = "#000002";
  colorContext.fillStyle = value;
  // Unchanged sentinel: the browser rejected the value
  return first === "#000001" && String(colorContext.fillStyle) === "#000002" ? null : first;
};

// Start empty: the palette is filled from the page, never from placeholder colours
const emptyPalette: ColorPalette = {
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
  const [colorPalette, setColorPalette] = useState<ColorPalette>(emptyPalette);

  // State for extraction status (extraction starts right after mount)
  const [extractionStatus, setExtractionStatus] = useState<ColorExtractionStats>({
    isExtracting: true,
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

    // Let the "Extracting..." state paint before the synchronous page scan
    setTimeout(() => {
      try {
        const { categorizedElements, backgroundColors, textColors, borderColors } = extractCategorizedColorMaps();
        const newPalette = categorizeColorsIntoPalette(backgroundColors, textColors, borderColors);

        setColorPalette(newPalette);
        setSelectedColorId(null);
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
    }, 0);
  }, []);

  // The palette lives only in component state: it holds live DOM references
  // (sourceElements), so it is not persisted (and never to the host page's localStorage).

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

  // In the narrow panel the details wrap above the swatches: bring them into view when a colour is picked
  const detailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const details = detailsRef.current;
    if (!selectedColorId || !details) return;
    let scrollParent = details.parentElement;
    while (scrollParent) {
      const { overflowY } = window.getComputedStyle(scrollParent);
      if ((overflowY === "auto" || overflowY === "scroll") && scrollParent.scrollHeight > scrollParent.clientHeight) break;
      scrollParent = scrollParent.parentElement;
    }
    if (!scrollParent) return;
    const offset = details.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top;
    if (offset < 0 || offset > scrollParent.clientHeight - 80) {
      scrollParent.scrollTo({ top: scrollParent.scrollTop + offset - 12, behavior: "smooth" });
    }
  }, [selectedColorId]);

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
          ...colorPalette.primary.map((c) => c.color),
          ...colorPalette.secondary.map((c) => c.color),
          ...colorPalette.tertiary.map((c) => c.color),
          ...colorPalette.neutral.map((c) => c.color),
          ...colorPalette.element.map((c) => c.color),
          ...colorPalette.text.map((c) => c.color),
          ...colorPalette.border.map((c) => c.color),
        ]}
        parseValue={(value) => {
          // Normalize color values for comparison
          const trimmed = value.trim().toLowerCase();
          // Handle different color formats
          if (trimmed.startsWith("#")) return trimmed;
          if (trimmed.startsWith("rgb")) return trimmed;
          if (trimmed.startsWith("hsl")) return trimmed;
          // For named colors, return as-is
          return trimmed;
        }}
        normalize={normalizeColor}
      />

      {/* Side by side when there is room; otherwise wrap-reverse puts the details above the swatches */}
      <div className="flex flex-wrap-reverse gap-6">
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div className="space-y-6">
            {extractionStatus.isExtracting && !extractionStatus.lastExtracted && (
              <p className="text-sm text-gray-500">Extracting colors from the page...</p>
            )}
            {!extractionStatus.isExtracting && extractionStatus.lastExtracted && extractionStatus.totalColorsFound === 0 && (
              <p className="text-sm text-gray-500">No colors found on this page.</p>
            )}

            {(
              [
                // Backgrounds of buttons, containers and navigation, picked by role
                { key: "brand", title: "Brand Colors", type: "Brand", colors: [...colorPalette.primary, ...colorPalette.secondary, ...colorPalette.tertiary] },
                { key: "text", title: "Text Colors", type: "Text", colors: colorPalette.text },
                { key: "element", title: "Background Colors", type: "Element", colors: colorPalette.element },
                { key: "border", title: "Border Colors", type: "Border", colors: colorPalette.border },
              ] as const
            ).map((cfg) => (
              <ColorCategorySection
                key={cfg.key}
                title={cfg.title}
                type={cfg.type}
                colors={[...cfg.colors]}
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
                Last extracted: {extractionStatus.lastExtracted.toLocaleTimeString()} (
                {extractionStatus.totalColorsFound} colors from {extractionStatus.totalElementsAnalyzed} elements)
              </p>
            )}
          </div>
        </div>

        {selectedColorId && selectedColor && (
          <div
            ref={detailsRef}
            className="relative"
            style={{ flex: "1 1 240px", minWidth: 0 }}
          >
            <button
              type="button"
              aria-label="Close color details"
              title="Close"
              onClick={() => setSelectedColorId(null)}
              className="absolute top-2 right-2 z-10 p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              <IconX size={14} />
            </button>
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
