/**
 * ElementsWithIssues Component
 * 
 * This component displays a list of elements with accessibility or design issues found on the page.
 * It groups elements by issue category and provides details about each issue.
 * Users can click on an element to highlight it and scroll it into view.
 * 
 * The component uses a MutationObserver to detect DOM changes and update the list of elements with issues.
 */
import React, { useEffect, useState } from "react";
import { getElementsWithIssues, CategorizedElement } from "@entrypoints/shared/utils/categorizeElements";
import { IconAlertTriangle, IconAccessible, IconLayoutGrid } from "@tabler/icons-react";
import DomNodeManagerInstance from "@entrypoints/core/services/dom/DomNodeManager";

interface ElementsWithIssuesProps {
  /**
   * Optional callback function to handle element selection.
   * If not provided, the component will highlight the element and scroll it into view.
   */
  onElementSelect?: (element: Element) => void;
}

const ElementsWithIssues: React.FC<ElementsWithIssuesProps> = ({ onElementSelect }) => {
  const [elementsWithIssues, setElementsWithIssues] = useState<CategorizedElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get elements with issues when the component mounts
    const fetchElementsWithIssues = () => {
      setIsLoading(true);
      try {
        const elements = getElementsWithIssues();
        setElementsWithIssues(elements);
      } catch (error) {
        console.error("Error fetching elements with issues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElementsWithIssues();

    // Set up a mutation observer to detect DOM changes and update the list
    const observer = new MutationObserver(() => {
      fetchElementsWithIssues();
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

  const handleElementClick = (element: Element) => {
    if (onElementSelect) {
      onElementSelect(element);
    } else {
      // Default behavior: highlight the element
      const originalOutline = element.style.outline;
      const originalTransition = element.style.transition;
      const originalBoxShadow = element.style.boxShadow;

      element.style.outline = "2px solid #f29d68";
      element.style.outlineOffset = "2px";
      element.style.transition = "all 0.25s ease-in-out";
      element.style.boxShadow = "0 0 8px 2px rgba(242, 157, 104, 0.8)";

      // Scroll the element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Reset styles after a delay
      setTimeout(() => {
        element.style.outline = originalOutline;
        element.style.transition = originalTransition;
        element.style.boxShadow = originalBoxShadow;
      }, 2000);
    }
  };

  // Group elements by issue category
  const groupedElements = elementsWithIssues.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CategorizedElement[]>);

  // Get icon for issue category
  const getCategoryIcon = (category: string) => {
    if (category.startsWith('a11y-')) {
      return <IconAccessible size={16} />;
    } else if (category.startsWith('design-')) {
      return <IconLayoutGrid size={16} />;
    }
    return <IconAlertTriangle size={16} />;
  };

  // Get display name for issue category
  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'a11y-contrast-issue':
        return 'Contrast Issues';
      case 'a11y-missing-alt':
        return 'Missing Alt Text';
      case 'a11y-missing-label':
        return 'Missing Labels';
      case 'a11y-missing-aria':
        return 'Missing ARIA Attributes';
      case 'design-small-target':
        return 'Small Target Size';
      case 'design-overflow-issue':
        return 'Content Overflow';
      case 'design-spacing-issue':
        return 'Inadequate Spacing';
      default:
        return category;
    }
  };

  // Get element description
  const getElementDescription = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className && typeof element.className === 'string' 
      ? `.${element.className.split(' ')[0]}` 
      : '';
    const text = element.textContent?.trim().substring(0, 20);
    
    return `<${tagName}${id}${className}>${text ? `...${text}...` : ''}</${tagName}>`;
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading elements with issues...</div>;
  }

  if (elementsWithIssues.length === 0) {
    return (
      <div className="p-4 text-center">
        <IconAlertTriangle size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">No elements with issues found.</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-lg font-medium mb-4">Elements with Issues</h3>
      <p className="text-sm text-gray-500 mb-4">
        This section highlights elements with design or accessibility issues.
      </p>
      
      {Object.entries(groupedElements).map(([category, elements]) => (
        <div key={category} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon(category)}
            <h4 className="font-medium">{getCategoryDisplayName(category)}</h4>
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {elements.length}
            </span>
          </div>
          
          <div className="space-y-2">
            {elements.map((item, index) => (
              <div 
                key={index}
                className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleElementClick(item.element)}
              >
                <div className="text-xs font-mono mb-1">{getElementDescription(item.element)}</div>
                <div className="text-xs text-gray-600">{item.issueDetails}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ElementsWithIssues;