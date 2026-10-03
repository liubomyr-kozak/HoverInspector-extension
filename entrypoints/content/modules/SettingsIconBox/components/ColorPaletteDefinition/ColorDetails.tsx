import React from "react";
import { IconEye } from "@tabler/icons-react";
import { getColorInAllFormats, calculateContrastRatio } from "@entrypoints/shared/utils/colorAnalysis.ts";

// Local, minimal type matching the shape used by callers
export type PaletteColorLike = {
  id: string;
  color: string;
  name: string;
  sourceElements?: Element[];
  frequency?: number;
  type?: string; // category/type label from caller (optional)
};

export interface ColorDetailsProps {
  color: PaletteColorLike;
  formatColor: (color: string) => string;
  expandedSourceElements: Set<string>;
  toggleSourceElementsExpansion: (colorId: string) => void;
  navigateToElement: (element: Element) => void;
}

const getElementDisplayName = (element: Element): string => {
  const getClassNameAsString = (el: Element): string => {
    const className = (el as any).className;
    if (className && typeof className === "object" && "baseVal" in className) {
      return (className as SVGAnimatedString).baseVal;
    }
    return typeof className === "string" ? className : "";
  };

  const tagName = element.tagName?.toLowerCase();
  const cls = getClassNameAsString(element) ? `.${getClassNameAsString(element).split(" ")[0]}` : "";
  const id = (element as HTMLElement).id ? `#${(element as HTMLElement).id}` : "";
  return id || cls || tagName;
};

export const ColorDetails: React.FC<ColorDetailsProps> = ({
  color,
  formatColor,
  expandedSourceElements,
  toggleSourceElementsExpansion,
  navigateToElement,
}) => {
  const colorFormats = getColorInAllFormats(color.color);
  const contrastWithWhite = calculateContrastRatio(color.color, "#ffffff");
  const contrastWithBlack = calculateContrastRatio(color.color, "#000000");

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 w-full sticky top-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-md border shadow-inner" style={{ backgroundColor: color.color }} />
        <div>
          <h4 className="text-base font-medium">{color.name}</h4>
          <span className="text-sm font-mono text-gray-600">{formatColor(color.color)}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <h4 className="text-sm font-semibold mb-2 text-gray-800">Color Information</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">HEX</p>
            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">
              {colorFormats?.hex || color.color}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">RGB</p>
            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{colorFormats?.rgb || ""}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">HSL</p>
            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{colorFormats?.hsl || ""}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">HSV</p>
            <p className="text-sm font-mono bg-white p-1 rounded border border-gray-200">{colorFormats?.hsv || ""}</p>
          </div>
        </div>
        <div className="text-xs text-gray-600 mb-2">
          <p className="mb-1">
            <strong>Contrast ratio with white:</strong>{" "}
            {Number.isFinite(contrastWithWhite) ? contrastWithWhite.toFixed(2) : "N/A"}
          </p>
          <p>
            <strong>Contrast ratio with black:</strong>{" "}
            {Number.isFinite(contrastWithBlack) ? contrastWithBlack.toFixed(2) : "N/A"}
          </p>
        </div>
      </div>

      {color.sourceElements && color.sourceElements.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <IconEye size={16} className="text-blue-600" />
            <div className="text-sm text-gray-700 font-medium flex items-center gap-2">
              Found in {color.sourceElements.length} elements
              {color.sourceElements.length > 3 && (
                <button
                  onClick={() => toggleSourceElementsExpansion(color.id)}
                  className="ml-2 text-xs bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors duration-200 flex items-center gap-1"
                  title={expandedSourceElements.has(color.id) ? "Collapse elements" : "Show all elements"}
                >
                  {expandedSourceElements.has(color.id) ? "Collapse" : "Show all"}

                  {!expandedSourceElements.has(color.id) && color.sourceElements.length > 3 && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 border border-gray-200">
                      +{color.sourceElements.length - 3}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const elementsToShow = expandedSourceElements.has(color.id)
                ? color.sourceElements!
                : color.sourceElements!.slice(0, 3);
              return elementsToShow.map((element, idx) => (
                <button
                  key={idx}
                  onClick={() => navigateToElement(element)}
                  className="text-xs cursor-pointer bg-white px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 flex items-center gap-1"
                  title="Click to navigate to this element"
                >
                  <IconEye size={12} className="text-blue-500" />
                  {getElementDisplayName(element)}
                </button>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorDetails;
