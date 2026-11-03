/**
 * Optimised filter bar for the CSS Snapshot Inspector
 */
import React, { memo } from 'react';
import { FilterContainer, FilterInput } from '../CSSSnapshotInspector.styled';

interface FilterBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

/**
 * Memoised filter bar
 */
export const FilterBar = memo<FilterBarProps>(({
  value,
  onChange,
  placeholder = 'Filter snapshots...'
}) => {
  return (
    <FilterContainer>
      <FilterInput
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter snapshots"
      />
    </FilterContainer>
  );
});