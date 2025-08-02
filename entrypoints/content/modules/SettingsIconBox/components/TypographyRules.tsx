/**
 * TypographyRules Component
 *
 * This component displays typography rules and analyzes typography elements on the page.
 * It provides different views for designers, users, and QA:
 * - Designers: Focus on typography guidelines and best practices
 * - Users: Focus on typography usage and consistency
 * - QA: Focus on typography issues and validation
 *
 * The component uses the typographyAnalysis utility to analyze typography elements
 * and display relevant information.
 */
import React, { useEffect, useState } from "react";
import { IconEye, IconLetterCase, IconRuler } from "@tabler/icons-react";

import {
  AggregatedTypographyProperties,
  aggregateTypographyProperties,
  getAllTypographyElements,
  TypographyElement,
} from "@entrypoints/shared/utils/typographyAnalysis";

const TypographyRules: React.FC = () => {
  // State for typography elements and properties
  const [typographyElements, setTypographyElements] = useState<TypographyElement[]>([]);
  const [aggregatedProperties, setAggregatedProperties] = useState<AggregatedTypographyProperties | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTypographyData = () => {
      setIsLoading(true);
      try {
        const elements = getAllTypographyElements();
        setTypographyElements(elements);

        const properties = aggregateTypographyProperties();
        setAggregatedProperties(properties);
      } catch (error) {
        console.error("Error fetching typography data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypographyData();

    // Set up a mutation observer to detect DOM changes and update the analysis
    const observer = new MutationObserver(() => {
      fetchTypographyData();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle element click to highlight it on the page
  const handleElementClick = (element: Element) => {
    // Default behavior: highlight the element
    const el = element as HTMLElement;
    const originalOutline = el.style.outline;
    const originalTransition = el.style.transition;
    const originalBoxShadow = el.style.boxShadow;

    el.style.outline = "2px solid #15803d";
    el.style.outlineOffset = "2px";
    el.style.transition = "all 0.25s ease-in-out";
    el.style.boxShadow = "0 0 8px 2px rgba(21, 128, 61, 0.8)";

    // Scroll the element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Reset styles after a delay
    setTimeout(() => {
      el.style.outline = originalOutline;
      el.style.transition = originalTransition;
      el.style.boxShadow = originalBoxShadow;
    }, 2000);
  };

  // Find elements with a specific font family
  const getElementsWithFontFamily = (family: string): TypographyElement[] => {
    return typographyElements.filter((el) => el.fontFamily === family);
  };

  // Find elements with a specific font size
  const getElementsWithFontSize = (size: string): TypographyElement[] => {
    return typographyElements.filter((el) => el.fontSize === size);
  };

  // Find elements with a specific font weight
  const getElementsWithFontWeight = (weight: string): TypographyElement[] => {
    return typographyElements.filter((el) => el.fontWeight === weight);
  };

  // Get a display name for an element
  const getElementDisplayName = (element: Element): string => {
    const tagName = element.tagName?.toLowerCase();
    const className =
      element.className && typeof element.className === "string" ? `.${element.className.split(" ")[0]}` : "";
    const id = element.id ? `#${element.id}` : "";
    return id || className || tagName;
  };

  // Render loading state
  if (isLoading) {
    return <div className="p-4 text-center">Loading typography analysis...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <IconLetterCase size={18} className="text-blue-500" />
          <h5 className="font-medium text-gray-800">Font Families</h5>
        </div>
        <div className="space-y-4">
          {Array.from(aggregatedProperties?.fontFamilies.entries() || []).map(([family, count], index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-blue-200 transition-colors duration-200"
            >
              <div className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-blue-50 to-gray-50">
                <div className="font-mono truncate max-w-[70%] font-medium">{family}</div>
                <div className="text-blue-600 bg-white px-2 py-1 rounded-full text-xs border border-blue-100">
                  {count} elements
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <p className="mb-3" style={{ fontFamily: family }}>
                  <span className="text-lg leading-relaxed">The quick brown fox jumps over the lazy dog.</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span
                    className="text-xs bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100"
                    style={{ fontFamily: family }}
                  >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  </span>
                  <span
                    className="text-xs bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100"
                    style={{ fontFamily: family }}
                  >
                    abcdefghijklmnopqrstuvwxyz
                  </span>
                  <span
                    className="text-xs bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100"
                    style={{ fontFamily: family }}
                  >
                    0123456789
                  </span>
                </div>

                {/* Element references section */}
                {(() => {
                  const elementsWithFamily = getElementsWithFontFamily(family);
                  if (elementsWithFamily.length > 0) {
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <IconEye size={16} className="text-blue-500" />
                          <div className="text-sm text-gray-700 font-medium">
                            Found in {elementsWithFamily.length} elements
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {elementsWithFamily.slice(0, 5).map((typographyEl, idx) => {
                            const displayName = getElementDisplayName(typographyEl.element);

                            return (
                              <button
                                key={idx}
                                onClick={() => handleElementClick(typographyEl.element)}
                                className="text-xs bg-white px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 flex items-center gap-1"
                                title="Click to navigate to this element"
                              >
                                <IconEye size={12} className="text-blue-500" />
                                {displayName}
                              </button>
                            );
                          })}
                          {elementsWithFamily.length > 5 && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 border border-gray-200">
                              +{elementsWithFamily.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <IconRuler size={18} className="text-purple-500" />
          <h5 className="font-medium text-gray-800">Font Sizes</h5>
        </div>
        <div className="space-y-4">
          {Array.from(aggregatedProperties?.fontSizes.entries() || []).map(([size, count], index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-purple-200 transition-colors duration-200"
            >
              <div className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-purple-50 to-gray-50">
                <div className="font-mono font-medium">{size}</div>
                <div className="text-purple-600 bg-white px-2 py-1 rounded-full text-xs border border-purple-100">
                  {count} elements
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <p style={{ fontSize: size }} className="leading-relaxed">
                  Example text at {size}
                </p>

                {/* Element references section */}
                {(() => {
                  const elementsWithSize = getElementsWithFontSize(size);
                  if (elementsWithSize.length > 0) {
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Found in {elementsWithSize.length} elements:</div>
                        <div className="flex flex-wrap gap-1">
                          {elementsWithSize.slice(0, 5).map((typographyEl, idx) => {
                            const displayName = getElementDisplayName(typographyEl.element);

                            return (
                              <button
                                key={idx}
                                onClick={() => handleElementClick(typographyEl.element)}
                                className="text-xs bg-white px-1 py-0.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                                title="Click to navigate to this element"
                              >
                                {displayName}
                              </button>
                            );
                          })}
                          {elementsWithSize.length > 5 && (
                            <span className="text-xs text-gray-500">+{elementsWithSize.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font Weights */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <IconLetterCase size={18} className="text-amber-500 font-bold" />
          <h5 className="font-medium text-gray-800">Font Weights</h5>
        </div>
        <div className="space-y-4">
          {Array.from(aggregatedProperties?.fontWeights.entries() || []).map(([weight, count], index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-amber-200 transition-colors duration-200"
            >
              <div className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-amber-50 to-gray-50">
                <div className="font-mono font-medium">{weight}</div>
                <div className="text-amber-600 bg-white px-2 py-1 rounded-full text-xs border border-amber-100">
                  {count} elements
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <p style={{ fontWeight: weight }} className="leading-relaxed text-lg">
                  This text has font weight {weight}
                </p>

                {/* Element references section */}
                {(() => {
                  const elementsWithWeight = getElementsWithFontWeight(weight);
                  if (elementsWithWeight.length > 0) {
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <IconEye size={16} className="text-amber-500" />
                          <div className="text-sm text-gray-700 font-medium">
                            Found in {elementsWithWeight.length} elements
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {elementsWithWeight.slice(0, 5).map((typographyEl, idx) => {
                            const displayName = getElementDisplayName(typographyEl.element);

                            return (
                              <button
                                key={idx}
                                onClick={() => handleElementClick(typographyEl.element)}
                                className="text-xs bg-white px-2 py-1 rounded-md border border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-colors duration-200 flex items-center gap-1"
                                title="Click to navigate to this element"
                              >
                                <IconEye size={12} className="text-amber-500" />
                                {displayName}
                              </button>
                            );
                          })}
                          {elementsWithWeight.length > 5 && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 border border-gray-200">
                              +{elementsWithWeight.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypographyRules;
