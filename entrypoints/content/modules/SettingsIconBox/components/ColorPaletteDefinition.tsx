import React, { useState, useEffect } from "react";
import {
  IconPalette,
  IconChevronDown,
  IconChevronRight,
  IconColorSwatch,
  IconEye,
  IconColorPicker
} from "@tabler/icons-react";
import { 
  getColorInAllFormats, 
  analyzeButtonColors, 
  isLightColor 
} from "@entrypoints/shared/utils/colorAnalysis";
import { 
  categorizeAllElements, 
  ElementCategory 
} from "@entrypoints/shared/utils/categorizeElements";

// Type for color system options
type ColorSystem = 'rgb' | 'hex' | 'hsl' | 'hsv';

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
  primary: PaletteColor[];
  secondary: PaletteColor[];
  tertiary: PaletteColor[];
  neutral: PaletteColor[];
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
const ColorPaletteDefinition: React.FC = () => {
  // Default palette with some initial colors based on design guidelines
  const defaultPalette: ColorPalette = {
    primary: [
      { id: "p1", color: "#15803d", name: "Primary Green" }
    ],
    secondary: [
      { id: "s1", color: "#3aca70", name: "Secondary Green" }
    ],
    tertiary: [],
    neutral: [
      { id: "n1", color: "#374151", name: "Text Gray" },
      { id: "n2", color: "#ffffff", name: "Background White" }
    ]
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
    totalColorsFound: 0
  });

  // Color system state
  const [selectedColorSystem, setSelectedColorSystem] = useState<ColorSystem>('hex');
  const [colorSystemMenuOpen, setColorSystemMenuOpen] = useState<boolean>(false);

  // State to track which color is selected
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  // Collapsible groups state
  const [collapsedGroups, setCollapsedGroups] = useState<{
    primary: boolean;
    secondary: boolean;
    tertiary: boolean;
    neutral: boolean;
  }>({
    primary: false,
    secondary: false,
    tertiary: false,
    neutral: false
  });

  // Available color system options
  const colorSystems: { value: ColorSystem; label: string }[] = [
    { value: 'rgb', label: 'RGB' },  // RGB format (e.g., rgb(255, 0, 0))
    { value: 'hex', label: 'HEX' },  // Hexadecimal format (e.g., #FF0000)
    { value: 'hsl', label: 'HSL' },  // HSL format (e.g., hsl(0, 100%, 50%))
    { value: 'hsv', label: 'HSV' }   // HSV format (e.g., hsv(0, 100%, 100%))
  ];

  // Extract colors from page elements and categorize them
  const extractColorsFromPage = () => {
    setExtractionStatus(prev => ({ ...prev, isExtracting: true }));
    
    try {
      // Get all categorized elements from the page
      const categorizedElements = categorizeAllElements();
      
      // Maps to store colors and their frequencies
      const backgroundColors = new Map<string, { count: number, elements: Element[], category: ElementCategory }>();
      const textColors = new Map<string, { count: number, elements: Element[], category: ElementCategory }>();
      const borderColors = new Map<string, { count: number, elements: Element[], category: ElementCategory }>();
      
      // Analyze each element
      categorizedElements.forEach(({ element, category }) => {
        const elementAnalysis = analyzeButtonColors(element);
        
        // Process background color
        if (elementAnalysis.backgroundColor !== "rgba(0, 0, 0, 0)" && 
            elementAnalysis.backgroundColor !== "transparent") {
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
        if (elementAnalysis.borderColor !== "rgba(0, 0, 0, 0)" && 
            elementAnalysis.borderColor !== "transparent") {
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
        totalColorsFound: backgroundColors.size + textColors.size + borderColors.size
      });
    } catch (error) {
      console.error('Error extracting colors from page:', error);
      setExtractionStatus(prev => ({ ...prev, isExtracting: false }));
    }
  };
  
  // Categorize colors into primary, secondary, tertiary, and neutral
  const categorizeColorsIntoPalette = (
    backgroundColors: Map<string, { count: number, elements: Element[], category: ElementCategory }>,
    textColors: Map<string, { count: number, elements: Element[], category: ElementCategory }>,
    borderColors: Map<string, { count: number, elements: Element[], category: ElementCategory }>
  ): ColorPalette => {
    const newPalette: ColorPalette = {
      primary: [],
      secondary: [],
      tertiary: [],
      neutral: []
    };
    
    // Helper function to add a color to the palette
    const addColorToPalette = (
      color: string, 
      count: number, 
      elements: Element[], 
      category: keyof ColorPalette,
      name: string
    ) => {
      const id = `${category[0]}${newPalette[category].length + 1}`;
      newPalette[category].push({
        id,
        color,
        name,
        sourceElements: elements,
        frequency: count
      });
    };
    
    // Process background colors (most likely to be primary/secondary colors)
    const sortedBackgroundColors = Array.from(backgroundColors.entries())
      .sort((a, b) => b[1].count - a[1].count); // Sort by frequency
    
    // Primary colors: Most frequent background colors from primary buttons (max 3)
    const primaryButtonColors = sortedBackgroundColors
      .filter(([_, info]) => 
        info.category === 'primary-button' || 
        info.category === 'secondary-button' ||
        info.category === 'container'
      )
      .slice(0, 3);
    
    primaryButtonColors.forEach(([color, info]) => {
      // Convert to hex for consistency
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;
      
      // Generate a name based on the element category
      let name = "Primary Color";
      if (info.category === 'primary-button') name = "Primary Button";
      else if (info.category === 'secondary-button') name = "Secondary Button";
      else if (info.category === 'container') name = "Container";
      
      addColorToPalette(hexColor, info.count, info.elements, 'primary', name);
    });
    
    // Secondary colors: Next most frequent background colors
    const secondaryColors = sortedBackgroundColors
      .filter(([color]) => !primaryButtonColors.some(([c]) => c === color))
      .filter(([_, info]) => 
        info.category === 'tertiary-button' || 
        info.category === 'icon-button' ||
        info.category === 'navigation'
      )
      .slice(0, 4);
    
    secondaryColors.forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;
      
      let name = "Secondary Color";
      if (info.category === 'tertiary-button') name = "Tertiary Button";
      else if (info.category === 'icon-button') name = "Icon Button";
      else if (info.category === 'navigation') name = "Navigation";
      
      addColorToPalette(hexColor, info.count, info.elements, 'secondary', name);
    });
    
    // Tertiary colors: Less frequent but still significant colors
    const tertiaryColors = sortedBackgroundColors
      .filter(([color]) => 
        !primaryButtonColors.some(([c]) => c === color) && 
        !secondaryColors.some(([c]) => c === color)
      )
      .slice(0, 5);
    
    tertiaryColors.forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;
      
      let name = "Accent Color";
      if (info.category) {
        name = `${info.category.charAt(0).toUpperCase() + info.category.slice(1).replace(/-/g, ' ')}`;
      }
      
      addColorToPalette(hexColor, info.count, info.elements, 'tertiary', name);
    });
    
    // Neutral colors: Text colors and common background colors
    // Process text colors
    const sortedTextColors = Array.from(textColors.entries())
      .sort((a, b) => b[1].count - a[1].count);
    
    // Add most common text colors to neutral palette
    sortedTextColors.slice(0, 3).forEach(([color, info]) => {
      const colorFormats = getColorInAllFormats(color);
      const hexColor = colorFormats?.hex || color;
      
      addColorToPalette(hexColor, info.count, info.elements, 'neutral', "Text Color");
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
        const alreadyExists = newPalette.neutral.some(c => c.color === hexColor);
        if (!alreadyExists) {
          const isLight = isLightColor(color);
          addColorToPalette(
            hexColor, 
            info.count, 
            info.elements, 
            'neutral', 
            isLight ? "Background Light" : "Background Dark"
          );
        }
      });
    
    return newPalette;
  };

  // Load palette from localStorage on component mount
  useEffect(() => {
    const savedPalette = localStorage.getItem('colorPalette');
    if (savedPalette) {
      try {
        setColorPalette(JSON.parse(savedPalette));
      } catch (error) {
        console.error('Error loading saved color palette:', error);
      }
    }
  }, []);

  // Save palette to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('colorPalette', JSON.stringify(colorPalette));
  }, [colorPalette]);

  /**
   * Formats a color string based on the selected color system
   */
  const formatColor = (color: string): string => {
    if (selectedColorSystem === 'hex') {
      return color; // Most colors are stored in HEX format by default
    }

    // Convert the color to all formats
    const formattedColors = getColorInAllFormats(color);
    if (!formattedColors) return color; // Return original if conversion fails

    // Return the color in the selected format
    return formattedColors[selectedColorSystem];
  };

  /**
   * Toggles the visibility of the color system dropdown menu
   */
  const toggleColorSystemMenu = () => {
    setColorSystemMenuOpen(!colorSystemMenuOpen);
  };

  /**
   * Selects a color system and closes the dropdown menu
   */
  const selectColorSystem = (system: ColorSystem) => {
    setSelectedColorSystem(system);
    setColorSystemMenuOpen(false);
  };

  /**
   * Toggles the collapsed state of a specific group
   */
  const toggleGroupCollapse = (group: keyof typeof collapsedGroups) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
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
        console.warn('Element is no longer in the DOM');
        return;
      }
      
      // Scroll to the element
      element.scrollIntoView({behavior: 'smooth', block: 'center'});

      // Store original styles
      const htmlElement = element as HTMLElement;
      const originalStyles = {
        outline: htmlElement.style.outline,
        outlineOffset: htmlElement.style.outlineOffset,
        backgroundColor: htmlElement.style.backgroundColor,
        transition: htmlElement.style.transition,
        zIndex: htmlElement.style.zIndex,
        position: htmlElement.style.position
      };

      // Add highlight effect
      htmlElement.style.transition = 'all 0.3s ease-in-out';
      htmlElement.style.outline = '3px solid rgba(59, 130, 246, 0.7)';
      htmlElement.style.outlineOffset = '2px';

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
      console.error('Error navigating to element:', err);
    }
  };

  /**
   * Renders a color category section for neutral colors
   */
  const renderNeutralColorCategory = (
    title: string,
    description: string
  ) => {
    const colors = colorPalette.neutral;
    const isCollapsed = collapsedGroups.neutral;

    // Handle color square click
    const handleColorClick = (colorId: string) => {
      setSelectedColorId(selectedColorId === colorId ? null : colorId);
    };

    return (
      <div className="mb-8">
        <div 
          className="font-medium mb-2 flex items-center gap-2 cursor-pointer hover:text-gray-700 transition-colors duration-200"
          onClick={() => toggleGroupCollapse('neutral')}
        >
          {isCollapsed ? 
            <IconChevronRight size={18} className="text-gray-500" /> : 
            <IconChevronDown size={18} className="text-gray-500" />
          }
          <IconColorSwatch size={20} className="text-gray-700" />
          <span className="text-lg">{title}</span>
        </div>
        
        {!isCollapsed && (
          <>
            <p className="text-sm text-gray-600 ml-8 mb-3 leading-relaxed">{description}</p>
            
            <div className="ml-8 space-y-6">
              {/* Display colors */}
              {colors.map(color => (
                <div key={color.id} className="flex flex-col gap-2">
                  <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition-colors duration-200">
                    <div className="flex items-center gap-3 p-3">
                      {/* Larger, clickable color square */}
                      <div 
                        className={`w-14 h-14 rounded-md border cursor-pointer transition-all duration-200 ${selectedColorId === color.id ? 'border-gray-500 shadow-lg scale-105' : 'border-gray-300 shadow-inner hover:shadow-md hover:scale-105'}`}
                        style={{ backgroundColor: color.color }}
                        title={formatColor(color.color)}
                        onClick={() => handleColorClick(color.id)}
                      />
                      <span className="flex-1 text-base font-medium">{color.name}</span>
                      <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{formatColor(color.color)}</span>
                      
                      {/* Show frequency if available */}
                      {color.frequency && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700 font-medium border border-gray-200">
                          {color.frequency}x
                        </span>
                      )}
                    </div>
                    
                    {/* Color information section - shown when color is selected */}
                    {selectedColorId === color.id && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <h4 className="text-sm font-semibold mb-2 text-gray-800">Color Information</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">HEX</p>
                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.hex || color.color}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">RGB</p>
                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.rgb || ''}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">HSL</p>
                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.hsl || ''}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">HSV</p>
                            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.hsv || ''}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          <p className="mb-1"><strong>Contrast ratio with white:</strong> {getColorInAllFormats(color.color)?.contrastWithWhite?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Contrast ratio with black:</strong> {getColorInAllFormats(color.color)?.contrastWithBlack?.toFixed(2) || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Source elements section */}
                    {color.sourceElements && color.sourceElements.length > 0 && (
                      <div className={`border-t border-gray-100 p-3 ${selectedColorId === color.id ? 'bg-gray-100' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <IconEye size={16} className="text-gray-700" />
                          <div className="text-sm text-gray-700 font-medium">
                            Found in {color.sourceElements.length} elements
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {color.sourceElements.slice(0, 5).map((element, idx) => {
                            // Helper function to safely get className as a string
                            const getClassNameAsString = (el: Element): string => {
                              const className = el.className;
                              // Handle SVGAnimatedString for SVG elements
                              if (className && typeof className === 'object' && 'baseVal' in className) {
                                return className.baseVal;
                              }
                              // Handle regular string className
                              return typeof className === 'string' ? className : '';
                            };
                            
                            const tagName = element.tagName?.toLowerCase();
                            const className = getClassNameAsString(element) ? `.${getClassNameAsString(element).split(' ')[0]}` : '';
                            const id = element.id ? `#${element.id}` : '';
                            const displayName = id || className || tagName;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => navigateToElement(element)}
                                className="text-xs bg-white px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200 flex items-center gap-1"
                                title="Click to navigate to this element"
                              >
                                <IconEye size={12} className="text-gray-600" />
                                {displayName}
                              </button>
                            );
                          })}
                          {color.sourceElements.length > 5 && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 border border-gray-200">
                              +{color.sourceElements.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };
  
  /**
   * Renders all colors with category tags
   */
  const renderColorsWithTags = () => {
    // Combine primary, secondary, and tertiary colors
    const allColors = [
      ...colorPalette.primary.map(color => ({ ...color, category: 'primary' })),
      ...colorPalette.secondary.map(color => ({ ...color, category: 'secondary' })),
      ...colorPalette.tertiary.map(color => ({ ...color, category: 'tertiary' }))
    ];
    
    // Get category display names
    const getCategoryName = (category: string): string => {
      switch(category) {
        case 'primary': return 'Primary';
        case 'secondary': return 'Secondary';
        case 'tertiary': return 'Tertiary';
        default: return category;
      }
    };
    
    // Get category tag color
    const getCategoryTagColor = (category: string): string => {
      switch(category) {
        case 'primary': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'secondary': return 'bg-green-100 text-green-800 border-green-200';
        case 'tertiary': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    // Handle color square click
    const handleColorClick = (colorId: string) => {
      setSelectedColorId(selectedColorId === colorId ? null : colorId);
    };
    
    return (
      <div className="mb-8">
        <div className="font-medium mb-3 flex items-center gap-2">
          <IconColorSwatch size={20} className="text-blue-600" />
          <span className="text-lg">Color Palette</span>
        </div>
        
        <div className="space-y-6 ml-2">
          {allColors.map(color => (
            <div key={color.id} className="flex flex-col gap-2">
              <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition-colors duration-200">
                <div className="flex items-center gap-3 p-3">
                  {/* Larger, clickable color square */}
                  <div 
                    className={`w-14 h-14 rounded-md border cursor-pointer transition-all duration-200 ${selectedColorId === color.id ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-300 shadow-inner hover:shadow-md hover:scale-105'}`}
                    style={{ backgroundColor: color.color }}
                    title={formatColor(color.color)}
                    onClick={() => handleColorClick(color.id)}
                  />
                  <span className="flex-1 text-base font-medium">{color.name}</span>
                  
                  {/* Category tag */}
                  <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryTagColor(color.category)} font-medium`}>
                    {getCategoryName(color.category)}
                  </span>
                  
                  <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{formatColor(color.color)}</span>
                  
                  {/* Show frequency if available */}
                  {color.frequency && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700 font-medium border border-gray-200">
                      {color.frequency}x
                    </span>
                  )}
                </div>
                
                {/* Color information section - shown when color is selected */}
                {selectedColorId === color.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-2 text-gray-800">Color Information</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">HEX</p>
                        <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.hex || color.color}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">RGB</p>
                        <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.rgb || ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">HSL</p>
                        <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.hsl || ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">HSV</p>
                        <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{getColorInAllFormats(color.color)?.hsv || ''}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <p className="mb-1"><strong>Contrast ratio with white:</strong> {getColorInAllFormats(color.color)?.contrastWithWhite?.toFixed(2) || 'N/A'}</p>
                      <p><strong>Contrast ratio with black:</strong> {getColorInAllFormats(color.color)?.contrastWithBlack?.toFixed(2) || 'N/A'}</p>
                    </div>
                  </div>
                )}
                
                {/* Source elements section */}
                {color.sourceElements && color.sourceElements.length > 0 && (
                  <div className={`border-t border-gray-100 p-3 ${selectedColorId === color.id ? 'bg-gray-100' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <IconEye size={16} className="text-blue-600" />
                      <div className="text-sm text-gray-700 font-medium">
                        Found in {color.sourceElements.length} elements
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {color.sourceElements.slice(0, 5).map((element, idx) => {
                        const tagName = element.tagName?.toLowerCase();
                        const className = element.className ? `.${element.className.split(' ')[0]}` : '';
                        const id = element.id ? `#${element.id}` : '';
                        const displayName = id || className || tagName;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => navigateToElement(element)}
                            className="text-xs bg-white px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 flex items-center gap-1"
                            title="Click to navigate to this element"
                          >
                            <IconEye size={12} className="text-blue-500" />
                            {displayName}
                          </button>
                        );
                      })}
                      {color.sourceElements.length > 5 && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 border border-gray-200">
                          +{color.sourceElements.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // This duplicate useEffect has been removed as it's already handled above

  // Navigate to a source element
  // const navigateToElement = (element: Element) => {
  //   try {
  //     // Check if element is still in the DOM
  //     if (!document.contains(element)) {
  //       console.warn('Element is no longer in the DOM');
  //       return;
  //     }
  //
  //     // Scroll to the element
  //     element.scrollIntoView({behavior: 'smooth', block: 'center'});
  //
  //     // Store original styles
  //     const htmlElement = element as HTMLElement;
  //     const originalStyles = {
  //       outline: htmlElement.style.outline,
  //       outlineOffset: htmlElement.style.outlineOffset,
  //       backgroundColor: htmlElement.style.backgroundColor,
  //       transition: htmlElement.style.transition,
  //       zIndex: htmlElement.style.zIndex,
  //       position: htmlElement.style.position
  //     };
  //
  //     // Add highlight effect
  //     htmlElement.style.transition = 'all 0.3s ease-in-out';
  //     htmlElement.style.outline = '3px solid rgba(59, 130, 246, 0.7)';
  //     htmlElement.style.outlineOffset = '2px';
  //
  //     // Remove highlight after a delay
  //     setTimeout(() => {
  //       // Restore original styles
  //       htmlElement.style.outline = originalStyles.outline;
  //       htmlElement.style.outlineOffset = originalStyles.outlineOffset;
  //       htmlElement.style.backgroundColor = originalStyles.backgroundColor;
  //       htmlElement.style.transition = originalStyles.transition;
  //       htmlElement.style.zIndex = originalStyles.zIndex;
  //       htmlElement.style.position = originalStyles.position;
  //     }, 2000);
  //   } catch (err) {
  //     console.error('Error navigating to element:', err);
  //   }
  // };

  return (
    <div className="bg-white p-5 rounded-lg mb-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <IconPalette size={24} className="text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-800">Color Palette Definition</h3>
        </div>
        
        {/* Color System Selector */}
        <div className="relative">
          <button
            className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors duration-200 shadow-sm"
            onClick={toggleColorSystemMenu}
          >
            <IconColorPicker size={16} className="text-purple-500" />
            <span className="font-medium">Format: {colorSystems.find(cs => cs.value === selectedColorSystem)?.label}</span>
            <IconChevronDown size={16} className={`transition-transform text-gray-500 ${colorSystemMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {colorSystemMenuOpen && (
            <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden">
              {colorSystems.map((system) => (
                <button
                  key={system.value}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-purple-50 active:bg-purple-100 transition-colors duration-150 ${
                    selectedColorSystem === system.value ? 'bg-purple-100 font-medium text-purple-700' : 'text-gray-700'
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

      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        Define and analyze the color palette used on your page. Colors are categorized into primary, secondary, tertiary, and neutral groups based on their usage.
      </p>

      <div className="text-sm">
        {/* Render primary, secondary, and tertiary colors with category tags */}
        {renderColorsWithTags()}
        
        {/* Render neutral colors separately */}
        {renderNeutralColorCategory(
          'Neutral Colors', 
          'These are used for text, backgrounds, borders, and other UI elements. They help create hierarchy and improve readability.'
        )}
      </div>
    </div>
  );
};

export default ColorPaletteDefinition;