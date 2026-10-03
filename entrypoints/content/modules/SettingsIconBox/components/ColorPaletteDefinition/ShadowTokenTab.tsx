import React, { useState } from 'react';
import { IconEye } from '@tabler/icons-react';
import { ShadowToken } from './paletteTypes';
import { ImportSection } from './ImportSection';

interface ShadowTokenTabProps {
  tokens: ShadowToken[];
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

export const ShadowTokenTab: React.FC<ShadowTokenTabProps> = ({ tokens, navigateToElement }) => {
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
    <div className="space-y-2">
      
      {/* Import Section for Shadow */}
      <ImportSection
        title="Shadow Values"
        placeholder="Paste shadow values here (e.g., 0 2px 4px rgba(0,0,0,0.1) 0 4px 8px #000)..."
        currentValues={tokens.map(t => t.value)}
        parseValue={(value) => {
          // Shadow values are typically complex CSS strings, so normalize whitespace
          return value.trim().toLowerCase().replace(/\s+/g, ' ');
        }}
      />
      {/* Columns follow the panel width (md:/lg: breakpoints follow the page's width instead) */}
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))" }}>
        {tokens.map((token) => (
          <div key={token.id} className="p-2 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-800">{token.name}</span>
            </div>
            <div className="mb-2 flex justify-center">
              <div 
                className="w-8 h-8 bg-white border border-gray-100"
                style={{ 
                  boxShadow: token.value
                }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center mb-1 font-mono truncate" title={token.value}>
              {token.value.length > 15 ? token.value.substring(0, 15) + '...' : token.value}
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