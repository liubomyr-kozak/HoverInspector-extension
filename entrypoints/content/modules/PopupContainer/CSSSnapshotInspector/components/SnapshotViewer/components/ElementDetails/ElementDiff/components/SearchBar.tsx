import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  SearchBarContainer,
  SearchBarContent,
  SearchInput,
  ClearSearchButton
} from './styled';

interface SearchBarProps {
  showSearch: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  showSearch, 
  search, 
  onSearchChange 
}) => {
  return (
    <AnimatePresence initial={false}>
      {showSearch && (
        <SearchBarContainer
          key="search-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <SearchBarContent>
            <IconSearch size={14} color="#64748b" />
            <SearchInput
              aria-label="Search property"
              placeholder="Search properties..."
              autoFocus
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {search && (
              <ClearSearchButton
                aria-label="Clear search"
                onClick={() => onSearchChange("")}
              >
                <IconX size={14} />
              </ClearSearchButton>
            )}
          </SearchBarContent>
        </SearchBarContainer>
      )}
    </AnimatePresence>
  );
};