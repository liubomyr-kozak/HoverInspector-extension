import React from 'react';
import { IconPlus, IconMinus, IconArrowsExchange, IconPalette, IconTypography, IconLayout, IconBorderAll, IconShadow, IconDimensions } from '@tabler/icons-react';
import { FilterControlsContainer, FilterButton } from './styled';

interface FilterState {
  added: boolean;
  removed: boolean;
  modified: boolean;
}

interface CategoryFilterState {
  color: boolean;
  typography: boolean;
  spacing: boolean;
  sizing: boolean;
  borders: boolean;
  shadows: boolean;
  other: boolean;
}

interface FilterControlsProps {
  filters: FilterState;
  categoryFilters?: CategoryFilterState;
  totals: {
    added: number;
    removed: number;
    modified: number;
  };
  categoryTotals?: {
    color: number;
    typography: number;
    spacing: number;
    sizing: number;
    borders: number;
    shadows: number;
    other: number;
  };
  onFilterChange: (filters: FilterState) => void;
  onCategoryFilterChange?: (filters: CategoryFilterState) => void;
}

type ChangeKind = 'added' | 'removed' | 'modified';

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  categoryFilters,
  totals,
  categoryTotals,
  onFilterChange,
  onCategoryFilterChange
}) => {
  const handleFilterToggle = (kind: ChangeKind) => {
    onFilterChange({ ...filters, [kind]: !filters[kind] });
  };

  const handleCategoryFilterToggle = (category: keyof CategoryFilterState) => {
    if (categoryFilters && onCategoryFilterChange) {
      onCategoryFilterChange({ ...categoryFilters, [category]: !categoryFilters[category] });
    }
  };

  const renderFilterButton = (kind: ChangeKind) => {
    const active = filters[kind];
    const total = totals[kind];

    const getIcon = () => {
      switch (kind) {
        case 'added': return <IconPlus size={12} />;
        case 'removed': return <IconMinus size={12} />;
        case 'modified': return <IconArrowsExchange size={12} />;
      }
    };

    return (
      <FilterButton
        key={kind}
        $variant={kind}
        $active={active}
        aria-pressed={active}
        onClick={() => handleFilterToggle(kind)}
        title={`${kind} (${total})`}
      >
        {getIcon()}
        <span>{kind}</span>
        <span>{total}</span>
      </FilterButton>
    );
  };

  const renderCategoryFilterButton = (category: keyof CategoryFilterState) => {
    if (!categoryFilters || !categoryTotals || !onCategoryFilterChange) return null;
    
    const active = categoryFilters[category];
    const total = categoryTotals[category];

    const getCategoryIcon = () => {
      switch (category) {
        case 'color': return <IconPalette size={12} />;
        case 'typography': return <IconTypography size={12} />;
        case 'spacing': return <IconLayout size={12} />;
        case 'sizing': return <IconDimensions size={12} />;
        case 'borders': return <IconBorderAll size={12} />;
        case 'shadows': return <IconShadow size={12} />;
        case 'other': return <span style={{ fontSize: '12px' }}>•••</span>;
        default: return null;
      }
    };

    return (
      <FilterButton
        key={category}
        $variant="category"
        $active={active}
        aria-pressed={active}
        onClick={() => handleCategoryFilterToggle(category)}
        title={`${category} (${total})`}
      >
        {getCategoryIcon()}
        <span>{category}</span>
        <span>{total}</span>
      </FilterButton>
    );
  };

  return (
    <FilterControlsContainer>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {(['added', 'removed', 'modified'] as const).map(renderFilterButton)}
      </div>
      {categoryFilters && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['color', 'typography', 'spacing', 'sizing', 'borders', 'shadows', 'other'] as const).map(renderCategoryFilterButton)}
        </div>
      )}
    </FilterControlsContainer>
  );
};