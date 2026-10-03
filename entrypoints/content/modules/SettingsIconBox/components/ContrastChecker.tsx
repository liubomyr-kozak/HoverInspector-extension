import React, { useEffect, useState } from "react";
import { IconAlertTriangle, IconCheck, IconColorSwatch, IconInfoCircle, IconX } from "@tabler/icons-react";
import { evaluateReadability, getColorInAllFormats } from "@entrypoints/shared/utils/colorAnalysis";
import { targetColorStringToHex } from "@entrypoints/content/modules/Popup/helpers.tsx";

interface ContrastCheckerProps {
  initialForegroundColor: string;
  initialBackgroundColor: string;
}

/**
 * ContrastChecker Component
 *
 * This component provides tools to check contrast ratios for accessibility.
 * It allows users to select foreground and background colors and displays
 * the contrast ratio and WCAG compliance level.
 *
 * Features:
 * - Initializes with the selected element's text and background colors
 * - Allows manual selection of colors using color pickers or text inputs
 * - Supports multiple color formats (RGB, HEX, HSL)
 * - Displays the contrast ratio between the selected colors
 * - Shows WCAG compliance level (AAA, AA, or Fail)
 * - Provides a text preview with the selected colors
 * - Offers recommendations for improving contrast when needed
 *
 * WCAG Compliance Levels:
 * - AAA (Excellent): Contrast ratio of 7:1 or higher for normal text
 * - AA (Good): Contrast ratio between 4.5:1 and 7:1 for normal text
 * - Fail: Contrast ratio below 4.5:1 for normal text
 *
 * Usage:
 * <ContrastChecker
 *   initialForegroundColor={textColor}
 *   initialBackgroundColor={backgroundColor}
 * />
 */
const ContrastChecker: React.FC<ContrastCheckerProps> = ({ initialForegroundColor, initialBackgroundColor }) => {
  const [foregroundColor, setForegroundColor] = useState(initialForegroundColor);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [contrastResult, setContrastResult] = useState<{
    contrastRatio: number;
    isReadable: boolean;
    wcagLevel: "AAA" | "AA" | "Fail";
    recommendation?: string;
  } | null>(null);
  const [colorFormat, setColorFormat] = useState<"rgb" | "hex" | "hsl">("hex");

  // Follow the inspected element: a new hover/selection brings new starting colours
  useEffect(() => setForegroundColor(initialForegroundColor), [initialForegroundColor]);
  useEffect(() => setBackgroundColor(initialBackgroundColor), [initialBackgroundColor]);

  // <input type="color"> only accepts #rrggbb
  const toPickerValue = (color: string) => {
    const hex = targetColorStringToHex(color);
    return /^#[0-9a-f]{6}/i.test(hex) ? hex.slice(0, 7) : "#000000";
  };

  // Calculate contrast when colors change
  useEffect(() => {
    if (foregroundColor && backgroundColor) {
      const result = evaluateReadability(foregroundColor, backgroundColor);
      setContrastResult(result);
    }
  }, [foregroundColor, backgroundColor]);

  // Format color based on selected format
  const formatColor = (color: string): string => {
    if (!color) return "";

    const formattedColors = getColorInAllFormats(color);
    if (!formattedColors) return color;

    return formattedColors[colorFormat];
  };

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

  return (
    <div className="mt-4 space-y-2 text-left text-sm">
      <div className="flex items-center gap-2 mb-2">
        <IconColorSwatch size={16} />
        <strong>Contrast Checker</strong>
      </div>

      {/* Color Format Selector */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs">Color Format:</span>
        <select
          className="text-xs border rounded px-1 py-0.5"
          value={colorFormat}
          onChange={(e) => setColorFormat(e.target.value as "rgb" | "hex" | "hsl")}
        >
          <option value="rgb">RGB</option>
          <option value="hex">HEX</option>
          <option value="hsl">HSL</option>
        </select>
      </div>

      {/* Color Inputs */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-24">Foreground:</span>
          <input
            type="color"
            value={toPickerValue(foregroundColor)}
            onChange={(e) => setForegroundColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={formatColor(foregroundColor)}
            onChange={(e) => setForegroundColor(e.target.value)}
            className="text-xs border rounded px-1 py-0.5 w-28"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="w-24">Background:</span>
          <input
            type="color"
            value={toPickerValue(backgroundColor)}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={formatColor(backgroundColor)}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="text-xs border rounded px-1 py-0.5 w-28"
          />
        </div>
      </div>

      {/* Contrast Results */}
      {contrastResult && (
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Contrast Ratio:</span>
            <span className="font-bold">{contrastResult.contrastRatio.toFixed(2)}:1</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">WCAG Compliance:</span>
            {renderWcagBadge(contrastResult.wcagLevel)}
          </div>

          {/* Text Preview */}
          <div className="mb-2">
            <div className="text-xs mb-1">Text Preview:</div>
            <div
              className="p-2 rounded text-center"
              style={{
                backgroundColor: backgroundColor,
                color: foregroundColor,
              }}
            >
              <span className="text-xs">Small Text</span>
              <div className="text-lg font-bold">Large Text</div>
            </div>
          </div>

          {/* Recommendation */}
          {contrastResult.recommendation && (
            <div className="flex items-start gap-1 text-xs text-amber-700 mt-2">
              <IconInfoCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{contrastResult.recommendation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContrastChecker;