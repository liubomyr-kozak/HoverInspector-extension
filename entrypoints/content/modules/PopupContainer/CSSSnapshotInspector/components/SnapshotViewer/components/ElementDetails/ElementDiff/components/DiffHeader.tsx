import React from 'react';
import { IconCopy, IconCheck, IconHierarchy, IconFileText, IconCode } from '@tabler/icons-react';
import {
  HeaderContainer,
  HeaderInfo,
  HeaderTitleContainer,
  HeaderIcon,
  HeaderTitle,
  SelectorInfo,
  SelectorInfoItem,
  InfoBadge,
  HeaderControls,
  SearchButton,
  CopyButton,
  ChildStylesButton
} from './styled';
import { FilterControls } from './FilterControls';

interface SelectorInfo {
  type: string;
  specificity: number;
  icon: React.ReactNode;
}

interface FilterState {
  added: boolean;
  removed: boolean;
  modified: boolean;
}

interface DiffHeaderProps {
  selector: string;
  selectorInfo: SelectorInfo | null;
  totalsAll: number;
  totals: {
    added: number;
    removed: number;
    modified: number;
  };
  filters: FilterState;
  showSearch: boolean;
  copied: string | null;
  showChildStyles: boolean;
  hasNodes: boolean;
  onSearchToggle: () => void;
  onCopyAll: () => void;
  onCopyAsJSON?: () => void;
  onCopyAsYAML?: () => void;
  onChildStylesToggle: () => void;
  onFilterChange: (filters: FilterState) => void;
}

export const DiffHeader: React.FC<DiffHeaderProps> = ({
  selector,
  selectorInfo,
  totalsAll,
  totals,
  filters,
  showSearch,
  copied,
  showChildStyles,
  hasNodes,
  onSearchToggle,
  onCopyAll,
  onCopyAsJSON,
  onCopyAsYAML,
  onChildStylesToggle,
  onFilterChange
}) => {
  return (
    <HeaderContainer>
      <HeaderInfo>
        <HeaderTitleContainer>
          <HeaderIcon />
          <HeaderTitle title={selector}>
            {selector}
          </HeaderTitle>
        </HeaderTitleContainer>
        {selectorInfo && (
          <SelectorInfo>
            <SelectorInfoItem>
              {selectorInfo.icon}
              <span>{selectorInfo.type}</span>
            </SelectorInfoItem>
            <InfoBadge>
              spec {selectorInfo.specificity}
            </InfoBadge>
            <InfoBadge>
              changes {totalsAll}
            </InfoBadge>
          </SelectorInfo>
        )}
      </HeaderInfo>
      
      <HeaderControls>
        <SearchButton
          $active={showSearch}
          onClick={onSearchToggle}
          aria-label={showSearch ? "Hide search" : "Show search"}
        >
          {showSearch ? "Close" : "Search"}
        </SearchButton>
        
        <CopyButton
          $copied={copied === "all"}
          onClick={onCopyAll}
          aria-label="Copy all changes as CSS"
        >
          {copied === "all" ? <IconCheck size={14} /> : <IconCopy size={14} />}
          <span>CSS</span>
        </CopyButton>
        
        {onCopyAsJSON && (
          <CopyButton
            $copied={copied === "json"}
            onClick={onCopyAsJSON}
            aria-label="Copy changes as JSON design tokens"
          >
            {copied === "json" ? <IconCheck size={14} /> : <IconCode size={14} />}
            <span>JSON</span>
          </CopyButton>
        )}
        
        {onCopyAsYAML && (
          <CopyButton
            $copied={copied === "yaml"}
            onClick={onCopyAsYAML}
            aria-label="Copy changes as YAML design tokens"
          >
            {copied === "yaml" ? <IconCheck size={14} /> : <IconFileText size={14} />}
            <span>YAML</span>
          </CopyButton>
        )}
        
        <ChildStylesButton
          $active={showChildStyles}
          $disabled={!hasNodes}
          onClick={onChildStylesToggle}
          aria-label={showChildStyles ? "Back to original styles" : "Check child styles"}
          disabled={!hasNodes}
        >
          <IconHierarchy size={14} />
          <span>{showChildStyles ? "Back to Original" : "Child Styles"}</span>
        </ChildStylesButton>
      </HeaderControls>
      
      <FilterControls
        filters={filters}
        totals={totals}
        onFilterChange={onFilterChange}
      />
    </HeaderContainer>
  );
};