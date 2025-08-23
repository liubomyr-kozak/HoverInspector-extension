import React from "react";
import type { CSSDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/utils/cssParser.ts";
import { generateComputedCSS } from "../utils/cssGenerators";
import { useElementDiffSearch } from "../hooks/useElementDiffSearch";

interface ComputedListViewProps {
  diff: CSSDiff | null;
  search: string;
}

export const ComputedListView: React.FC<ComputedListViewProps> = ({ diff, search }) => {
  const cssBlocks = generateComputedCSS(diff);
  const { filteredCSSBlocks } = useElementDiffSearch(cssBlocks);

  // Apply search filter
  const displayBlocks = search.trim() 
    ? {
        left: cssBlocks.left.toLowerCase().includes(search.toLowerCase()) ? cssBlocks.left : "",
        right: cssBlocks.right.toLowerCase().includes(search.toLowerCase()) ? cssBlocks.right : "",
      }
    : cssBlocks;

  return (
    <div className="max-h-96 overflow-auto">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>
          <div className="font-semibold text-gray-700 mb-2 pb-2 border-b">Snapshot 1</div>
          <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-auto">
            <code>{displayBlocks.left || "/* No styles */"}</code>
          </pre>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-2 pb-2 border-b">Snapshot 2</div>
          <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-auto">
            <code>{displayBlocks.right || "/* No styles */"}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};