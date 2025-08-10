import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

// Main container for the diff popup
export const DiffContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  margin-bottom: 14px;
  font-size: 12px;
  font-family: system-ui, sans-serif;
`;

// Header container
export const HeaderContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

// Header info section
export const HeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

// Header title container
export const HeaderTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

// Header icon
export const HeaderIcon = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
`;

// Header title
export const HeaderTitle = styled.h3`
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Selector info container
export const SelectorInfo = styled.div`
  margin-top: 4px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 10px;
  color: #64748b;
`;

// Selector info item
export const SelectorInfoItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  span {
    text-transform: capitalize;
  }
`;

// Info badge
export const InfoBadge = styled.span`
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
`;

// Header controls container
export const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

// Base button styles
const BaseButton = styled.button<{ $active?: boolean; $disabled?: boolean }>`
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

// Search button
export const SearchButton = styled(BaseButton)<{ $active?: boolean }>`
  background: ${props => props.$active ? '#2563eb' : '#e2e8f0'};
  color: ${props => props.$active ? '#ffffff' : '#334155'};
`;

// Copy button
export const CopyButton = styled(BaseButton)<{ $copied?: boolean }>`
  background: ${props => props.$copied ? '#16a34a' : '#3b82f6'};
  color: #ffffff;

  span {
    display: none;
    pointer-events: none;
  }
`;

// Child styles button
export const ChildStylesButton = styled(BaseButton)<{ $active?: boolean }>`
  background: ${props => props.$active ? '#7c3aed' : '#f59e0b'};
  color: #ffffff;
`;

// Filter controls container
export const FilterControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

// Filter button variants
const filterButtonVariants = {
  added: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    color: '#065f46'
  },
  removed: {
    bg: '#fff1f2',
    border: '#fecdd3',
    color: '#881337'
  },
  modified: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1e3a8a'
  },
  category: {
    bg: '#f8fafc',
    border: '#cbd5e1',
    color: '#475569'
  }
};

export const FilterButton = styled(BaseButton)<{ 
  $variant: 'added' | 'removed' | 'modified' | 'category';
  $active?: boolean;
}>`
  background: ${props => props.$active ? filterButtonVariants[props.$variant].bg : '#ffffff'};
  border-color: ${props => filterButtonVariants[props.$variant].border};
  color: ${props => filterButtonVariants[props.$variant].color};
  opacity: ${props => props.$active ? 1 : 0.55};

  span {
    text-transform: capitalize;

    &:last-child {
      font-weight: 500;
      opacity: 0.7;
    }
  }
`;

// Search bar container
export const SearchBarContainer = styled(motion.div)`
  overflow: hidden;
  border-bottom: 1px solid #e2e8f0;
  background: #f1f5f9;
`;

export const SearchBarContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
`;

export const SearchInput = styled.input`
  flex: 1;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 4px 6px;
  font-family: monospace;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

export const ClearSearchButton = styled.button`
  border: 1px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px;
  display: inline-flex;
  align-items: center;

  &:hover {
    background: #f8fafc;
  }
`;

// List container
export const ListContainer = styled.div`
  max-height: 360px;
  overflow: auto;
  position: relative;
`;

// Legend container
export const LegendContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: min-content 160px 1fr 1fr 40px;
  gap: 4px;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 600;
  color: #475569;

  span {
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &:first-child {
      opacity: 0;
    }
  }
`;

// Property row container
export const PropertyRowContainer = styled(motion.div)<{ $variant: 'added' | 'removed' | 'modified' }>`
  ${props => {
    const variants = {
      added: {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        color: '#065f46',
        badgeOld: '#f1f5f9',
        badgeNew: '#d1fae5'
      },
      removed: {
        bg: '#fff1f2',
        border: '#fecdd3',
        color: '#881337',
        badgeOld: '#ffe4e6',
        badgeNew: '#f1f5f9'
      },
      modified: {
        bg: '#eff6ff',
        border: '#bfdbfe',
        color: '#1e3a8a',
        badgeOld: '#fee2e2',
        badgeNew: '#dcfce7'
      }
    };
    const variant = variants[props.$variant];
    return css`
      --bg-color: ${variant.bg};
      --border-color: ${variant.border};
      --text-color: ${variant.color};
      --badge-old-color: ${variant.badgeOld};
      --badge-new-color: ${variant.badgeNew};
    `;
  }}

  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  border-radius: 6px;
  padding: 6px 8px;
  display: grid;
  grid-template-columns: min-content 160px 1fr 1fr 40px;
  align-items: stretch;
  gap: 8px;
  font-size: 11px;
  font-family: monospace;
`;

export const PropertyRowIcon = styled.div`
  padding-top: 2px;
`;

export const PropertyRowInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const PropertyName = styled.div`
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PropertyChangeType = styled.div`
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: #64748b;
  text-transform: uppercase;
`;

export const PropertyValue = styled.div<{ 
  $hasValue?: boolean; 
  $isOld?: boolean; 
  $changeType: 'added' | 'removed' | 'modified';
}>`
  background: ${props => {
    if (!props.$hasValue) return '#f8fafc';
    if (props.$isOld) {
      // Red background for old/removed values (Snapshot 1)
      return '#fee2e2'; // Light red background
    } else {
      // Green background for new/added values (Snapshot 2)
      return '#dcfce7'; // Light green background
    }
  }};
  border: 1px solid ${props => {
    if (!props.$hasValue) return '#cbd5e1';
    if (props.$isOld) {
      return '#fecaca'; // Red border for old values
    } else {
      return '#bbf7d0'; // Green border for new values
    }
  }};
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 32px;
`;

export const PropertyValueText = styled.span<{ 
  $changeType: 'added' | 'removed' | 'modified';
  $isOld?: boolean;
  $hasValue?: boolean;
}>`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: ${props => props.$changeType === 'removed' && !props.$isOld ? 'none' : 
    props.$changeType === 'removed' && props.$isOld ? 'line-through' : 'none'};
  opacity: ${props => props.$changeType === 'modified' && props.$isOld && props.$hasValue ? 0.75 : 1};
  color: ${props => props.$changeType === 'removed' && !props.$isOld ? '#94a3b8' : 'inherit'};
  font-weight: ${props => (props.$changeType === 'added' || props.$changeType === 'modified') && !props.$isOld ? 600 : 400};
`;

export const PropertyValueBadge = styled.span<{ $variant: 'none' | 'was' | 'old' | 'new' }>`
  font-size: 9px;
  color: #ffffff;
  padding: 2px 4px;
  border-radius: 3px;
  background: ${props => {
    switch (props.$variant) {
      case 'none': return '#94a3b8';
      case 'was': return '#f43f5e';
      case 'old': return '#f59e0b';
      case 'new': return '#16a34a';
      default: return '#94a3b8';
    }
  }};
`;

export const PropertyCopyButton = styled.button<{ $copied?: boolean }>`
  background: ${props => props.$copied ? '#16a34a' : '#f1f5f9'};
  color: ${props => props.$copied ? '#ffffff' : '#334155'};
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;

  &:hover {
    transform: translateY(-1px);
  }
`;

// Virtual list containers
export const VirtualListContainer = styled.div<{ $height?: number }>`
  position: relative;
  height: ${props => props.$height ? `${props.$height}px` : 'auto'};
`;

export const VirtualListContent = styled.div<{ $virtualized?: boolean; $offsetY?: number }>`
  ${props => props.$virtualized ? css`
    position: absolute;
    inset: 0;
    transform: translateY(${props.$offsetY || 0}px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  ` : css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  `}
`;

// Empty state
export const EmptyState = styled.div`
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
`;