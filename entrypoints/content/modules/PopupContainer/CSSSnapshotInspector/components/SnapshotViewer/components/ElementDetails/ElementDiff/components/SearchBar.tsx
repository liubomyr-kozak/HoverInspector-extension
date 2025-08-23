import React from "react";
import { IconSearch, IconX } from "@tabler/icons-react";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onToggle: () => void;
  show: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  search, 
  onSearchChange, 
  onToggle, 
  show 
}) => {
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