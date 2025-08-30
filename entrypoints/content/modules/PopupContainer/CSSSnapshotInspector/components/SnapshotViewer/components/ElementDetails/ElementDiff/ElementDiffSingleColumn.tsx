import React, { useMemo, useState } from "react";
import { IconSearch, IconChevronDown, IconChevronRight, IconPlus, IconMinus, IconTilde } from "@tabler/icons-react";
import { generateClassCSS } from "./utils/cssGenerators";

// --- Types ---------------------------------------------------------------------------------------------------------

interface ElementData {
  styles?: Record<string, any>;
  classRules?: Record<string, Record<string, any>>;
  attributes?: Record<string, string>;
  classes?: string[];
}

interface ElementDiffSingleColumnProps {
  left: ElementData;
  right: ElementData;
}

interface CSSProperty {
  property: string;
  value: string;
}

interface CSSPropertyChange {
  property: string;
  changeType: "added" | "removed" | "modified" | "unchanged";
  oldValue?: string;
  newValue?: string;
  currentValue: string;
}

interface ShorthandProperty {
  shorthand: string;
  individual: string[];
  isCollapsed: boolean;
  values: Record<string, string>;
  changeType: "added" | "removed" | "modified" | "unchanged";
}

interface CSSCategory {
  name: string;
  label: string;
  properties: CSSPropertyChange[];
  shorthands: ShorthandProperty[];
}

interface AttributeChange {
  attribute: string;
  changeType: "added" | "removed" | "modified" | "unchanged";
  oldValue?: string;
  newValue?: string;
  currentValue: string;
}

interface ClassChange {
  className: string;
  changeType: "added" | "removed";
}

// --- CSS Categories Configuration ----------------------------------------------------------------------------------

const CSS_CATEGORIES = {
  boxModel: [
    "width",
    "height",
    "min-width",
    "max-width",
    "min-height",
    "max-height",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border",
    "border-width",
    "border-style",
    "border-color",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-top-style",
    "border-right-style",
    "border-bottom-style",
    "border-left-style",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
  ],
  typography: [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "font-variant",
    "line-height",
    "letter-spacing",
    "word-spacing",
    "text-align",
    "text-decoration",
    "text-transform",
    "text-indent",
    "text-shadow",
    "color",
    "text-overflow",
    "white-space",
    "word-wrap",
    "word-break",
  ],
  background: [
    "background",
    "background-color",
    "background-image",
    "background-repeat",
    "background-position",
    "background-size",
    "background-attachment",
    "background-clip",
  ],
  layout: [
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "float",
    "clear",
    "z-index",
    "overflow",
    "overflow-x",
    "overflow-y",
    "visibility",
    "opacity",
  ],
  flexbox: [
    "flex",
    "flex-direction",
    "flex-wrap",
    "flex-flow",
    "justify-content",
    "align-items",
    "align-content",
    "align-self",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
  ],
};

const CATEGORY_LABELS = {
  boxModel: "Box Model",
  typography: "Typography",
  background: "Background",
  layout: "Layout",
  flexbox: "Flexbox",
};

// Shorthand property definitions
const SHORTHAND_PROPERTIES = {
  margin: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  padding: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  border: ["border-width", "border-style", "border-color"],
  "border-width": ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"],
  "border-style": ["border-top-style", "border-right-style", "border-bottom-style", "border-left-style"],
  "border-color": ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
  "border-radius": [
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
  ],
};

// --- Utility Functions ---------------------------------------------------------------------------------------------

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const compareProperties = (
  leftStyles: Record<string, any> = {},
  rightStyles: Record<string, any> = {},
): CSSPropertyChange[] => {
  const changes: CSSPropertyChange[] = [];
  const allProperties = new Set([...Object.keys(leftStyles), ...Object.keys(rightStyles)]);

  for (const property of allProperties) {
    const leftValue = leftStyles[property];
    const rightValue = rightStyles[property];
    const leftFormatted = formatValue(leftValue);
    const rightFormatted = formatValue(rightValue);

    if (leftValue === undefined) {
      // Property was added
      changes.push({
        property,
        changeType: "added",
        newValue: rightFormatted,
        currentValue: rightFormatted,
      });
    } else if (rightValue === undefined) {
      // Property was removed
      changes.push({
        property,
        changeType: "removed",
        oldValue: leftFormatted,
        currentValue: leftFormatted,
      });
    } else if (leftFormatted !== rightFormatted) {
      // Property was modified
      changes.push({
        property,
        changeType: "modified",
        oldValue: leftFormatted,
        newValue: rightFormatted,
        currentValue: rightFormatted,
      });
    } else {
      // Property unchanged
      changes.push({
        property,
        changeType: "unchanged",
        currentValue: rightFormatted,
      });
    }
  }

  return changes.sort((a, b) => a.property.localeCompare(b.property));
};

const consolidateShorthands = (
  properties: CSSPropertyChange[],
): { consolidated: ShorthandProperty[]; remaining: CSSPropertyChange[] } => {
  const consolidated: ShorthandProperty[] = [];
  const used = new Set<string>();
  const remaining: CSSPropertyChange[] = [];

  // Check for each shorthand property
  Object.entries(SHORTHAND_PROPERTIES).forEach(([shorthand, individuals]) => {
    const individualProps = individuals
      .map((prop) => properties.find((p) => p.property === prop && !used.has(p.property)))
      .filter(Boolean) as CSSPropertyChange[];

    if (individualProps.length === individuals.length) {
      // All individual properties are present, create shorthand
      const values: Record<string, string> = {};
      let overallChangeType: "added" | "removed" | "modified" | "unchanged" = "unchanged";

      individuals.forEach((prop, index) => {
        const change = individualProps[index];
        values[prop] = change.currentValue;
        used.add(prop);

        if (change.changeType !== "unchanged") {
          overallChangeType = change.changeType;
        }
      });

      // Generate shorthand value
      let shorthandValue = "";
      if (shorthand === "margin" || shorthand === "padding") {
        const [top, right, bottom, left] = individuals.map((prop) => values[prop]);
        if (top === right && right === bottom && bottom === left) {
          shorthandValue = top;
        } else if (top === bottom && right === left) {
          shorthandValue = `${top} ${right}`;
        } else if (right === left) {
          shorthandValue = `${top} ${right} ${bottom}`;
        } else {
          shorthandValue = `${top} ${right} ${bottom} ${left}`;
        }
      } else {
        shorthandValue = individuals.map((prop) => values[prop]).join(" ");
      }

      consolidated.push({
        shorthand,
        individual: individuals,
        isCollapsed: true,
        values,
        changeType: overallChangeType,
      });
    }
  });

  // Add remaining properties that weren't consolidated
  properties.forEach((prop) => {
    if (!used.has(prop.property)) {
      remaining.push(prop);
    }
  });

  return { consolidated, remaining };
};

const categorizePropertiesWithDiff = (
  leftStyles: Record<string, any> = {},
  rightStyles: Record<string, any> = {},
): CSSCategory[] => {
  // Get all property changes
  const allChanges = compareProperties(leftStyles, rightStyles);

  const categorized: Record<string, { properties: CSSPropertyChange[]; shorthands: ShorthandProperty[] }> = {};

  // Initialize categories
  Object.keys(CSS_CATEGORIES).forEach((category) => {
    categorized[category] = { properties: [], shorthands: [] };
  });

  // Categorize known properties
  Object.entries(CSS_CATEGORIES).forEach(([category, props]) => {
    const categoryChanges = allChanges.filter((change) => props.includes(change.property));

    // Consolidate shorthands for this category
    const { consolidated, remaining } = consolidateShorthands(categoryChanges);

    categorized[category].properties = remaining;
    categorized[category].shorthands = consolidated;
  });

  // Add uncategorized properties to layout category
  const usedProperties = new Set<string>();
  Object.values(categorized).forEach((cat) => {
    cat.properties.forEach((prop) => usedProperties.add(prop.property));
    cat.shorthands.forEach((shorthand) => {
      shorthand.individual.forEach((prop) => usedProperties.add(prop));
    });
  });

  const uncategorized = allChanges.filter((change) => !usedProperties.has(change.property));
  const { consolidated: uncategorizedShorthands, remaining: uncategorizedRemaining } =
    consolidateShorthands(uncategorized);

  categorized.layout.properties.push(...uncategorizedRemaining);
  categorized.layout.shorthands.push(...uncategorizedShorthands);

  // Convert to CSSCategory array and remove empty categories
  return Object.entries(categorized)
    .map(([name, { properties, shorthands }]) => ({
      name,
      label: CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name,
      properties: properties.sort((a, b) => a.property.localeCompare(b.property)),
      shorthands: shorthands.sort((a, b) => a.shorthand.localeCompare(b.shorthand)),
    }))
    .filter((category) => category.properties.length > 0 || category.shorthands.length > 0);
};

const compareAttributes = (
  leftAttributes: Record<string, string> = {},
  rightAttributes: Record<string, string> = {},
): AttributeChange[] => {
  const changes: AttributeChange[] = [];
  const allAttributes = new Set([...Object.keys(leftAttributes), ...Object.keys(rightAttributes)]);

  for (const attribute of allAttributes) {
    const leftValue = leftAttributes[attribute];
    const rightValue = rightAttributes[attribute];

    if (leftValue === undefined) {
      // Attribute was added
      changes.push({
        attribute,
        changeType: "added",
        newValue: rightValue,
        currentValue: rightValue,
      });
    } else if (rightValue === undefined) {
      // Attribute was removed
      changes.push({
        attribute,
        changeType: "removed",
        oldValue: leftValue,
        currentValue: leftValue,
      });
    } else if (leftValue !== rightValue) {
      // Attribute was modified
      changes.push({
        attribute,
        changeType: "modified",
        oldValue: leftValue,
        newValue: rightValue,
        currentValue: rightValue,
      });
    } else {
      // Attribute unchanged
      changes.push({
        attribute,
        changeType: "unchanged",
        currentValue: rightValue,
      });
    }
  }

  return changes.sort((a, b) => a.attribute.localeCompare(b.attribute));
};

const compareClasses = (leftClasses: string[] = [], rightClasses: string[] = []): ClassChange[] => {
  const changes: ClassChange[] = [];
  const leftSet = new Set(leftClasses);
  const rightSet = new Set(rightClasses);

  // Find added classes
  rightClasses.forEach((className) => {
    if (!leftSet.has(className)) {
      changes.push({
        className,
        changeType: "added",
      });
    }
  });

  // Find removed classes
  leftClasses.forEach((className) => {
    if (!rightSet.has(className)) {
      changes.push({
        className,
        changeType: "removed",
      });
    }
  });

  return changes.sort((a, b) => a.className.localeCompare(b.className));
};

// --- Styled Components ---------------------------------------------------------------------------------------------

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm mb-3 font-mono text-xs">{children}</div>
);

const Header: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 border-b border-gray-200 bg-gray-50">{children}</div>
);

const CSSSelector: React.FC<{ selector: string }> = ({ selector }) => (
  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
    <div className="text-sm font-semibold text-gray-800">
      {selector} {"{"}
    </div>
  </div>
);

const CategorySection: React.FC<{
  category: CSSCategory;
  isExpanded: boolean;
  onToggle: () => void;
  searchTerm: string;
  shorthandStates: Record<string, boolean>;
  onShorthandToggle: (shorthand: string) => void;
}> = ({ category, isExpanded, onToggle, searchTerm, shorthandStates, onShorthandToggle }) => {
  const filteredProperties = searchTerm
    ? category.properties.filter((prop) => prop.property.toLowerCase().includes(searchTerm.toLowerCase()))
    : category.properties;

  const filteredShorthands = searchTerm
    ? category.shorthands.filter((shorthand) => shorthand.shorthand.toLowerCase().includes(searchTerm.toLowerCase()))
    : category.shorthands;

  if (filteredProperties.length === 0 && filteredShorthands.length === 0) return null;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="px-4 py-2 bg-gray-25 cursor-pointer hover:bg-gray-50 flex items-center gap-2" onClick={onToggle}>
        {isExpanded ? (
          <IconChevronDown size={14} className="text-gray-500" />
        ) : (
          <IconChevronRight size={14} className="text-gray-500" />
        )}
        <span className="text-xs text-gray-600">/* {category.label} */</span>
      </div>
      {isExpanded && (
        <div className="px-4 pb-2">
          {filteredShorthands.map((shorthand, index) => (
            <ShorthandProperty
              key={`${shorthand.shorthand}-${index}`}
              shorthand={shorthand}
              searchTerm={searchTerm}
              isExpanded={shorthandStates[shorthand.shorthand] || false}
              onToggle={() => onShorthandToggle(shorthand.shorthand)}
            />
          ))}
          {filteredProperties.map((prop, index) => (
            <CSSPropertyChange key={`${prop.property}-${index}`} property={prop} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
};

const CSSPropertyChange: React.FC<{ property: CSSPropertyChange; searchTerm: string }> = ({ property, searchTerm }) => {
  const getChangeIcon = () => {
    switch (property.changeType) {
      case "added":
        return <IconPlus size={12} className="text-green-600" />;
      case "removed":
        return <IconMinus size={12} className="text-red-600" />;
      case "modified":
        return <IconTilde size={12} className="text-orange-600" />;
      default:
        return <div className="w-3"></div>;
    }
  };

  const getChangeStyles = () => {
    switch (property.changeType) {
      case "added":
        return "bg-green-50 border-l-2 border-green-500";
      case "removed":
        return "bg-red-50 border-l-2 border-red-500";
      case "modified":
        return "bg-orange-50 border-l-2 border-orange-500";
      default:
        return "";
    }
  };

  return (
    <div className={`py-1 ${getChangeStyles()}`}>
      <div className="text-gray-800 ml-2 flex items-center gap-2">
        {getChangeIcon()}
        <div className="flex-1">
          <div>
            <span className="text-blue-600">{property.property}</span>
            {property.changeType === "removed" ? (
              <>
                <span className="text-xs text-gray-500 ml-2">
                  <span className="text-red-600">{property.oldValue}</span>
                </span>
              </>
            ) : property.changeType === "modified" ? (
              <>
                <span className="text-xs text-gray-500 ml-2">
                  <span className="text-green-600">{property.newValue}</span>
                  <span className="text-red-600">{property.oldValue}</span>
                </span>
              </>
            ) : property.changeType === "added" ? (
              <>
                <span className="text-xs text-gray-500 ml-2">
                  <span className="text-green-600">{property.newValue}</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-600">: </span>
                <span className="text-green-600">{property.currentValue}</span>
                <span className="text-gray-600">;</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShorthandProperty: React.FC<{
  shorthand: ShorthandProperty;
  searchTerm: string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ shorthand, searchTerm, isExpanded, onToggle }) => {
  const getChangeIcon = () => {
    switch (shorthand.changeType) {
      case "added":
        return <IconPlus size={12} className="text-green-600" />;
      case "removed":
        return <IconMinus size={12} className="text-red-600" />;
      case "modified":
        return <IconTilde size={12} className="text-orange-600" />;
      default:
        return <div className="w-3"></div>;
    }
  };

  const getChangeStyles = () => {
    switch (shorthand.changeType) {
      case "added":
        return "bg-green-50 border-l-2 border-green-500";
      case "removed":
        return "bg-red-50 border-l-2 border-red-500";
      case "modified":
        return "bg-orange-50 border-l-2 border-orange-500";
      default:
        return "";
    }
  };

  // Generate shorthand value
  let shorthandValue = "";
  if (shorthand.shorthand === "margin" || shorthand.shorthand === "padding") {
    const [top, right, bottom, left] = shorthand.individual.map((prop) => shorthand.values[prop]);
    if (top === right && right === bottom && bottom === left) {
      shorthandValue = top;
    } else if (top === bottom && right === left) {
      shorthandValue = `${top} ${right}`;
    } else if (right === left) {
      shorthandValue = `${top} ${right} ${bottom}`;
    } else {
      shorthandValue = `${top} ${right} ${bottom} ${left}`;
    }
  } else {
    shorthandValue = shorthand.individual.map((prop) => shorthand.values[prop]).join(" ");
  }

  return (
    <div className={`py-1 ${getChangeStyles()}`}>
      <div className="text-gray-800 ml-4">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 py-1" onClick={onToggle}>
          {getChangeIcon()}
          {isExpanded ? (
            <IconChevronDown size={12} className="text-gray-500" />
          ) : (
            <IconChevronRight size={12} className="text-gray-500" />
          )}
          <div className="flex-1">
            <span className="text-blue-600">{shorthand.shorthand}</span>
            <span className="text-gray-600">: </span>
            <span className="text-green-600">{shorthandValue}</span>
            <span className="text-gray-600">;</span>
          </div>
        </div>
        {isExpanded && (
          <div className="ml-6 mt-1 border-l border-gray-200 pl-4">
            {shorthand.individual.map((prop) => (
              <div key={prop} className="py-0.5 text-xs">
                <span className="text-blue-500">{prop}</span>
                <span className="text-gray-500">: </span>
                <span className="text-green-500">{shorthand.values[prop]}</span>
                <span className="text-gray-500">;</span>
              </div>
            ))}
          </div>
        )}
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
  <div className="text-center text-gray-500 py-4 text-xs">{message}</div>
);

const AttributeChangeComponent: React.FC<{ attribute: AttributeChange; searchTerm: string }> = ({
  attribute,
  searchTerm,
}) => {
  const getChangeIcon = () => {
    switch (attribute.changeType) {
      case "added":
        return <IconPlus size={12} className="text-green-600" />;
      case "removed":
        return <IconMinus size={12} className="text-red-600" />;
      case "modified":
        return <IconTilde size={12} className="text-orange-600" />;
      default:
        return <div className="w-3"></div>;
    }
  };

  const getChangeStyles = () => {
    switch (attribute.changeType) {
      case "added":
        return "bg-green-50 border-l-2 border-green-500";
      case "removed":
        return "bg-red-50 border-l-2 border-red-500";
      case "modified":
        return "bg-orange-50 border-l-2 border-orange-500";
      default:
        return "";
    }
  };

  return (
    <div className={`py-1 ${getChangeStyles()}`}>
      <div className="text-gray-800 ml-2 flex items-center gap-2">
        {getChangeIcon()}
        <div className="flex-1">
          <div>
            <span className="text-purple-600">{attribute.attribute}</span>
            {attribute.changeType === "removed" ? (
              <>
                <span className="text-xs text-gray-500 ml-2">
                  <span className="text-red-600">"{attribute.oldValue}"</span>
                </span>
              </>
            ) : attribute.changeType === "modified" ? (
              <>
                <span className="text-xs text-gray-500 ml-2">
                  <span className="text-green-600">"{attribute.newValue}"</span>
                  <span className="mx-1 text-gray-400">→</span>
                  <span className="text-red-600">"{attribute.oldValue}"</span>
                </span>
              </>
            ) : attribute.changeType === "added" ? (
              <>
                <span className="text-xs text-gray-500 ml-2">
                  <span className="text-green-600">"{attribute.newValue}"</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-600">="</span>
                <span className="text-green-600">"{attribute.currentValue}"</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClassChangeComponent: React.FC<{ classChange: ClassChange; searchTerm: string }> = ({
  classChange,
  searchTerm,
}) => {
  const getChangeIcon = () => {
    switch (classChange.changeType) {
      case "added":
        return <IconPlus size={12} className="text-green-600" />;
      case "removed":
        return <IconMinus size={12} className="text-red-600" />;
      default:
        return <div className="w-3"></div>;
    }
  };

  const getChangeStyles = () => {
    switch (classChange.changeType) {
      case "added":
        return "bg-green-50 border-l-2 border-green-500";
      case "removed":
        return "bg-red-50 border-l-2 border-red-500";
      default:
        return "";
    }
  };

  return (
    <div className={`py-1 ${getChangeStyles()}`}>
      <div className="text-gray-800 ml-2 flex items-center gap-2">
        {getChangeIcon()}
        <div className="flex-1">
          <div>
            <span className="text-indigo-600">{classChange.className}</span>
            <span className="text-xs text-gray-500 ml-2">
              {classChange.changeType === "added" ? "(added)" : "(removed)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ------------------------------------------------------------------------------------------------

export const ElementDiffSingleColumn: React.FC<ElementDiffSingleColumnProps> = ({ left, right }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["boxModel", "typography"]));
  const [expandedShorthands, setExpandedShorthands] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => {
    // Generate class CSS using the cssGenerators function
    const classCSS = generateClassCSS(left, right);

    // Parse the generated CSS to extract properties for comparison
    const parseCSS = (cssText: string): Record<string, string> => {
      const properties: Record<string, string> = {};
      if (!cssText) return properties;

      // Extract CSS properties from the generated CSS text
      const cssLines = cssText.split("\n");
      for (const line of cssLines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes(":") && trimmed.endsWith(";")) {
          const colonIndex = trimmed.indexOf(":");
          const property = trimmed.substring(0, colonIndex).trim();
          const value = trimmed.substring(colonIndex + 1, trimmed.length - 1).trim();
          if (property && value) {
            properties[property] = value;
          }
        }
      }
      return properties;
    };

    // Parse left and right class CSS
    const leftClassProperties = parseCSS(classCSS.left);
    const rightClassProperties = parseCSS(classCSS.right);

    // Merge inline styles with class properties
    const mergedLeft = { ...(left.styles || {}), ...leftClassProperties };
    const mergedRight = { ...(right.styles || {}), ...rightClassProperties };

    return categorizePropertiesWithDiff(mergedLeft, mergedRight);
  }, [left, right]);

  const { attributeChanges, classChanges } = useMemo(() => {
    const attrs = compareAttributes(left.attributes, right.attributes);
    const classes = compareClasses(left.classes, right.classes);
    return { attributeChanges: attrs, classChanges: classes };
  }, [left, right]);

  const toggleSearch = () => setShowSearch(!showSearch);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleShorthand = (shorthand: string) => {
    setExpandedShorthands((prev) => ({
      ...prev,
      [shorthand]: !prev[shorthand],
    }));
  };

  const totalProperties =
    categories.reduce((total, category) => total + category.properties.length + category.shorthands.length, 0) +
    attributeChanges.length +
    classChanges.length;

  return (
    <Container>
      <Header>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-gray-800">CSS Output</div>
            <div className="text-xs text-gray-600 mt-1">
              {totalProperties} {totalProperties === 1 ? "property" : "properties"}
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

      <SearchBar search={searchTerm} onSearchChange={setSearchTerm} show={showSearch} onToggle={toggleSearch} />

      {totalProperties === 0 ? (
        <EmptySection message="No changes to display" />
      ) : (
        <>
          {/* Attributes Section */}
          {attributeChanges.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-800">
                  Attributes ({attributeChanges.length} changes)
                </div>
              </div>
              <div className="px-4 pb-2">
                {attributeChanges
                  .filter((attr) => !searchTerm || attr.attribute.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((attr, index) => (
                    <AttributeChangeComponent
                      key={`${attr.attribute}-${index}`}
                      attribute={attr}
                      searchTerm={searchTerm}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Classes Section */}
          {classChanges.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-800">Classes ({classChanges.length} changes)</div>
              </div>
              <div className="px-4 pb-2">
                {classChanges
                  .filter((cls) => !searchTerm || cls.className.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((cls, index) => (
                    <ClassChangeComponent key={`${cls.className}-${index}`} classChange={cls} searchTerm={searchTerm} />
                  ))}
              </div>
            </div>
          )}

          <CSSSelector selector=".selected" />

          {categories.map((category) => (
            <CategorySection
              key={category.name}
              category={category}
              isExpanded={expandedCategories.has(category.name)}
              onToggle={() => toggleCategory(category.name)}
              searchTerm={searchTerm}
              shorthandStates={expandedShorthands}
              onShorthandToggle={toggleShorthand}
            />
          ))}

          <CSSClosing />
        </>
      )}
    </Container>
  );
};
