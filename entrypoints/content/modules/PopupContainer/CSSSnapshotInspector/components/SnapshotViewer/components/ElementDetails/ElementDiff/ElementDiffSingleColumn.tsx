import React, { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { generateClassCSS } from "./utils/cssGenerators";
import { AttributeChange, ClassChange, ElementDiffSingleColumnProps } from "./types";
import { categorizePropertiesWithDiff, compareAttributes, compareClasses } from "./utils/diffUtils.ts";
import { parseCSS, mergeStyleProperties } from "./utils/cssParsingUtils.ts";
import {
  AttributeRow,
  CSSClosing,
  CSSSelector,
  CategorySection,
  ClassRow,
  Container,
  EmptySection,
  Header,
  SearchBar,
} from "./components/subcomponents.tsx";

/**
 * Single-column element comparison
 * 
 * Declarative React component that shows the difference between the CSS properties
 * of two states of a DOM element in one column, with colour-coded changes.
 * 
 * The component automatically:
 * - Groups CSS properties by category
 * - Consolidates shorthand CSS rules
 * - Compares element attributes and classes
 * - Lets the user expand details
 * - Supports searching properties
 * 
 * @param props - Component props
 * @param props.left - Left element state to compare
 * @param props.right - Right element state to compare
 * @returns JSX element that visualises the difference
 */
export const ElementDiffSingleColumn: React.FC<ElementDiffSingleColumnProps> = ({ left, right, selector }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["boxModel", "typography"]));
  const [expandedShorthands, setExpandedShorthands] = useState<Record<string, boolean>>({});

  // Categorise CSS properties with the comparison
  const categories = useMemo(() => {
    // Generate CSS for the classes with cssGenerators
    const classCSS = generateClassCSS(left, right);

    // Parse the generated CSS to extract properties
    const leftClassProperties = parseCSS(classCSS.left);
    const rightClassProperties = parseCSS(classCSS.right);

    // Merge inline styles with class properties
    const mergedLeft = mergeStyleProperties(left.styles, leftClassProperties);
    const mergedRight = mergeStyleProperties(right.styles, rightClassProperties);

    return categorizePropertiesWithDiff(mergedLeft, mergedRight);
  }, [left, right]);

  // Compare element attributes and classes
  const { attributeChanges, classChanges } = useMemo(() => {
    const attrs = compareAttributes(left.attributes, right.attributes);
    const classes = compareClasses(left.classes, right.classes);
    return { attributeChanges: attrs, classChanges: classes };
  }, [left, right]);

  // Toggle the search field
  const toggleSearch = () => setShowSearch(!showSearch);

  // Toggle a category's expanded state
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

  // Toggle a shorthand property's expanded state
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
            <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">CSS Output</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {totalProperties} {totalProperties === 1 ? "property" : "properties"}
            </div>
          </div>
          <button
            onClick={toggleSearch}
            className={`p-1 rounded transition-colors ${showSearch ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"}`}
            title="Toggle search"
          >
            <IconSearch size={14} />
          </button>
        </div>
      </Header>

      <SearchBar search={searchTerm} onSearchChange={setSearchTerm} show={showSearch} />

      {totalProperties === 0 ? (
        <EmptySection message="No changes to display" />
      ) : (
        <>
          {/* Attributes Section */}
          {attributeChanges.length > 0 && (
            <div className="border-b border-gray-100 dark:border-gray-800">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Attributes ({attributeChanges.length} changes)
                </div>
              </div>
              <div className="px-4 pb-2">
                {attributeChanges
                  .filter((attr) => !searchTerm || attr.attribute.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((attr, index) => (
                    <AttributeRow key={`${attr.attribute}-${index}`} attribute={attr as AttributeChange} />
                  ))}
              </div>
            </div>
          )}

          {/* Classes Section */}
          {classChanges.length > 0 && (
            <div className="border-b border-gray-100 dark:border-gray-800">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Classes ({classChanges.length} changes)
                </div>
              </div>
              <div className="px-4 pb-2">
                {classChanges
                  .filter((cls) => !searchTerm || cls.className.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((cls, index) => (
                    <ClassRow
                      key={`${cls.className}-${index}`}
                      classNameStr={cls.className}
                      changeType={cls.changeType as "added" | "removed"}
                    />
                  ))}
              </div>
            </div>
          )}

          <CSSSelector selector={selector || ".selected"} />

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
