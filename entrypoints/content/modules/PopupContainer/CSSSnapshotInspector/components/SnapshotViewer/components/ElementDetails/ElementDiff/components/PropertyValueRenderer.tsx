import React from "react";
import { isColorValue } from "@entrypoints/shared/utils/isColorValue.ts";
import { isGradientValue } from "@entrypoints/shared/utils/isGradientValue";

interface PropertyValueRendererProps {
  value: string;
  className?: string;
}

export const PropertyValueRenderer: React.FC<PropertyValueRendererProps> = ({ 
  value, 
  className = "" 
}) => {
  const renderValueWithHighlight = (val: string) => {
    // Check if it's a color value
    if (isColorValue(val)) {
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <span
            className="inline-block w-3 h-3 rounded border border-gray-300"
            style={{ backgroundColor: val }}
            title={val}
          />
          {val}
        </span>
      );
    }

    // Check if it's a gradient
    if (isGradientValue(val)) {
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <span
            className="inline-block w-6 h-3 rounded border border-gray-300"
            style={{ backgroundImage: val }}
            title="gradient"
          />
          {val}
        </span>
      );
    }

    return <span className={className}>{val}</span>;
  };

  return <div>{renderValueWithHighlight(value)}</div>;
};