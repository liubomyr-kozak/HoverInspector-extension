import { useState, useMemo } from "react";
import type { CSSDiff } from "../../../../../utils/cssParser.ts";

export interface UseElementDiffSearchResult {
  search: string;
  showSearch: boolean;
  setSearch: (value: string) => void;
  setShowSearch: (show: boolean) => void;
  toggleSearch: () => void;
  filteredCSSBlocks: {
    left: string;
    right: string;
  };
}

export const useElementDiffSearch = (cssBlocks: { left: string; right: string }) => {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = () => setShowSearch(!showSearch);

  const filteredCSSBlocks = useMemo(() => {
    if (!search.trim()) return cssBlocks;
    const searchLower = search.toLowerCase();
    return {
      left: cssBlocks.left.toLowerCase().includes(searchLower) ? cssBlocks.left : "",
      right: cssBlocks.right.toLowerCase().includes(searchLower) ? cssBlocks.right : "",
    };
  }, [cssBlocks, search]);

  return {
    search,
    showSearch,
    setSearch,
    setShowSearch,
    toggleSearch,
    filteredCSSBlocks,
  };
};