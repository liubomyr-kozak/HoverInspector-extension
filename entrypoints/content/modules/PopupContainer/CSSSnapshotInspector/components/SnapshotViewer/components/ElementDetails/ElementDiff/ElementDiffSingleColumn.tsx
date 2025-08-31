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
 * Порівняння елементів в одній колонці
 * 
 * Декларативний React компонент для відображення різниці між CSS властивостями
 * двох станів DOM елементу в єдиній колонці з кольоровим кодуванням змін.
 * 
 * Компонент автоматично:
 * - Категоризує CSS властивості за типами
 * - Консолідує скорочені CSS правила
 * - Порівнює атрибути та класи елементів
 * - Забезпечує інтерактивне розгортання деталей
 * - Підтримує пошук по властивостях
 * 
 * @param props - Властивості компонента
 * @param props.left - Лівий стан елементу для порівняння
 * @param props.right - Правий стан елементу для порівняння
 * @returns JSX елемент з візуалізацією різниці
 */
export const ElementDiffSingleColumn: React.FC<ElementDiffSingleColumnProps> = ({ left, right }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["boxModel", "typography"]));
  const [expandedShorthands, setExpandedShorthands] = useState<Record<string, boolean>>({});

  // Категоризація CSS властивостей з порівнянням
  const categories = useMemo(() => {
    // Генеруємо CSS для класів використовуючи cssGenerators
    const classCSS = generateClassCSS(left, right);

    // Парсимо згенерований CSS для витягування властивостей
    const leftClassProperties = parseCSS(classCSS.left);
    const rightClassProperties = parseCSS(classCSS.right);

    // Об'єднуємо інлайн стилі з властивостями класів
    const mergedLeft = mergeStyleProperties(left.styles, leftClassProperties);
    const mergedRight = mergeStyleProperties(right.styles, rightClassProperties);

    return categorizePropertiesWithDiff(mergedLeft, mergedRight);
  }, [left, right]);

  // Порівняння атрибутів та класів елементів
  const { attributeChanges, classChanges } = useMemo(() => {
    const attrs = compareAttributes(left.attributes, right.attributes);
    const classes = compareClasses(left.classes, right.classes);
    return { attributeChanges: attrs, classChanges: classes };
  }, [left, right]);

  // Перемикання відображення пошуку
  const toggleSearch = () => setShowSearch(!showSearch);

  // Перемикання розгорнутого стану категорії
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

  // Перемикання розгорнутого стану скороченої властивості
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
