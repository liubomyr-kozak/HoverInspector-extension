/**
 * GuidelinesViewer Component
 * 
 * This component displays the design guidelines and best practices for the Hover Inspector Extension.
 * It organizes the guidelines into collapsible sections for easy navigation and readability.
 * Each section includes relevant icons and formatted content from the DESIGN_GUIDELINES.md document.
 * 
 * The component can now use page elements to provide context-specific guidelines.
 */
import React, { useState, useEffect } from "react";
import { 
  IconLayoutDashboard, 
  IconComponents, 
  IconPalette, 
  IconCode, 
  IconAccessible, 
  IconSpeedboat,
  IconChevronDown,
  IconChevronRight,
  IconAlertTriangle
} from "@tabler/icons-react";
import { getElementsWithIssues, CategorizedElement } from "@entrypoints/shared/utils/categorizeElements";
import DomNodeManagerInstance from "@entrypoints/core/services/dom/DomNodeManager";

interface GuidelineSection {
  /** Unique identifier for the section */
  id: string;
  /** Display title for the section */
  title: string;
  /** Icon component to display next to the title */
  icon: React.ReactNode;
  /** Content of the section */
  content: React.ReactNode;
  /** Optional elements related to this guideline section */
  relatedElements?: Element[];
}

interface GuidelinesViewerProps {
  /**
   * Optional callback function to handle element selection.
   * If not provided, the component will highlight the element and scroll it into view.
   */
  onElementSelect?: (element: Element) => void;
}

/**
 * A component that displays design guidelines and best practices
 * in a structured, collapsible format, now with the ability to
 * use page elements to provide context-specific guidelines
 */
const GuidelinesViewer: React.FC<GuidelinesViewerProps> = ({ onElementSelect }) => {
  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'uiux': true,
    'components': false,
    'styling': false,
    'code': false,
    'accessibility': false,
    'performance': false
  });
  
  // State to store elements with issues
  const [elementsWithIssues, setElementsWithIssues] = useState<CategorizedElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch elements with issues when the component mounts
  useEffect(() => {
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
  
  // Handle element click
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

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Helper function to get element description
  const getElementDescription = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className && typeof element.className === 'string' 
      ? `.${element.className.split(' ')[0]}` 
      : '';
    const text = element.textContent?.trim().substring(0, 20);
    
    return `<${tagName}${id}${className}>${text ? `...${text}...` : ''}</${tagName}>`;
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

  // Get elements related to UI/UX principles
  const uiuxRelatedElements = elementsWithIssues.filter(item => 
    item.category.startsWith('design-') || 
    item.category === 'a11y-contrast-issue'
  ).map(item => item.element);

  // Get elements related to components
  const componentsRelatedElements = elementsWithIssues.filter(item => 
    item.category.startsWith('design-') || 
    item.element.tagName.toLowerCase() === 'button' ||
    item.element.tagName.toLowerCase() === 'input' ||
    item.element.tagName.toLowerCase() === 'select' ||
    item.element.tagName.toLowerCase() === 'textarea'
  ).map(item => item.element);

  // Get elements related to styling
  const stylingRelatedElements = elementsWithIssues.filter(item => 
    item.category === 'design-spacing-issue' || 
    item.category === 'design-overflow-issue' ||
    item.category === 'a11y-contrast-issue'
  ).map(item => item.element);

  // Get elements related to accessibility
  const accessibilityRelatedElements = elementsWithIssues.filter(item => 
    item.category.startsWith('a11y-')
  ).map(item => item.element);

  // Define the guideline sections
  const guidelineSections: GuidelineSection[] = [
    {
      id: 'uiux',
      title: 'UI/UX Principles',
      icon: <IconLayoutDashboard size={20} />,
      relatedElements: uiuxRelatedElements,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Visual Hierarchy</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use consistent spacing and sizing to establish visual hierarchy</li>
              <li>Important actions should be more prominent</li>
              <li>Group related elements together</li>
              <li>Use whitespace effectively to separate different sections</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Feedback and Responsiveness</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Provide visual feedback for user interactions (hover states, active states)</li>
              <li>Use animations sparingly and purposefully (e.g., for loading states or transitions)</li>
              <li>Ensure all interactive elements have appropriate cursor styles</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Consistency</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Maintain consistent UI patterns across the extension</li>
              <li>Use the same icon set throughout the application</li>
              <li>Follow a consistent color scheme</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">User Flow</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Design with the user's workflow in mind</li>
              <li>Minimize the number of steps required to complete common tasks</li>
              <li>Provide clear navigation paths</li>
            </ul>
          </div>
          
          {uiuxRelatedElements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Related Elements on Page</h4>
              <div className="space-y-2">
                {uiuxRelatedElements.slice(0, 5).map((element, index) => (
                  <div 
                    key={index}
                    className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleElementClick(element)}
                  >
                    <div className="text-xs font-mono">{getElementDescription(element)}</div>
                  </div>
                ))}
                {uiuxRelatedElements.length > 5 && (
                  <div className="text-xs text-gray-500">
                    And {uiuxRelatedElements.length - 5} more elements...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'components',
      title: 'Component Design Standards',
      icon: <IconComponents size={20} />,
      relatedElements: componentsRelatedElements,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Component Structure</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Follow a functional component approach with React</li>
              <li>Use TypeScript interfaces for props</li>
              <li>Include JSDoc comments for component documentation</li>
              <li>Keep components focused on a single responsibility</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Reusable Components</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Create reusable components for common UI elements</li>
              <li>Place shared components in the <code className="bg-gray-100 px-1 rounded">entrypoints/shared/components</code> directory</li>
              <li>Module-specific components should be placed in their respective module directories</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Component Naming</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use PascalCase for component names</li>
              <li>Use descriptive names that reflect the component's purpose</li>
              <li>Suffix test files with <code className="bg-gray-100 px-1 rounded">.test.tsx</code> or <code className="bg-gray-100 px-1 rounded">.spec.tsx</code></li>
            </ul>
          </div>
          
          {componentsRelatedElements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Related Elements on Page</h4>
              <div className="space-y-2">
                {componentsRelatedElements.slice(0, 5).map((element, index) => (
                  <div 
                    key={index}
                    className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleElementClick(element)}
                  >
                    <div className="text-xs font-mono">{getElementDescription(element)}</div>
                  </div>
                ))}
                {componentsRelatedElements.length > 5 && (
                  <div className="text-xs text-gray-500">
                    And {componentsRelatedElements.length - 5} more elements...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'styling',
      title: 'Styling Guidelines',
      icon: <IconPalette size={20} />,
      relatedElements: stylingRelatedElements,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Tailwind CSS</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use Tailwind CSS for styling when possible</li>
              <li>Follow utility-first approach</li>
              <li>Extract common patterns to custom classes when needed</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Styled Components</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use styled-components for complex styling needs or global styles</li>
              <li>Keep styled component definitions close to their usage</li>
              <li>Use the styled-components theme for consistent values</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Color Palette</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use a consistent color palette throughout the application</li>
              <li>Primary colors:
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Primary: <span className="inline-block w-4 h-4 bg-[#15803d] align-middle mr-1 rounded-sm"></span> <code className="bg-gray-100 px-1 rounded">#15803d</code> (green)</li>
                  <li>Secondary: <span className="inline-block w-4 h-4 bg-[#3aca70] align-middle mr-1 rounded-sm"></span> <code className="bg-gray-100 px-1 rounded">#3aca70</code> (light green)</li>
                  <li>Text: <span className="inline-block w-4 h-4 bg-[#374151] align-middle mr-1 rounded-sm"></span> <code className="bg-gray-100 px-1 rounded">#374151</code> (dark gray)</li>
                  <li>Background: <span className="inline-block w-4 h-4 bg-[#ffffff] border border-gray-200 align-middle mr-1 rounded-sm"></span> <code className="bg-gray-100 px-1 rounded">#ffffff</code> (white)</li>
                </ul>
              </li>
              <li>Use Tailwind's color classes when possible</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Typography</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use a consistent type scale</li>
              <li>Prefer relative units (rem, em) over absolute units (px)</li>
              <li>Limit the number of font families used in the application</li>
              <li>Use appropriate font weights for different text elements</li>
            </ul>
          </div>
          
          {stylingRelatedElements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Related Elements on Page</h4>
              <div className="space-y-2">
                {stylingRelatedElements.slice(0, 5).map((element, index) => (
                  <div 
                    key={index}
                    className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleElementClick(element)}
                  >
                    <div className="text-xs font-mono">{getElementDescription(element)}</div>
                  </div>
                ))}
                {stylingRelatedElements.length > 5 && (
                  <div className="text-xs text-gray-500">
                    And {stylingRelatedElements.length - 5} more elements...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'code',
      title: 'Code Style and Patterns',
      icon: <IconCode size={20} />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">State Management</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use Redux for global state management</li>
              <li>Use React's useState and useEffect for component-local state</li>
              <li>Follow a consistent pattern for state updates</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">File Organization</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Group related files together in modules</li>
              <li>Use index files to export module contents</li>
              <li>Keep file sizes manageable (consider splitting large files)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Imports</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Group imports by type:
                <ol className="list-decimal pl-5 space-y-1 mt-1">
                  <li>React and libraries</li>
                  <li>Components</li>
                  <li>Utilities and helpers</li>
                  <li>Styles</li>
                </ol>
              </li>
              <li>Use absolute imports for project files</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Error Handling</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Implement proper error boundaries</li>
              <li>Use try/catch blocks for async operations</li>
              <li>Provide meaningful error messages to users</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'accessibility',
      title: 'Accessibility Considerations',
      icon: <IconAccessible size={20} />,
      relatedElements: accessibilityRelatedElements,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Keyboard Navigation</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Ensure all interactive elements are keyboard accessible</li>
              <li>Use proper focus management</li>
              <li>Implement keyboard shortcuts for common actions</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Screen Readers</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use semantic HTML elements</li>
              <li>Include appropriate ARIA attributes when needed</li>
              <li>Ensure proper heading hierarchy</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Color Contrast</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Maintain sufficient color contrast for text and interactive elements</li>
              <li>Don't rely solely on color to convey information</li>
              <li>Test with color blindness simulators</li>
            </ul>
          </div>
          
          {accessibilityRelatedElements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Related Elements on Page</h4>
              <div className="space-y-2">
                {accessibilityRelatedElements.slice(0, 5).map((element, index) => (
                  <div 
                    key={index}
                    className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleElementClick(element)}
                  >
                    <div className="text-xs font-mono">{getElementDescription(element)}</div>
                  </div>
                ))}
                {accessibilityRelatedElements.length > 5 && (
                  <div className="text-xs text-gray-500">
                    And {accessibilityRelatedElements.length - 5} more elements...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'performance',
      title: 'Performance Optimization',
      icon: <IconSpeedboat size={20} />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Rendering Optimization</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use React.memo for components that render frequently</li>
              <li>Implement virtualization for long lists</li>
              <li>Avoid unnecessary re-renders</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Asset Optimization</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Optimize images and icons</li>
              <li>Use appropriate image formats</li>
              <li>Implement lazy loading for non-critical resources</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Code Splitting</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Implement code splitting for large features</li>
              <li>Lazy load components that aren't immediately needed</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'issues',
      title: 'Elements with Issues',
      icon: <IconAlertTriangle size={20} />,
      content: (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-4 text-center">Loading elements with issues...</div>
          ) : elementsWithIssues.length === 0 ? (
            <div className="p-4 text-center">
              <IconAlertTriangle size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No elements with issues found.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                This section highlights elements with design or accessibility issues found on the page.
                Click on an element to highlight it.
              </p>
              
              {Object.entries(groupedElements).map(([category, elements]) => {
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
                
                // Get icon for issue category
                const getCategoryIcon = (category: string) => {
                  if (category.startsWith('a11y-')) {
                    return <IconAccessible size={16} />;
                  } else if (category.startsWith('design-')) {
                    return <IconLayoutDashboard size={16} />;
                  }
                  return <IconAlertTriangle size={16} />;
                };
                
                return (
                  <div key={category} className="mb-4">
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
                );
              })}
            </>
          )}
        </div>
      )
    }
  ];

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-500">Loading guidelines and page elements...</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-lg font-medium mb-2">Design Guidelines</h3>
      <p className="text-sm text-gray-500 mb-4">
        These guidelines ensure consistency across the codebase and provide a better user experience.
        {elementsWithIssues.length > 0 && (
          <span className="ml-1 text-orange-500">
            Found {elementsWithIssues.length} elements with issues on this page.
          </span>
        )}
      </p>
      
      <div className="space-y-2">
        {guidelineSections.map(section => (
          <div key={section.id} className="border border-gray-200 rounded-md overflow-hidden">
            <div 
              className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <span className="text-gray-600">{section.icon}</span>
              <h4 className="font-medium flex-grow">{section.title}</h4>
              {section.relatedElements && section.relatedElements.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full mr-2">
                  {section.relatedElements.length}
                </span>
              )}
              {expandedSections[section.id] ? (
                <IconChevronDown size={18} className="text-gray-500" />
              ) : (
                <IconChevronRight size={18} className="text-gray-500" />
              )}
            </div>
            
            {expandedSections[section.id] && (
              <div className="p-3 border-t border-gray-200">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-xs text-gray-500 italic">
        These guidelines are meant to evolve over time. If you have suggestions for improvements, please submit a pull request with your proposed changes.
      </div>
    </div>
  );
};

export default GuidelinesViewer;