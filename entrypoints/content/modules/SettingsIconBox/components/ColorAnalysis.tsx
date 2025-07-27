import React, { JSX, useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconBorderStyle,
  IconBox,
  IconCategory,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconColorSwatch,
  IconForms,
  IconInfoCircle,
  IconLayoutNavbar,
  IconPalette,
  IconTransitionBottom,
  IconWindowMaximize,
  IconX,
} from "@tabler/icons-react";
import { analyzeButtonColors, getColorInAllFormats } from "@entrypoints/shared/utils/colorAnalysis";
import { categorizeAllElements, ElementCategory } from "@entrypoints/shared/utils/categorizeElements";
import { AiOutlineRadiusBottomleft } from "react-icons/ai";

// Interface for element analysis results
interface ElementAnalysisResult {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: string;
  isLightBackground: boolean;
  contrastRatio: number;
  isReadable: boolean;
  wcagLevel: "AAA" | "AA" | "Fail";
  element: Element;
  category: ElementCategory;
}

// Interface for aggregated element properties
interface AggregatedElementProperties {
  backgroundColors: Map<string, number>;
  textColors: Map<string, number>;
  borderColors: Map<string, number>;
  borderRadii: Map<string, number>;
  totalElements: number;
  elementsByCategory: Map<ElementCategory, ElementAnalysisResult[]>;
  readabilityIssues: number;
}

/**
 * Type for color system options
 * Supported color formats: RGB, HEX, HSL, HSV
 */
type ColorSystem = "rgb" | "hex" | "hsl" | "hsv";

/**
 * ColorAnalysis Component
 *
 * This component analyzes buttons on the page and displays their color properties.
 * It supports multiple color formats (RGB, HEX, HSL, HSV) that can be toggled
 * using the color system selector.
 */
const ColorAnalysis: React.FC<{}> = () => {
  // Store element analysis results
  const [elementAnalysisResults, setElementAnalysisResults] = useState<ElementAnalysisResult[]>([]);

  // Store aggregated element properties
  const [aggregatedProperties, setAggregatedProperties] = useState<AggregatedElementProperties>({
    backgroundColors: new Map(),
    textColors: new Map(),
    borderColors: new Map(),
    borderRadii: new Map(),
    totalElements: 0,
    elementsByCategory: new Map(),
    readabilityIssues: 0,
  });

  // Color system state
  const [selectedColorSystem, setSelectedColorSystem] = useState<ColorSystem>("rgb");
  const [colorSystemMenuOpen, setColorSystemMenuOpen] = useState<boolean>(false);

  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState<ElementCategory | "all">("all");

  // Collapsible groups state
  const [collapsedGroups, setCollapsedGroups] = useState<{
    backgroundColors: boolean;
    textColors: boolean;
    borderColors: boolean;
    borderRadii: boolean;
    categories: boolean;
  }>({
    backgroundColors: false,
    textColors: false,
    borderColors: false,
    borderRadii: false,
    categories: false,
  });

  // Selected property state
  const [selectedProperty, setSelectedProperty] = useState<{
    type: keyof Omit<typeof collapsedGroups, "categories"> | null;
    value: string | null;
    elements: Element[];
  }>({
    type: null,
    value: null,
    elements: [],
  });

  // Available color system options
  const colorSystems: { value: ColorSystem; label: string }[] = [
    { value: "rgb", label: "RGB" }, // Default RGB format (e.g., rgb(255, 0, 0))
    { value: "hex", label: "HEX" }, // Hexadecimal format (e.g., #FF0000)
    { value: "hsl", label: "HSL" }, // HSL format (e.g., hsl(0, 100%, 50%))
    { value: "hsv", label: "HSV" }, // HSV format (e.g., hsv(0, 100%, 100%))
  ];

  // Find all UI elements on the page and analyze them
  useEffect(() => {
    const findAndAnalyzeElements = () => {
      // Get all categorized elements
      const categorizedElements = categorizeAllElements();

      // Analyze each element
      const results: ElementAnalysisResult[] = categorizedElements.map(({ element, category }) => {
        const computedStyle = window.getComputedStyle(element);
        const elementAnalysis = analyzeButtonColors(element); // Reusing the button analysis function

        return {
          ...elementAnalysis,
          borderRadius: computedStyle.borderRadius,
          element,
          category,
        };
      });

      // Aggregate the results
      const aggregated: AggregatedElementProperties = {
        backgroundColors: new Map<string, number>(),
        textColors: new Map<string, number>(),
        borderColors: new Map<string, number>(),
        borderRadii: new Map<string, number>(),
        totalElements: results.length,
        elementsByCategory: new Map<ElementCategory, ElementAnalysisResult[]>(),
        readabilityIssues: 0,
      };

      // Initialize elementsByCategory map
      results.forEach((result) => {
        if (!aggregated.elementsByCategory.has(result.category)) {
          aggregated.elementsByCategory.set(result.category, []);
        }

        const categoryElements = aggregated.elementsByCategory.get(result.category) || [];
        categoryElements.push(result);
        aggregated.elementsByCategory.set(result.category, categoryElements);

        // Count background colors
        const bgCount = aggregated.backgroundColors.get(result.backgroundColor) || 0;
        aggregated.backgroundColors.set(result.backgroundColor, bgCount + 1);

        // Count text colors
        const textCount = aggregated.textColors.get(result.textColor) || 0;
        aggregated.textColors.set(result.textColor, textCount + 1);

        // Count border colors (if not transparent)
        if (result.borderColor !== "rgba(0, 0, 0, 0)") {
          const borderCount = aggregated.borderColors.get(result.borderColor) || 0;
          aggregated.borderColors.set(result.borderColor, borderCount + 1);
        }

        // Count border radii (if not 0px)
        if (result.borderRadius !== "0px") {
          const radiusCount = aggregated.borderRadii.get(result.borderRadius) || 0;
          aggregated.borderRadii.set(result.borderRadius, radiusCount + 1);
        }

        // Count readability issues
        if (!result.isReadable) {
          aggregated.readabilityIssues++;
        }
      });

      setElementAnalysisResults(results);
      setAggregatedProperties(aggregated);
    };

    findAndAnalyzeElements();
  }, []);

  // Helper function to render WCAG level badge
  const renderWcagBadge = (level: "AAA" | "AA" | "Fail") => {
    let bgColor = "bg-red-100 text-red-800";
    let icon = <IconX size={12} />;

    if (level === "AAA") {
      bgColor = "bg-green-100 text-green-800";
      icon = <IconCheck size={12} />;
    } else if (level === "AA") {
      bgColor = "bg-yellow-100 text-yellow-800";
      icon = <IconAlertTriangle size={12} />;
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor}`}>
        <span className="mr-1">{icon}</span>
        WCAG {level}
      </span>
    );
  };

  // Helper function to get icon for a category
  const getCategoryIcon = (category: ElementCategory) => {
    switch (category) {
      case "primary-button":
      case "secondary-button":
      case "tertiary-button":
      case "icon-button":
      case "text-button":
      case "link-button":
        return <IconTransitionBottom size={16} />;
      case "form-input":
        return <IconForms size={16} />;
      case "navigation":
        return <IconLayoutNavbar size={16} />;
      case "container":
        return <IconBox size={16} />;
      case "modal":
        return <IconWindowMaximize size={16} />;
      case "tooltip":
        return <IconInfoCircle size={16} />;
      default:
        return <IconCategory size={16} />;
    }
  };

  // Helper function to get display name for a category
  const getCategoryDisplayName = (category: ElementCategory) => {
    switch (category) {
      case "primary-button":
        return "Primary Buttons";
      case "secondary-button":
        return "Secondary Buttons";
      case "tertiary-button":
        return "Tertiary Buttons";
      case "icon-button":
        return "Icon Buttons";
      case "text-button":
        return "Text Buttons";
      case "link-button":
        return "Link Buttons";
      case "form-input":
        return "Form Inputs";
      case "navigation":
        return "Navigation Elements";
      case "container":
        return "Containers";
      case "modal":
        return "Modal Dialogs";
      case "tooltip":
        return "Tooltips";
      default:
        return "Other Elements";
    }
  };

  // Helper function to render category list
  const renderCategoryList = () => {
    if (aggregatedProperties.elementsByCategory.size === 0) return null;

    const isCollapsed = collapsedGroups.categories;

    return (
      <div className="mb-3">
        <div
          className="font-medium mb-1 flex items-center gap-1 cursor-pointer"
          onClick={() => toggleGroupCollapse("categories")}
        >
          {isCollapsed ? (
            <IconChevronRight size={16} className="text-gray-500" />
          ) : (
            <IconChevronDown size={16} className="text-gray-500" />
          )}
          <IconCategory size={16} />
          Element Categories ({aggregatedProperties.elementsByCategory.size} types)
        </div>

        {!isCollapsed && (
          <div className="flex flex-wrap gap-2 ml-5">
            <div
              className={`flex items-center rounded px-2 py-1 text-xs cursor-pointer ${
                selectedCategory === "all" ? "bg-blue-100 hover:bg-blue-200" : "bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              <span className="mr-1">All Elements</span>
              <span className="ml-1 text-gray-500">({aggregatedProperties.totalElements})</span>
            </div>

            {Array.from(aggregatedProperties.elementsByCategory.entries()).map(([category, elements], index) => (
              <div
                key={index}
                className={`flex items-center rounded px-2 py-1 text-xs cursor-pointer ${
                  selectedCategory === category ? "bg-blue-100 hover:bg-blue-200" : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                <span className="mr-1 flex items-center gap-1">
                  {getCategoryIcon(category)}
                  {getCategoryDisplayName(category)}
                </span>
                <span className="ml-1 text-gray-500">({elements.length})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /**
   * Formats a color string based on the selected color system
   *
   * This function converts the input color (which is in RGB format)
   * to the currently selected color system (RGB, HEX, HSL, or HSV).
   *
   * @param color The color in RGB format to convert
   * @returns The color formatted in the selected color system
   */
  const formatColor = (color: string): string => {
    // If RGB is selected, return the original color (already in RGB format)
    if (selectedColorSystem === "rgb") {
      return color;
    }

    // Convert the color to all formats
    const formattedColors = getColorInAllFormats(color);
    if (!formattedColors) return color; // Return original if conversion fails

    // Return the color in the selected format
    return formattedColors[selectedColorSystem];
  };

  // Helper function to render color swatches for a collection
  const renderColorCollection = (
    colors: Map<string, number>,
    label: string,
    icon: JSX.Element,
    groupKey: keyof Omit<typeof collapsedGroups, "categories">,
  ) => {
    if (colors.size === 0) return null;

    // Get filtered colors based on selected category
    const filteredColors = new Map<string, number>();
    let totalCount = 0;

    if (selectedCategory !== "all") {
      // Only count colors from the selected category
      const categoryElements = aggregatedProperties.elementsByCategory.get(selectedCategory) || [];
      categoryElements.forEach((element) => {
        let color = "";
        switch (groupKey) {
          case "backgroundColors":
            color = element.backgroundColor;
            break;
          case "textColors":
            color = element.textColor;
            break;
          case "borderColors":
            color = element.borderColor;
            if (color === "rgba(0, 0, 0, 0)") return; // Skip transparent borders
            break;
          case "borderRadii":
            color = element.borderRadius;
            if (color === "0px") return; // Skip zero radius
            break;
        }

        const count = filteredColors.get(color) || 0;
        filteredColors.set(color, count + 1);
        totalCount++;
      });

      // If no colors found for this category and property, return null
      if (filteredColors.size === 0) return null;
    } else {
      // Use all colors
      colors.forEach((count, color) => {
        filteredColors.set(color, count);
      });
      totalCount = aggregatedProperties.totalElements;
    }

    const isCollapsed = collapsedGroups[groupKey];
    const isSelected = selectedProperty.type === groupKey;

    return (
      <div className="mb-3">
        <div
          className={`font-medium mb-1 flex items-center gap-1 cursor-pointer ${isSelected ? "text-blue-600" : ""}`}
          onClick={() => toggleGroupCollapse(groupKey)}
        >
          {isCollapsed ? (
            <IconChevronRight size={16} className={isSelected ? "text-blue-500" : "text-gray-500"} />
          ) : (
            <IconChevronDown size={16} className={isSelected ? "text-blue-500" : "text-gray-500"} />
          )}
          {icon}
          {label} {filteredColors.size === 1 ? "(Consistent)" : `(${filteredColors.size} variations)`}
        </div>

        {!isCollapsed && (
          <div className="flex flex-wrap gap-2 ml-5">
            {Array.from(filteredColors.entries()).map(([color, count], index) => {
              const formattedColor = formatColor(color);
              const isColorSelected = isSelected && selectedProperty.value === color;

              return (
                <div
                  key={index}
                  className={`flex items-center rounded px-2 py-1 text-xs cursor-pointer ${
                    isColorSelected ? "bg-blue-100 hover:bg-blue-200" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => highlightElementsWithProperty(groupKey, color)}
                  title={`Click to show ${selectedCategory === "all" ? "elements" : getCategoryDisplayName(selectedCategory)} with this property`}
                >
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-1 border ${isColorSelected ? "border-blue-500" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                  <span title={color}>
                    {formattedColor.length > 12 ? `${formattedColor.substring(0, 12)}...` : formattedColor}
                  </span>
                  <span className="ml-1 text-gray-500">({Math.round((count / totalCount) * 100)}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Helper function to render border radius collection
  const renderBorderRadiusCollection = (radii: Map<string, number>) => {
    if (radii.size === 0) return null;

    // Get filtered radii based on selected category
    const filteredRadii = new Map<string, number>();
    let totalCount = 0;

    if (selectedCategory !== "all") {
      // Only count radii from the selected category
      const categoryElements = aggregatedProperties.elementsByCategory.get(selectedCategory) || [];
      categoryElements.forEach((element) => {
        const radius = element.borderRadius;
        if (radius === "0px") return; // Skip zero radius

        const count = filteredRadii.get(radius) || 0;
        filteredRadii.set(radius, count + 1);
        totalCount++;
      });

      // If no radii found for this category, return null
      if (filteredRadii.size === 0) return null;
    } else {
      // Use all radii
      radii.forEach((count, radius) => {
        filteredRadii.set(radius, count);
      });
      totalCount = aggregatedProperties.totalElements;
    }

    const isCollapsed = collapsedGroups.borderRadii;
    const isSelected = selectedProperty.type === "borderRadii";

    return (
      <div className="mb-3">
        <div
          className={`font-medium mb-1 flex items-center gap-1 cursor-pointer ${isSelected ? "text-blue-600" : ""}`}
          onClick={() => toggleGroupCollapse("borderRadii")}
        >
          {isCollapsed ? (
            <IconChevronRight size={16} className={isSelected ? "text-blue-500" : "text-gray-500"} />
          ) : (
            <IconChevronDown size={16} className={isSelected ? "text-blue-500" : "text-gray-500"} />
          )}
          <AiOutlineRadiusBottomleft size={16} />
          Border Radius {filteredRadii.size === 1 ? "(Consistent)" : `(${filteredRadii.size} variations)`}
        </div>

        {!isCollapsed && (
          <div className="flex flex-wrap gap-2 ml-5">
            {Array.from(filteredRadii.entries()).map(([radius, count], index) => {
              const isRadiusSelected = isSelected && selectedProperty.value === radius;

              return (
                <div
                  key={index}
                  className={`flex items-center rounded px-2 py-1 text-xs cursor-pointer ${
                    isRadiusSelected ? "bg-blue-100 hover:bg-blue-200" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => highlightElementsWithProperty("borderRadii", radius)}
                  title={`Click to show ${selectedCategory === "all" ? "elements" : getCategoryDisplayName(selectedCategory)} with this property`}
                >
                  <span className="mr-1">{radius}</span>
                  <span className="ml-1 text-gray-500">({Math.round((count / totalCount) * 100)}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /**
   * Toggles the visibility of the color system dropdown menu
   */
  const toggleColorSystemMenu = () => {
    setColorSystemMenuOpen(!colorSystemMenuOpen);
  };

  /**
   * Selects a color system and closes the dropdown menu
   *
   * @param system The color system to select (rgb, hex, hsl, hsv)
   */
  const selectColorSystem = (system: ColorSystem) => {
    setSelectedColorSystem(system);
    setColorSystemMenuOpen(false);
  };

  /**
   * Toggles the collapsed state of a specific group
   *
   * @param group The group to toggle (backgroundColors, textColors, borderColors, borderRadii, categories)
   */
  const toggleGroupCollapse = (group: keyof typeof collapsedGroups) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  /**
   * Highlights elements with a specific property value and shows all elements using this style
   *
   * @param propertyType The type of property to match (backgroundColors, textColors, borderColors, borderRadii)
   * @param propertyValue The value of the property to match
   */
  const highlightElementsWithProperty = (
    propertyType: keyof Omit<typeof collapsedGroups, "categories">,
    propertyValue: string,
  ) => {
    // Find all elements with the specified property
    const matchingElements: Element[] = [];

    // Filter by category if one is selected
    const elementsToCheck =
      selectedCategory === "all"
        ? elementAnalysisResults
        : elementAnalysisResults.filter((result) => result.category === selectedCategory);

    elementsToCheck.forEach((result) => {
      let matches = false;

      switch (propertyType) {
        case "backgroundColors":
          matches = result.backgroundColor === propertyValue;
          break;
        case "textColors":
          matches = result.textColor === propertyValue;
          break;
        case "borderColors":
          matches = result.borderColor === propertyValue;
          break;
        case "borderRadii":
          matches = result.borderRadius === propertyValue;
          break;
      }

      if (matches) {
        matchingElements.push(result.element);
      }
    });

    if (matchingElements.length === 0) return;

    // Update selected property state
    setSelectedProperty({
      type: propertyType,
      value: propertyValue,
      elements: matchingElements,
    });

    // Collapse all groups except the current one
    setCollapsedGroups({
      backgroundColors: propertyType !== "backgroundColors",
      textColors: propertyType !== "textColors",
      borderColors: propertyType !== "borderColors",
      borderRadii: propertyType !== "borderRadii",
      categories: true, // Always collapse categories when highlighting properties
    });
  };

  /**
   * Navigates to the origin element and highlights it
   *
   * @param element The element to navigate to
   * @param isEditMode Whether the navigation is for editing (adds more prominent highlighting)
   */
  const navigateToElement = (element: Element, isEditMode: boolean = false) => {
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

      if (isEditMode) {
        // More prominent highlighting for edit mode
        htmlElement.style.outline = "3px solid rgba(220, 38, 38, 0.8)"; // Red outline
        htmlElement.style.outlineOffset = "3px";
        htmlElement.style.backgroundColor = "rgba(254, 202, 202, 0.2)"; // Light red background
        htmlElement.style.position = "relative";
        htmlElement.style.zIndex = "9999";

        // Flash effect for edit mode
        let flashCount = 0;
        const flashInterval = setInterval(() => {
          if (flashCount >= 4) {
            // Flash twice (on-off-on-off)
            clearInterval(flashInterval);
            return;
          }

          htmlElement.style.outline =
            flashCount % 2 === 0
              ? "3px solid rgba(220, 38, 38, 0.8)" // Red
              : "3px solid rgba(59, 130, 246, 0.8)"; // Blue

          flashCount++;
        }, 300);
      } else {
        // Standard highlighting for view mode
        htmlElement.style.outline = "3px solid rgba(59, 130, 246, 0.7)";
        htmlElement.style.outlineOffset = "2px";
      }

      // Remove highlight after a delay
      setTimeout(
        () => {
          // Restore original styles
          htmlElement.style.outline = originalStyles.outline;
          htmlElement.style.outlineOffset = originalStyles.outlineOffset;
          htmlElement.style.backgroundColor = originalStyles.backgroundColor;
          htmlElement.style.transition = originalStyles.transition;
          htmlElement.style.zIndex = originalStyles.zIndex;
          htmlElement.style.position = originalStyles.position;
        },
        isEditMode ? 3000 : 2000,
      ); // Longer highlight for edit mode
    } catch (err) {
      console.error("Error navigating to element:", err);
    }
  };

  return (
    <div className="bg-gray-100 p-3 rounded-md mb-4">
      <h3 className="text-md font-medium mb-2 flex items-center gap-2">
        <IconColorSwatch size={18} />
        UI Element Style Analysis
      </h3>

      {aggregatedProperties.totalElements === 0 ? (
        <p className="text-sm text-gray-600">No UI elements found on this page.</p>
      ) : (
        <div className="text-sm">
          <div className="mb-2 pb-2 border-b border-gray-200 flex justify-between items-center">
            <span className="font-medium">Found {aggregatedProperties.totalElements} UI elements</span>
            {aggregatedProperties.readabilityIssues > 0 && (
              <span className="ml-2 text-amber-600">
                ({aggregatedProperties.readabilityIssues} with readability issues)
              </span>
            )}

            {/* Color System Selector */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 active:bg-gray-100 active:opacity-90"
                onClick={toggleColorSystemMenu}
              >
                <span>Color Format: {colorSystems.find((cs) => cs.value === selectedColorSystem)?.label}</span>
                <IconChevronDown
                  size={14}
                  className={`transition-transform ${colorSystemMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {colorSystemMenuOpen && (
                <div className="absolute right-0 mt-1 bg-white rounded shadow-md border border-gray-200 z-10">
                  {colorSystems.map((system) => (
                    <button
                      key={system.value}
                      className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 active:bg-gray-100 ${
                        selectedColorSystem === system.value ? "bg-gray-100 font-medium" : ""
                      }`}
                      onClick={() => selectColorSystem(system.value)}
                    >
                      {system.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Element Categories */}
          {renderCategoryList()}

          {renderColorCollection(
            aggregatedProperties.backgroundColors,
            "Background Colors",
            <IconPalette size={16} />,
            "backgroundColors",
          )}

          {renderColorCollection(
            aggregatedProperties.textColors,
            "Text Colors",
            <IconColorSwatch size={16} />,
            "textColors",
          )}

          {renderColorCollection(
            aggregatedProperties.borderColors,
            "Border Colors",
            <IconBorderStyle size={16} />,
            "borderColors",
          )}

          {renderBorderRadiusCollection(aggregatedProperties.borderRadii)}

          {/* Display elements using the selected style */}
          {selectedProperty.type && selectedProperty.value && selectedProperty.elements.length > 0 && (
            <div className="mt-3 p-2 bg-white rounded border border-gray-200">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <span>
                  {selectedCategory === "all" ? "Elements" : getCategoryDisplayName(selectedCategory)} using this{" "}
                  {selectedProperty.type === "backgroundColors"
                    ? "background color"
                    : selectedProperty.type === "textColors"
                      ? "text color"
                      : selectedProperty.type === "borderColors"
                        ? "border color"
                        : "border radius"}
                </span>
                <span className="ml-2 text-xs text-gray-500">({selectedProperty.elements.length} elements)</span>
              </h4>

              {/* Preview chips - compact view of elements */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedProperty.elements.slice(0, 5).map((element, index) => {
                  // Get element text content or a fallback
                  const elementText = element.textContent?.trim() || `Element ${index + 1}`;

                  // Find the matching element analysis result to get original styles
                  const elementResult = elementAnalysisResults.find((result) => result.element === element);

                  // Apply original styles for all property types
                  const applyOriginalStyles = elementResult !== undefined;

                  // Style object for the element
                  const elementStyle: React.CSSProperties = applyOriginalStyles
                    ? {
                        backgroundColor: elementResult.backgroundColor,
                        color: elementResult.textColor,
                        borderColor: elementResult.borderColor,
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderRadius: elementResult.borderRadius,
                      }
                    : {};

                  // Determine text color class based on background lightness
                  const textColorClass =
                    applyOriginalStyles && elementResult.isLightBackground
                      ? "text-gray-800"
                      : applyOriginalStyles
                        ? "text-white"
                        : "";

                  // Get category display for the element
                  const category = elementResult?.category || "other";
                  const categoryIcon = getCategoryIcon(category);

                  return (
                    <button
                      key={index}
                      className={`px-2 py-1 text-xs ${applyOriginalStyles ? textColorClass : "bg-gray-50 text-gray-800"} rounded border hover:opacity-90 active:opacity-80 active:brightness-95 ${!applyOriginalStyles ? "border-gray-200 hover:bg-gray-100 active:bg-gray-200" : ""}`}
                      style={elementStyle}
                      onClick={() => navigateToElement(element)}
                      title={`Click to navigate to this ${getCategoryDisplayName(category).toLowerCase()}`}
                    >
                      <span className="flex items-center gap-1">
                        {categoryIcon}
                        {elementText.length > 20 ? `${elementText.substring(0, 20)}...` : elementText}
                      </span>
                    </button>
                  );
                })}
                {selectedProperty.elements.length > 5 && (
                  <span className="text-xs text-gray-500 self-center">
                    +{selectedProperty.elements.length - 5} more
                  </span>
                )}
              </div>

              {/* Used by section - detailed list of elements with copy and edit functionality */}
              <div className="mt-4 border-t border-gray-200 pt-3">
                <h5 className="text-sm font-medium mb-2">Used by:</h5>
                <ul className="space-y-2">
                  {selectedProperty.elements.map((element, index) => {
                    // Get element selector information
                    const id = element.id ? `#${element.id}` : "";
                    const classes = Array.from(element.classList)
                      .map((c) => `.${c}`)
                      .join(", ");
                    const tagName = element.tagName.toLowerCase();

                    // Determine the best selector to display
                    let selector = id || (classes ? classes.split(",")[0] : tagName);

                    // Get context information (parent element or nearby heading)
                    let context = "";

                    // Try to get context from parent with ID or class
                    const findContext = (el: Element): string => {
                      // Check if element has a form parent
                      const formParent = el.closest("form");
                      if (formParent) {
                        const formName = formParent.getAttribute("name") || formParent.id || "Form";
                        return formName;
                      }

                      // Check for nearby heading
                      const heading = el.closest("section")?.querySelector("h1, h2, h3, h4, h5, h6");
                      if (heading) {
                        return heading.textContent?.trim() || "";
                      }

                      // Check for parent with ID or meaningful class
                      let parent = el.parentElement;
                      while (parent) {
                        if (parent.id) {
                          return parent.id;
                        }

                        // Check for semantic classes
                        const parentClasses = Array.from(parent.classList);
                        const meaningfulClass = parentClasses.find(
                          (c) =>
                            c.includes("header") ||
                            c.includes("footer") ||
                            c.includes("nav") ||
                            c.includes("main") ||
                            c.includes("sidebar") ||
                            c.includes("container") ||
                            c.includes("section") ||
                            c.includes("hero"),
                        );

                        if (meaningfulClass) {
                          return meaningfulClass;
                        }

                        parent = parent.parentElement;
                      }

                      return "";
                    };

                    context = findContext(element);

                    // Copy selector to clipboard
                    const copySelector = (e: React.MouseEvent) => {
                      e.stopPropagation();

                      try {
                        navigator.clipboard
                          .writeText(selector)
                          .then(() => {
                            // Show feedback on success
                            const button = e.currentTarget as HTMLButtonElement;
                            const originalText = button.textContent;
                            button.textContent = "Copied!";
                            button.disabled = true;

                            setTimeout(() => {
                              button.textContent = originalText;
                              button.disabled = false;
                            }, 1500);
                          })
                          .catch((err) => {
                            console.error("Failed to copy: ", err);
                            // Show error feedback
                            const button = e.currentTarget as HTMLButtonElement;
                            const originalText = button.textContent;
                            button.textContent = "Failed!";
                            button.className += " bg-red-100 text-red-700";

                            setTimeout(() => {
                              button.textContent = originalText;
                              button.className = button.className.replace(" bg-red-100 text-red-700", "");
                            }, 1500);
                          });
                      } catch (err) {
                        console.error("Copy not supported: ", err);
                        alert("Copy to clipboard is not supported in your browser");
                      }
                    };

                    return (
                      <li key={index} className="flex items-start">
                        <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <code className="text-xs font-mono">{selector}</code>
                            <div className="flex gap-1">
                              <button
                                className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded"
                                onClick={copySelector}
                                title="Copy selector"
                              >
                                Copy
                              </button>
                              <button
                                className="text-xs px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToElement(element, true); // Pass true for edit mode
                                }}
                                title="Navigate to element and highlight it for editing"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          {context && <div className="text-xs text-gray-500 mt-1">({context})</div>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {aggregatedProperties.readabilityIssues > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              <IconAlertTriangle size={14} className="inline mr-1" />
              {aggregatedProperties.readabilityIssues} elements have contrast issues that may affect readability.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorAnalysis;