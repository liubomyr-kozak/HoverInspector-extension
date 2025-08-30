import React, { useMemo, useState } from "react";
import { IconSearch, IconChevronDown, IconChevronRight } from "@tabler/icons-react";

// --- Types ---------------------------------------------------------------------------------------------------------

interface ElementData {
  styles?: Record<string, any>;
  classRules?: Record<string, Record<string, any>>;
}

interface ElementDiffSingleColumnProps {
  left: ElementData;
  right: ElementData;
}

interface CSSProperty {
  property: string;
  value: string;
}

interface CSSCategory {
  name: string;
  label: string;
  properties: CSSProperty[];
}

// --- CSS Categories Configuration ----------------------------------------------------------------------------------

const CSS_CATEGORIES = {
  boxModel: [
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border', 'border-width', 'border-style', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius'
  ],
  typography: [
    'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
    'line-height', 'letter-spacing', 'word-spacing', 'text-align',
    'text-decoration', 'text-transform', 'text-indent', 'text-shadow',
    'color', 'text-overflow', 'white-space', 'word-wrap', 'word-break'
  ],
  background: [
    'background', 'background-color', 'background-image', 'background-repeat',
    'background-position', 'background-size', 'background-attachment', 'background-clip'
  ],
  layout: [
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'float', 'clear', 'z-index', 'overflow', 'overflow-x', 'overflow-y',
    'visibility', 'opacity'
  ],
  flexbox: [
    'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content',
    'align-items', 'align-content', 'align-self', 'flex-grow', 'flex-shrink', 'flex-basis'
  ]
};

const CATEGORY_LABELS = {
  boxModel: 'Box Model',
  typography: 'Typography',
  background: 'Background',
  layout: 'Layout',
  flexbox: 'Flexbox'
};

// --- Utility Functions ---------------------------------------------------------------------------------------------

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const categorizeProperties = (styles: Record<string, any> = {}): CSSCategory[] => {
  const categorized: Record<string, CSSProperty[]> = {};
  const used = new Set<string>();
  
  // Initialize categories
  Object.keys(CSS_CATEGORIES).forEach(category => {
    categorized[category] = [];
  });
  
  // Categorize known properties
  Object.entries(CSS_CATEGORIES).forEach(([category, props]) => {
    props.forEach(prop => {
      if (styles[prop] !== undefined) {
        categorized[category].push({
          property: prop,
          value: formatValue(styles[prop])
        });
        used.add(prop);
      }
    });
  });
  
  // Add uncategorized properties to layout category
  Object.entries(styles).forEach(([prop, value]) => {
    if (!used.has(prop)) {
      categorized.layout.push({
        property: prop,
        value: formatValue(value)
      });
    }
  });
  
  // Convert to CSSCategory array and remove empty categories
  return Object.entries(categorized)
    .map(([name, properties]) => ({
      name,
      label: CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name,
      properties: properties.sort((a, b) => a.property.localeCompare(b.property))
    }))
    .filter(category => category.properties.length > 0);
};

// --- Styled Components ---------------------------------------------------------------------------------------------

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border border-gray-200 rounded-lg bg-white mb-3 font-mono text-xs">
    {children}
  </div>
);

const Header: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 border-b border-gray-200 bg-gray-50">
    {children}
  </div>
);

const CSSSelector: React.FC<{ selector: string }> = ({ selector }) => (
  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
    <div className="text-sm font-semibold text-gray-800">{selector} {"{"}</div>
  </div>
);

const CategorySection: React.FC<{ 
  category: CSSCategory; 
  isExpanded: boolean; 
  onToggle: () => void;
  searchTerm: string;
}> = ({ category, isExpanded, onToggle, searchTerm }) => {
  const filteredProperties = searchTerm 
    ? category.properties.filter(prop => 
        prop.property.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : category.properties;

  if (filteredProperties.length === 0) return null;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div 
        className="px-4 py-2 bg-gray-25 cursor-pointer hover:bg-gray-50 flex items-center gap-2"
        onClick={onToggle}
      >
        {isExpanded ? (
          <IconChevronDown size={14} className="text-gray-500" />
        ) : (
          <IconChevronRight size={14} className="text-gray-500" />
        )}
        <span className="text-xs text-gray-600">/* {category.label} */</span>
      </div>
      {isExpanded && (
        <div className="px-4 pb-2">
          {filteredProperties.map((prop, index) => (
            <CSSProperty key={`${prop.property}-${index}`} property={prop} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
};

const CSSProperty: React.FC<{ property: CSSProperty; searchTerm: string }> = ({ property, searchTerm }) => {
  return (
    <div className="py-1">
      <div className="text-gray-800 ml-4">
        <span className="text-blue-600">{property.property}</span>
        <span className="text-gray-600">: </span>
        <span className="text-green-600">{property.value}</span>
        <span className="text-gray-600">;</span>
      </div>
    </div>
  );
};

const CSSClosing: React.FC = () => (
  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
    <div className="text-sm font-semibold text-gray-800">{"}"}</div>
  </div>
);

const SearchBar: React.FC<{
  search: string;
  onSearchChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}> = ({ search, onSearchChange, show, onToggle }) => {
  if (!show) return null;

  return (
    <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
      <div className="relative">
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <IconSearch size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
};

const EmptySection: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center text-gray-500 py-4 text-xs">
    {message}
  </div>
);

// --- Main Component ------------------------------------------------------------------------------------------------

export const ElementDiffSingleColumn: React.FC<ElementDiffSingleColumnProps> = ({ left, right }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['boxModel', 'typography']));

  const categories = useMemo(() => {
    // Use right data (final state) for display
    const styles = right.styles || {};
    return categorizeProperties(styles);
  }, [right]);

  const toggleSearch = () => setShowSearch(!showSearch);
  
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const totalProperties = categories.reduce((total, category) => total + category.properties.length, 0);

  return (
    <Container>
      <Header>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-gray-800">
              CSS Output
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {totalProperties} {totalProperties === 1 ? 'property' : 'properties'}
            </div>
          </div>
          <button
            onClick={toggleSearch}
            className={`p-1 rounded ${showSearch ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
            title="Toggle search"
          >
            <IconSearch size={14} />
          </button>
        </div>
      </Header>

      <SearchBar 
        search={searchTerm}
        onSearchChange={setSearchTerm}
        show={showSearch}
        onToggle={toggleSearch}
      />

      {totalProperties === 0 ? (
        <EmptySection message="No CSS properties to display" />
      ) : (
        <>
          <CSSSelector selector=".selected" />
          
          {categories.map((category) => (
            <CategorySection
              key={category.name}
              category={category}
              isExpanded={expandedCategories.has(category.name)}
              onToggle={() => toggleCategory(category.name)}
              searchTerm={searchTerm}
            />
          ))}
          
          <CSSClosing />
        </>
      )}
    </Container>
  );
};