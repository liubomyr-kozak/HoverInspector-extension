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
import { 
  IconTypography, 
  IconLetterCase, 
  IconLetterSpacing, 
  IconAlertTriangle, 
  IconChevronDown, 
  IconChevronRight,
  IconRuler,
  IconUserCircle,
  IconTestPipe,
  IconBrush,
  IconCheck,
  IconX
} from "@tabler/icons-react";

import { 
  getAllTypographyElements, 
  getElementsWithTypographyIssues, 
  aggregateTypographyProperties,
  getTypographyRules,
  TypographyElement,
  AggregatedTypographyProperties
} from "@entrypoints/shared/utils/typographyAnalysis";

// Define the audience types
type AudienceType = 'designer' | 'user' | 'qa' | 'all';

const TypographyRules: React.FC = () => {
  // State for typography elements and properties
  const [typographyElements, setTypographyElements] = useState<TypographyElement[]>([]);
  const [aggregatedProperties, setAggregatedProperties] = useState<AggregatedTypographyProperties | null>(null);
  const [elementsWithIssues, setElementsWithIssues] = useState<TypographyElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for UI controls
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>('all');
  const [collapsedSections, setCollapsedSections] = useState({
    rules: false,
    analysis: false,
    issues: false
  });

  // Fetch typography data when component mounts
  useEffect(() => {
    const fetchTypographyData = () => {
      setIsLoading(true);
      try {
        const elements = getAllTypographyElements();
        setTypographyElements(elements);
        
        const properties = aggregateTypographyProperties();
        setAggregatedProperties(properties);
        
        // Filter elements with issues
        const elementsWithIssues = elements.filter(el => el.issueDetails);
        setElementsWithIssues(elementsWithIssues);
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

  // Toggle section collapse
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle element click to highlight it on the page
  const handleElementClick = (element: Element) => {
    // Default behavior: highlight the element
    const originalOutline = element.style.outline;
    const originalTransition = element.style.transition;
    const originalBoxShadow = element.style.boxShadow;

    element.style.outline = "2px solid #15803d";
    element.style.outlineOffset = "2px";
    element.style.transition = "all 0.25s ease-in-out";
    element.style.boxShadow = "0 0 8px 2px rgba(21, 128, 61, 0.8)";

    // Scroll the element into view
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Reset styles after a delay
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.transition = originalTransition;
      element.style.boxShadow = originalBoxShadow;
    }, 2000);
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

  // Filter rules by audience
  const getFilteredRules = () => {
    const rules = getTypographyRules();
    if (selectedAudience === 'all') {
      return rules;
    }
    return rules.filter(rule => rule.forAudience.includes(selectedAudience));
  };

  // Render loading state
  if (isLoading) {
    return <div className="p-4 text-center">Loading typography analysis...</div>;
  }

  return (
    <div className="p-2">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Typography Rules</h3>
        <p className="text-sm text-gray-500 mb-4">
          Analyze and improve typography on your page based on design best practices.
        </p>
      </div>

      <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <div
          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('analysis')}
        >
          <div className="flex items-center gap-2">
            <IconLetterSpacing size={18} />
            <h4 className="font-medium">Typography Analysis</h4>
            {aggregatedProperties && (
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                {aggregatedProperties.totalElements} elements
              </span>
            )}
          </div>
          {collapsedSections.analysis ? <IconChevronRight size={18} /> : <IconChevronDown size={18} />}
        </div>
        
        {!collapsedSections.analysis && aggregatedProperties && (
          <div className="p-3">
            {/* Font Families */}
            <div className="mb-4">
              <h5 className="font-medium text-sm mb-2">Font Families</h5>
              <div className="space-y-2">
                {Array.from(aggregatedProperties.fontFamilies.entries()).map(([family, count], index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="font-mono truncate max-w-[70%]">{family}</div>
                    <div className="text-gray-500">{count} elements</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Sizes */}
            <div className="mb-4">
              <h5 className="font-medium text-sm mb-2">Font Sizes</h5>
              <div className="space-y-2">
                {Array.from(aggregatedProperties.fontSizes.entries()).map(([size, count], index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="font-mono">{size}</div>
                    <div className="text-gray-500">{count} elements</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Weights */}
            <div className="mb-4">
              <h5 className="font-medium text-sm mb-2">Font Weights</h5>
              <div className="space-y-2">
                {Array.from(aggregatedProperties.fontWeights.entries()).map(([weight, count], index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="font-mono">{weight}</div>
                    <div className="text-gray-500">{count} elements</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypographyRules;