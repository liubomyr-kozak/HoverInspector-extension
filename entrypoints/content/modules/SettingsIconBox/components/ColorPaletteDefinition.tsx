import React, { useState, useEffect } from "react";
import { 
  IconPalette, 
  IconPlus, 
  IconTrash, 
  IconEdit, 
  IconChevronDown, 
  IconChevronRight,
  IconCheck,
  IconX,
  IconRefresh,
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
  
  // State for the color being edited
  const [editingColor, setEditingColor] = useState<{
    category: keyof ColorPalette;
    color: PaletteColor | null;
  }>({
    category: "primary",
    color: null
  });

  // State for the new color being added
  const [newColor, setNewColor] = useState<{
    color: string;
    name: string;
  }>({
    color: "#000000",
    name: ""
  });

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

  /**
   * Adds a new color to the specified category
   */
  const addColor = (category: keyof ColorPalette) => {
    // Check if we're at the maximum for primary colors (3)
    if (category === 'primary' && colorPalette.primary.length >= 3) {
      alert('You can only have a maximum of 3 primary colors.');
      return;
    }

    if (!newColor.name.trim()) {
      alert('Please enter a name for the color.');
      return;
    }

    const updatedPalette = { ...colorPalette };
    const newId = `${category[0]}${updatedPalette[category].length + 1}`;
    
    updatedPalette[category] = [
      ...updatedPalette[category],
      { id: newId, color: newColor.color, name: newColor.name.trim() }
    ];
    
    setColorPalette(updatedPalette);
    setNewColor({ color: "#000000", name: "" });
    setEditingColor({ category, color: null });
  };

  /**
   * Removes a color from the palette
   */
  const removeColor = (category: keyof ColorPalette, id: string) => {
    const updatedPalette = { ...colorPalette };
    updatedPalette[category] = updatedPalette[category].filter(color => color.id !== id);
    setColorPalette(updatedPalette);
  };

  /**
   * Updates an existing color in the palette
   */
  const updateColor = (category: keyof ColorPalette, id: string, updatedColor: Partial<PaletteColor>) => {
    const updatedPalette = { ...colorPalette };
    updatedPalette[category] = updatedPalette[category].map(color => 
      color.id === id ? { ...color, ...updatedColor } : color
    );
    setColorPalette(updatedPalette);
  };

  /**
   * Starts editing a color
   */
  const startEditing = (category: keyof ColorPalette, color: PaletteColor) => {
    setEditingColor({ category, color });
    setNewColor({ color: color.color, name: color.name });
  };

  /**
   * Saves the edited color
   */
  const saveEditedColor = () => {
    if (!editingColor.color || !newColor.name.trim()) {
      alert('Please enter a name for the color.');
      return;
    }

    updateColor(editingColor.category, editingColor.color.id, {
      color: newColor.color,
      name: newColor.name.trim()
    });

    setEditingColor({ category: "primary", color: null });
    setNewColor({ color: "#000000", name: "" });
  };

  /**
   * Cancels the current edit operation
   */
  const cancelEdit = () => {
    setEditingColor({ category: "primary", color: null });
    setNewColor({ color: "#000000", name: "" });
  };

  // Run extraction on component mount if no colors are defined
  useEffect(() => {
    // Check if we have any colors defined
    const hasDefinedColors = 
      colorPalette.primary.length > 0 || 
      colorPalette.secondary.length > 0 || 
      colorPalette.tertiary.length > 0 || 
      colorPalette.neutral.length > 0;
    
    // If no colors are defined and we haven't extracted before, extract colors
    if (!hasDefinedColors && !extractionStatus.lastExtracted) {
      extractColorsFromPage();
    }
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
   * Renders a color category section
   */
  const renderColorCategory = (
    category: keyof ColorPalette,
    title: string,
    description: string
  ) => {
    const colors = colorPalette[category];
    const isCollapsed = collapsedGroups[category];
    const isEditing = editingColor.category === category && editingColor.color === null;
    const isPrimary = category === 'primary';
    const maxReached = isPrimary && colors.length >= 3;

    return (
      <div className="mb-6">
        <div 
          className="font-medium mb-1 flex items-center gap-1 cursor-pointer"
          onClick={() => toggleGroupCollapse(category)}
        >
          {isCollapsed ? 
            <IconChevronRight size={16} className="text-gray-500" /> : 
            <IconChevronDown size={16} className="text-gray-500" />
          }
          <IconPalette size={16} />
          {title} {isPrimary && `(${colors.length}/3)`}
        </div>
        
        {!isCollapsed && (
          <>
            <p className="text-xs text-gray-600 ml-6 mb-2">{description}</p>
            
            <div className="ml-6 space-y-2">
              {/* Existing colors */}
              {colors.map(color => {
                const isEditingThisColor = editingColor.color?.id === color.id && editingColor.category === category;
                
                return (
                  <div key={color.id} className="flex items-center gap-2">
                    {isEditingThisColor ? (
                      // Edit mode
                      <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <input 
                          type="color" 
                          value={newColor.color}
                          onChange={(e) => setNewColor({ ...newColor, color: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={newColor.name}
                          onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                          placeholder="Color name"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button 
                          onClick={saveEditedColor}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <IconCheck size={18} />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Cancel"
                        >
                          <IconX size={18} />
                        </button>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200">
                        <div className="flex items-center gap-2 p-2">
                          <div 
                            className="w-8 h-8 rounded border border-gray-300" 
                            style={{ backgroundColor: color.color }}
                            title={formatColor(color.color)}
                          />
                          <span className="flex-1 text-sm">{color.name}</span>
                          <span className="text-xs text-gray-500">{formatColor(color.color)}</span>
                          
                          {/* Show frequency if available */}
                          {color.frequency && (
                            <span className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                              {color.frequency}x
                            </span>
                          )}
                          
                          <button 
                            onClick={() => startEditing(category, color)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <IconEdit size={18} />
                          </button>
                          <button 
                            onClick={() => removeColor(category, color.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            <IconTrash size={18} />
                          </button>
                        </div>
                        
                        {/* Source elements section */}
                        {color.sourceElements && color.sourceElements.length > 0 && (
                          <div className="border-t border-gray-100 p-2 bg-gray-50">
                            <div className="text-xs text-gray-500 mb-1">
                              Found in {color.sourceElements.length} elements:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {color.sourceElements.slice(0, 5).map((element, idx) => {
                                const tagName = element.tagName?.toLowerCase();
                                const className = element.className ? `.${element.className.split(' ')[0]}` : '';
                                const id = element.id ? `#${element.id}` : '';
                                const displayName = id || className || tagName;
                                
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => navigateToElement(element)}
                                    className="text-xs bg-white px-1 py-0.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                                    title="Click to navigate to this element"
                                  >
                                    {displayName}
                                  </button>
                                );
                              })}
                              {color.sourceElements.length > 5 && (
                                <span className="text-xs text-gray-500">
                                  +{color.sourceElements.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Add new color form */}
              {isEditing ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                  <input 
                    type="color" 
                    value={newColor.color}
                    onChange={(e) => setNewColor({ ...newColor, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={newColor.name}
                    onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                    placeholder="Color name"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button 
                    onClick={() => addColor(category)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Add"
                  >
                    <IconCheck size={18} />
                  </button>
                  <button 
                    onClick={cancelEdit}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Cancel"
                  >
                    <IconX size={18} />
                  </button>
                </div>
              ) : (
                !maxReached && (
                  <button 
                    onClick={() => setEditingColor({ category, color: null })}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 p-1"
                  >
                    <IconPlus size={16} />
                    Add {category} color
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Run extraction on component mount if no colors are defined
  useEffect(() => {
    // Check if we have any colors defined
    const hasDefinedColors = 
      colorPalette.primary.length > 0 || 
      colorPalette.secondary.length > 0 || 
      colorPalette.tertiary.length > 0 || 
      colorPalette.neutral.length > 0;
    
    // If no colors are defined and we haven't extracted before, extract colors
    if (!hasDefinedColors && !extractionStatus.lastExtracted) {
      extractColorsFromPage();
    }
  }, []);

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
    <div className="bg-gray-100 p-3 rounded-md mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-medium flex items-center gap-2">
          <IconPalette size={18} />
          Define Your Color Palette
        </h3>

        <div className="flex items-center gap-2">
          {/* Extract Colors Button */}
          <button
            className={`flex items-center gap-1 text-xs px-3 py-1 rounded ${
              extractionStatus.isExtracting 
                ? 'bg-blue-100 text-blue-700 cursor-wait' 
                : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
            }`}
            onClick={extractColorsFromPage}
            disabled={extractionStatus.isExtracting}
            title="Extract colors from page elements"
          >
            <IconColorPicker size={14} />
            {extractionStatus.isExtracting ? 'Extracting...' : 'Extract Colors'}
          </button>

          {/* Color System Selector */}
          <div className="relative">
            <button
              className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 active:bg-gray-100 active:opacity-90"
              onClick={toggleColorSystemMenu}
            >
              <span>Format: {colorSystems.find(cs => cs.value === selectedColorSystem)?.label}</span>
              <IconChevronDown size={14} className={`transition-transform ${colorSystemMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {colorSystemMenuOpen && (
              <div className="absolute right-0 mt-1 bg-white rounded shadow-md border border-gray-200 z-10">
                {colorSystems.map((system) => (
                  <button
                    key={system.value}
                    className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 active:bg-gray-100 ${
                      selectedColorSystem === system.value ? 'bg-gray-100 font-medium' : ''
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
      </div>

      <div className="text-sm">
        {extractionStatus.lastExtracted ? (
          <div className="bg-blue-50 border border-blue-100 rounded p-2 mb-4 text-xs text-blue-700">
            <div className="flex items-center justify-between">
              <span>
                <IconRefresh size={14} className="inline mr-1" />
                Colors extracted from page elements
              </span>
              <span className="text-blue-500">
                {extractionStatus.totalElementsAnalyzed} elements analyzed, 
                {extractionStatus.totalColorsFound} colors found
              </span>
            </div>
            <div className="mt-1 text-xs text-blue-600">
              Click on a color to see details and source elements. You can also manually edit colors.
            </div>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">
            Color plays a vital part in how your website and your brand are perceived and remembered. 
            Extract colors from page elements or manually define your essential primary colors (maximum of three), 
            along with secondary, tertiary, and neutral colors.
          </p>
        )}

        {renderColorCategory(
          'primary', 
          'Primary Colors', 
          'These are your main brand colors. Use them for key elements like logos, primary buttons, and important UI elements. Limit to 3 colors maximum.'
        )}
        
        {renderColorCategory(
          'secondary', 
          'Secondary Colors', 
          'These complement your primary colors and can be used for secondary buttons, accents, and supporting elements.'
        )}
        
        {renderColorCategory(
          'tertiary', 
          'Tertiary Colors', 
          'These provide additional options for specific UI needs, illustrations, or to add variety to your design.'
        )}
        
        {renderColorCategory(
          'neutral', 
          'Neutral Colors', 
          'These are used for text, backgrounds, borders, and other UI elements. They help create hierarchy and improve readability.'
        )}
      </div>
    </div>
  );
};

export default ColorPaletteDefinition;