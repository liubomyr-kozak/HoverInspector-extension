import React, { useState } from "react";
import { IconEye } from "@tabler/icons-react";
import { SpacingToken } from "./paletteTypes";
import { ImportSection } from "./ImportSection";

interface SpacingTokenTabProps {
  tokens: SpacingToken[];
  navigateToElement?: (element: Element) => void;
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

export const SpacingTokenTab: React.FC<SpacingTokenTabProps> = ({ tokens, navigateToElement }) => {
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  const toggleElementsExpansion = (tokenId: string) => {
    setExpandedElements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-2">
      <h4 className="text-base font-medium text-gray-800">Spacing Tokens</h4>
      
      {/* Import Section for Spacing */}
      <ImportSection
        title="Spacing Values"
        placeholder="Paste spacing values here (e.g., 8px 16px 1rem 2em 24)..."
        currentValues={[
          ...tokens.map(t => t.value),
          ...tokens.map(t => `${t.pixelValue}px`),
        ]}
        parseValue={(value) => {
          const trimmed = value.trim().toLowerCase();
          // Handle different spacing units
          if (trimmed.includes('px') || trimmed.includes('rem') || trimmed.includes('em')) return trimmed;
          if (/^\d+$/.test(trimmed)) return `${trimmed}px`; // Add px to plain numbers
          return trimmed;
        }}
      />
      <div className="grid grid-cols-3 gap-2">
        {tokens.map((token) => (
          <div key={token.id} className="p-2 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-800">{token.name}</span>
              <span className="text-xs text-gray-500">{token.value}</span>
            </div>
            <div className="mb-2">
              <div
                className="bg-blue-500"
                style={{
                  height: "12px",
                  width: `${Math.min(token.pixelValue, 80)}px`,
                }}
              />
              <div className="text-xs text-gray-500 mt-1">{token.pixelValue}px</div>
            </div>

            {token.sourceElements && token.sourceElements.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 mb-1">
                  <IconEye size={10} className="text-blue-600" />
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    {token.sourceElements.length}
                    {token.sourceElements.length > 2 && (
                      <button
                        onClick={() => toggleElementsExpansion(token.id)}
                        className="text-xs bg-blue-50 px-1 py-0.5 rounded border border-blue-200 hover:bg-blue-100"
                        title={expandedElements.has(token.id) ? "Collapse" : "Show all"}
                      >
                        {expandedElements.has(token.id) ? "−" : `+${token.sourceElements.length - 2}`}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {(() => {
                    const elementsToShow = expandedElements.has(token.id)
                      ? token.sourceElements!
                      : token.sourceElements!.slice(0, 2);
                    return elementsToShow.map((element, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigateToElement && navigateToElement(element)}
                        className="text-xs bg-blue-50 px-1 py-0.5 rounded border border-blue-200 hover:bg-blue-100"
                        title="Click to highlight this element"
                      >
                        {getElementDisplayName(element)}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
