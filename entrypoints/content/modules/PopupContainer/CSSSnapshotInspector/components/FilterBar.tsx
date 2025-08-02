/**
 * Оптимізований компонент панелі фільтрів для CSS Snapshot Inspector
 */
import React, { memo } from 'react';
import { FilterContainer, FilterInput } from '../CSSSnapshotInspector.styled';

interface FilterBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

/**
 * Мемоізований компонент панелі фільтрів
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