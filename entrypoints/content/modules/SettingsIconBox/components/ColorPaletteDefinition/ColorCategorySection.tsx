import React from "react";
import { PaletteColor } from "./paletteTypes";
import { sortColorsByPaletteLogic } from "./utils/paletteUtils.ts";

export interface ColorCategorySectionProps {
  title: string;
  type: string; // Type label used for sorting context
  colors: PaletteColor[];
  selectedColorId: string | null;
  formatColor: (c: string) => string;
  onSelect: (id: string | null) => void;
}

export const ColorCategorySection: React.FC<ColorCategorySectionProps> = ({
  title,
  type,
  colors,
  selectedColorId,
  formatColor,
  onSelect,
}) => {
  if (!colors.length) return null;
  const sorted = sortColorsByPaletteLogic(colors.map((c) => ({ ...c, type })));

  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-800 mb-3">{title}</h4>
      <div className="flex gap-4 flex-wrap">
        {sorted.map((color) => (
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
                onClick={() => onSelect(selectedColorId === color.id ? null : color.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorCategorySection;
