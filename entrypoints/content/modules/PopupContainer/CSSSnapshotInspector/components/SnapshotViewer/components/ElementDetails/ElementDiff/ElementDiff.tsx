import { convertElementDiffToCSSDiff } from "../../../../utils/cssParser.ts";
import React, { useEffect, useMemo } from "react";
import { IconSearch } from "@tabler/icons-react";
import { ElementDiffData } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/utils/simpleDiff.ts";

// Hooks
import { useViewMode } from "./hooks/useViewMode";
import { useElementDiffSearch } from "./hooks/useElementDiffSearch";
import { useChildStyles } from "./hooks/useChildStyles";

// Components
import { ClassView } from "./components/ClassView";
import { GroupedDiffView } from "./components/GroupedDiffView";
import { SearchBar } from "./components/SearchBar";
import { ViewModeToggle } from "./components/ViewModeToggle";

// Utils
import { hasDiffChanges, countDiffChanges } from "./utils/dataTransformers";
import hotkeys from "hotkeys-js";
import { closeElementDetails } from "@entrypoints/content/store/elementDetails/elementDetails.slice.ts";
import { useDispatch } from "react-redux";

// --- Types ---------------------------------------------------------------------------------------------------------

interface ElementNode {
  styles?: Record<string, any>;
  children?: ElementNode[];
  classRules?: Record<string, Record<string, any>>;
}

interface ElementDiffProps {
  diffData?: ElementDiffData;
  left?: ElementNode;
  right?: ElementNode;
  config?: Record<string, unknown>;
}

// --- Styled Components ---------------------------------------------------------------------------------------------

const DiffContainer: React.FC<{ children: React.ReactNode; [key: string]: unknown }> = ({ children, ...props }) => (
  <div className="border border-gray-200 rounded-lg bg-white mb-3 font-mono text-xs" {...props}>
    {children}
  </div>
);

const HeaderContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 border-b border-gray-200 bg-gray-50">{children}</div>
);

const HeaderTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-between mb-2">{children}</div>
);

// --- Main Component ------------------------------------------------------------------------------------------------

export const ElementDiff: React.FC<ElementDiffProps> = ({ diffData, left, right }) => {
  const dispatch = useDispatch();

  const leftData = diffData?.leftData || { styles: left?.styles || {} };
  const rightData = diffData?.rightData || { styles: right?.styles || {} };
  const diff = useMemo(
    () => convertElementDiffToCSSDiff(leftData, rightData, "Element Properties"),
    [leftData, rightData],
  );

  // Child styles management
  const { showChildStyles, childStyleDiff, toggleChildStyles, hasChildStyles } = useChildStyles(
    left || null,
    right || null,
    diff,
  );

  // Use child style diff when in child style mode, otherwise use original diff
  const activeDiff = showChildStyles ? childStyleDiff : diff;

  // Check if there are any changes using utility
  const hasChanges = hasDiffChanges(activeDiff);
  const changeCount = countDiffChanges(activeDiff);

  // Search functionality - create dummy CSS blocks for search hook
  const dummyCSSBlocks = { left: "", right: "" };
  const { search, showSearch, setSearch, setShowSearch, toggleSearch } = useElementDiffSearch(dummyCSSBlocks);

  // Keyboard shortcuts
  useEffect(() => {
    hotkeys("esc", function () {
      dispatch(closeElementDetails());
    });
  }, []);

  if (!hasChanges) {
    return (
      <div className="text-[11px] text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
        No property differences
      </div>
    );
  }

  console.log("🚀🚀🚀 ::ElementDiff -> activeDiff", activeDiff);

  return (
    <DiffContainer data-diff-popup>
      <HeaderContainer>
        <HeaderTitle>
          <div>
            <div className="font-semibold text-sm text-gray-800">
              {showChildStyles ? `${activeDiff?.selector} > children` : activeDiff?.selector}
            </div>
            <div className="text-xs text-gray-600 mt-1">{changeCount} properties changed</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className={`p-1 rounded ${showSearch ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
              title="Toggle search"
            >
              <IconSearch size={14} />
            </button>
            {left && right && hasChildStyles && (
              <button
                onClick={toggleChildStyles}
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
      </HeaderContainer>

      <SearchBar search={search} onSearchChange={setSearch} onToggle={toggleSearch} show={showSearch} />

      <GroupedDiffView diff={activeDiff} search={search} />
      <ClassView diff={activeDiff} search={search} leftNode={left || null} rightNode={right || null} />
    </DiffContainer>
  );
};
