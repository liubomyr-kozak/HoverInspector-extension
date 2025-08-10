import { CSSDiff, convertElementDiffToCSSDiff } from "../../../../utils/cssParser.ts";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconSearch, IconX, IconToggleLeft, IconToggleRight, IconEye, IconCode } from "@tabler/icons-react";
import { isColorValue } from "@entrypoints/shared/utils/isColorValue.ts";
import { isGradientValue } from "@entrypoints/shared/utils/isGradientValue";
import { ElementDiffData } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/simpleDiff.ts";

// --- Types ---------------------------------------------------------------------------------------------------------

interface ElementDiffProps {
  diffData?: ElementDiffData;
  left?: any;
  right?: any;
  config?: any;
}

interface PropertyDiff {
  property: string;
  leftValue: string | null;
  rightValue: string | null;
  changeType: "added" | "removed" | "modified";
}

type ViewMode = "computed" | "class";

// --- Styled Components ---------------------------------------------------------------------------------------------

const DiffContainer = ({ children, ...props }) => (
  <div className="border border-gray-200 rounded-lg bg-white mb-3 font-mono text-xs" {...props}>
    {children}
  </div>
);

const HeaderContainer = ({ children }) => <div className="p-3 border-b border-gray-200 bg-gray-50">{children}</div>;

const HeaderTitle = ({ children }) => <div className="flex items-center justify-between mb-2">{children}</div>;

const ViewModeToggle = ({ mode, onChange }) => (
  <div className="flex items-center gap-2 text-xs">
    <button
      onClick={() => onChange("computed")}
      className={`px-2 py-1 rounded flex items-center gap-1 ${
        mode === "computed"
          ? "bg-blue-100 text-blue-700 border border-blue-300"
          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
      }`}
    >
      <IconEye size={12} />
      Computed
    </button>
    <button
      onClick={() => onChange("class")}
      className={`px-2 py-1 rounded flex items-center gap-1 ${
        mode === "class"
          ? "bg-blue-100 text-blue-700 border border-blue-300"
          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
      }`}
    >
      <IconCode size={12} />
      Class View
    </button>
  </div>
);

const SearchBar = ({ search, onSearchChange, onToggle, show }) => {
  if (!show) return null;

  return (
    <div className="p-2 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <IconSearch size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search properties, values, selectors..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button onClick={onToggle} className="p-1 text-gray-500 hover:text-gray-700">
          <IconX size={14} />
        </button>
      </div>
    </div>
  );
};

const ComputedListView = ({ diff, search }) => {
  const cssBlocks = useMemo(() => {
    if (!diff) return { left: "", right: "" };

    const leftProperties: string[] = [];
    const rightProperties: string[] = [];

    // Build left snapshot CSS (original values)
    Object.entries(diff.removed).forEach(([prop, value]) => {
      if (prop === "attributes" || prop === "bounds" || prop === "classes" || prop === "styles") {
        leftProperties.push(`  ${prop}:${value}`);
      } else {
        leftProperties.push(`  ${prop}: ${value};`);
      }
    });
    Object.entries(diff.modified).forEach(([prop, change]) => {
      if (prop === "attributes" || prop === "bounds" || prop === "classes" || prop === "styles") {
        leftProperties.push(`  ${prop}:${change.old}`);
      } else {
        leftProperties.push(`  ${prop}: ${change.old};`);
      }
    });

    // Build right snapshot CSS (new values)
    Object.entries(diff.added).forEach(([prop, value]) => {
      if (prop === "attributes" || prop === "bounds" || prop === "classes" || prop === "styles") {
        rightProperties.push(`  ${prop}:${value}`);
      } else {
        rightProperties.push(`  ${prop}: ${value};`);
      }
    });
    Object.entries(diff.modified).forEach(([prop, change]) => {
      if (prop === "attributes" || prop === "bounds" || prop === "classes" || prop === "styles") {
        rightProperties.push(`  ${prop}:${change.new}`);
      } else {
        rightProperties.push(`  ${prop}: ${change.new};`);
      }
    });

    const selectorName = "ElementProperties";
    const leftCSS = leftProperties.length > 0 ? `${selectorName} {\n${leftProperties.join("\n")}\n}` : "";
    const rightCSS = rightProperties.length > 0 ? `${selectorName} {\n${rightProperties.join("\n")}\n}` : "";

    return { left: leftCSS, right: rightCSS };
  }, [diff]);

  const filteredBlocks = useMemo(() => {
    if (!search.trim()) return cssBlocks;
    const searchLower = search.toLowerCase();
    return {
      left: cssBlocks.left.toLowerCase().includes(searchLower) ? cssBlocks.left : "",
      right: cssBlocks.right.toLowerCase().includes(searchLower) ? cssBlocks.right : "",
    };
  }, [cssBlocks, search]);

  return (
    <div className="max-h-96 overflow-auto">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>
          <div className="font-semibold text-gray-700 mb-2 pb-2 border-b">Snapshot 1</div>
          <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-auto">
            <code>{filteredBlocks.left || "/* No styles */"}</code>
          </pre>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-2 pb-2 border-b">Snapshot 2</div>
          <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-auto">
            <code>{filteredBlocks.right || "/* No styles */"}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

const ClassView = ({ diff, search, leftNode, rightNode }) => {
  const cssBlocks = useMemo(() => {
    if (!diff) return { left: "", right: "" };

    // Build CSS from classRules data in leftNode and rightNode
    const buildClassCSS = (node: any): string => {
      if (!node || !node.classRules) return "";

      const cssRules: string[] = [];

      // Generate CSS for each class
      Object.entries(node.classRules).forEach(([className, rules]: [string, any]) => {
        if (rules && typeof rules === "object" && Object.keys(rules).length > 0) {
          const properties = Object.entries(rules)
            .map(([prop, value]) => `  ${prop}: ${value};`)
            .join("\n");

          cssRules.push(`.${className} {\n${properties}\n}`);
        }
      });

      return cssRules.join("\n\n");
    };

    const leftCSS = buildClassCSS(leftNode);
    const rightCSS = buildClassCSS(rightNode);

    return { left: leftCSS, right: rightCSS };
  }, [diff, leftNode, rightNode]);

  const filteredBlocks = useMemo(() => {
    if (!search.trim()) return cssBlocks;
    const searchLower = search.toLowerCase();
    return {
      left: cssBlocks.left.toLowerCase().includes(searchLower) ? cssBlocks.left : "",
      right: cssBlocks.right.toLowerCase().includes(searchLower) ? cssBlocks.right : "",
    };
  }, [cssBlocks, search]);

  return (
    <div className="max-h-96 overflow-auto">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>
          <div className="font-semibold text-gray-700 mb-2 pb-2 border-b">Snapshot 1</div>
          <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-auto">
            <code>{filteredBlocks.left || "/* No styles */"}</code>
          </pre>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-2 pb-2 border-b">Snapshot 2</div>
          <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-auto">
            <code>{filteredBlocks.right || "/* No styles */"}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

const PropertyValueRenderer = ({ value, className = "" }) => {
  const renderValueWithHighlight = (val: string) => {
    // Check if it's a color value
    if (isColorValue(val)) {
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <span
            className="inline-block w-3 h-3 rounded border border-gray-300"
            style={{ backgroundColor: val }}
            title={val}
          />
          {val}
        </span>
      );
    }

    // Check if it's a gradient
    if (isGradientValue(val)) {
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <span
            className="inline-block w-6 h-3 rounded border border-gray-300"
            style={{ backgroundImage: val }}
            title="gradient"
          />
          {val}
        </span>
      );
    }

    return <span className={className}>{val}</span>;
  };

  return <div>{renderValueWithHighlight(value)}</div>;
};

// --- Main Component ------------------------------------------------------------------------------------------------

export const ElementDiff: React.FC<ElementDiffProps> = ({ diffData, left, right }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("computed");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showChildStyles, setShowChildStyles] = useState(false);
  const [childStyleDiff, setChildStyleDiff] = useState<CSSDiff | null>(null);

  const leftData = diffData?.leftData || { styles: left?.styles || {} };
  const rightData = diffData?.rightData || { styles: right?.styles || {} };
  const diff = useMemo(
    () => convertElementDiffToCSSDiff(leftData, rightData, "Element Properties"),
    [leftData, rightData],
  );

  // Use child style diff when in child style mode, otherwise use original diff
  const activeDiff = showChildStyles ? childStyleDiff : diff;

  const hasChanges =
    activeDiff &&
    Object.keys(activeDiff.added).length +
      Object.keys(activeDiff.removed).length +
      Object.keys(activeDiff.modified).length >
      0;

  const properties = useMemo((): PropertyDiff[] => {
    if (!activeDiff) return [];

    const props: PropertyDiff[] = [];

    // Added properties
    Object.entries(activeDiff.added).forEach(([prop, value]) => {
      props.push({
        property: prop,
        leftValue: null,
        rightValue: value,
        changeType: "added",
      });
    });

    // Removed properties
    Object.entries(activeDiff.removed).forEach(([prop, value]) => {
      props.push({
        property: prop,
        leftValue: value,
        rightValue: null,
        changeType: "removed",
      });
    });

    // Modified properties
    Object.entries(activeDiff.modified).forEach(([prop, change]) => {
      props.push({
        property: prop,
        leftValue: change.old,
        rightValue: change.new,
        changeType: "modified",
      });
    });

    return props.sort((a, b) => a.property.localeCompare(b.property));
  }, [activeDiff]);

  const checkChildStyles = useCallback(() => {
    if (!left || !right) {
      console.warn("No element data available for child style checking");
      return;
    }

    if (showChildStyles) {
      setShowChildStyles(false);
      setChildStyleDiff(null);
      return;
    }

    // Simple child styles collection - just direct children
    const leftChildStyles: Record<string, string> = {};
    const rightChildStyles: Record<string, string> = {};

    const collectDirectChildStyles = (node: any, styles: Record<string, string>) => {
      if (!node?.children) return;

      node.children.forEach((child: any, index: number) => {
        if (child.styles) {
          Object.entries(child.styles).forEach(([prop, value]) => {
            styles[`child[${index}].${prop}`] = String(value);
          });
        }
      });
    };

    collectDirectChildStyles(left, leftChildStyles);
    collectDirectChildStyles(right, rightChildStyles);

    if (Object.keys(leftChildStyles).length === 0 && Object.keys(rightChildStyles).length === 0) {
      return;
    }

    const childDiff = convertElementDiffToCSSDiff(
      leftChildStyles,
      rightChildStyles,
      `${diff?.selector || "Element"} > children`,
    );

    setChildStyleDiff(childDiff);
    setShowChildStyles(true);
  }, [left, right, showChildStyles, diff]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const container = document.querySelector("[data-diff-popup]");
        if (container) {
          container.dispatchEvent(new CustomEvent("diff-popup:close", { bubbles: true }));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!hasChanges) {
    return (
      <div className="text-[11px] text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
        No property differences
      </div>
    );
  }

  return (
    <DiffContainer data-diff-popup>
      <HeaderContainer>
        <HeaderTitle>
          <div>
            <div className="font-semibold text-sm text-gray-800">
              {showChildStyles ? `${activeDiff?.selector} > children` : activeDiff?.selector}
            </div>
            <div className="text-xs text-gray-600 mt-1">{properties.length} properties changed</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1 rounded ${showSearch ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
              title="Toggle search"
            >
              <IconSearch size={14} />
            </button>
            {left && right && (
              <button
                onClick={checkChildStyles}
                className={`px-2 py-1 rounded text-xs ${
                  showChildStyles
                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                title={showChildStyles ? "Back to element styles" : "Check child element styles"}
              >
                {showChildStyles ? "← Element" : "Children"}
              </button>
            )}
          </div>
        </HeaderTitle>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </HeaderContainer>

      <SearchBar search={search} onSearchChange={setSearch} onToggle={() => setShowSearch(false)} show={showSearch} />

      {viewMode === "computed" ? (
        <ComputedListView diff={activeDiff} search={search} />
      ) : (
        <ClassView diff={activeDiff} search={search} leftNode={left} rightNode={right} />
      )}
    </DiffContainer>
  );
};
