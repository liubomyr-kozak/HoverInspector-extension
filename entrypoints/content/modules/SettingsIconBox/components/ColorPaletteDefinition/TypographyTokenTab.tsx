import React, { useState } from 'react';
import { IconEye } from '@tabler/icons-react';
import { TypographyToken } from './paletteTypes';
import { ImportSection } from './ImportSection';

interface TypographyTokenTabProps {
  tokens: TypographyToken[];
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

export const TypographyTokenTab: React.FC<TypographyTokenTabProps> = ({ tokens, navigateToElement }) => {
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  const toggleElementsExpansion = (tokenId: string) => {
    setExpandedElements(prev => {
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
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-800">Typography Tokens</h4>
      
      {/* Import Section for Typography */}
      <ImportSection
        title="Typography Values"
        placeholder="Paste typography values here (e.g., 16px 1.5rem bold 400 1.2)..."
        currentValues={[
          ...tokens.map(t => t.fontSize),
          ...tokens.map(t => t.fontWeight),
          ...tokens.map(t => t.lineHeight),
          ...tokens.filter(t => t.letterSpacing).map(t => t.letterSpacing!),
          ...tokens.filter(t => t.fontFamily).map(t => t.fontFamily!),
        ]}
        parseValue={(value) => {
          const trimmed = value.trim().toLowerCase();
          // Normalize common typography units and values
          if (trimmed.includes('px') || trimmed.includes('rem') || trimmed.includes('em')) return trimmed;
          if (trimmed === 'bold' || trimmed === 'normal' || /^\d+$/.test(trimmed)) return trimmed;
          return trimmed;
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tokens.map((token) => (
          <div key={token.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-gray-800">{token.name}</span>
              <span className="text-sm text-gray-500">{token.fontSize}</span>
            </div>
            <div 
              className="text-gray-700 mb-2"
              style={{
                fontSize: token.fontSize,
                fontWeight: token.fontWeight,
                lineHeight: token.lineHeight,
                letterSpacing: token.letterSpacing,
                fontFamily: token.fontFamily
              }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Weight: {token.fontWeight}</div>
              <div>Line Height: {token.lineHeight}</div>
              {token.letterSpacing && <div>Letter Spacing: {token.letterSpacing}</div>}
            </div>
            
            {token.sourceElements && token.sourceElements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <IconEye size={14} className="text-blue-600" />
                  <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    Found in {token.sourceElements.length} elements
                    {token.sourceElements.length > 3 && (
                      <button
                        onClick={() => toggleElementsExpansion(token.id)}
                        className="ml-2 text-xs bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors duration-200 flex items-center gap-1"
                        title={expandedElements.has(token.id) ? "Collapse elements" : "Show all elements"}
                      >
                        {expandedElements.has(token.id) ? "Collapse" : "Show all"}
                        {!expandedElements.has(token.id) && token.sourceElements.length > 3 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 border border-gray-200">
                            +{token.sourceElements.length - 3}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const elementsToShow = expandedElements.has(token.id)
                      ? token.sourceElements!
                      : token.sourceElements!.slice(0, 3);
                    return elementsToShow.map((element, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigateToElement && navigateToElement(element)}
                        className="text-xs cursor-pointer bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                        title="Click to highlight this element"
                      >
                        <IconEye size={10} className="text-blue-500" />
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