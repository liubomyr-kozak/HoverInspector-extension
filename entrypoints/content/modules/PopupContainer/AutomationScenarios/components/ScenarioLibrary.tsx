import React, { useState, useEffect } from 'react';
import { Input, Select, Tree, Button, Empty, Divider } from 'antd';
import { IconSearch, IconFolder, IconFolderPlus } from '@tabler/icons-react';
import { ScenarioMap, ScenarioFolderMap } from '../types.ts';
import ScenarioList from './ScenarioList.tsx';
import { 
  filterScenariosBySearchTerm, 
  filterScenariosByTags, 
  filterScenariosByCategory,
  filterScenariosByFolder
} from '../utils/storage.ts';

const { Search } = Input;
const { TreeNode } = Tree;

// Predefined categories for filtering
const categoryOptions = [
  { value: 'testing', label: 'Testing' },
  { value: 'data-entry', label: 'Data Entry' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'form-filling', label: 'Form Filling' },
  { value: 'scraping', label: 'Data Scraping' },
  { value: 'other', label: 'Other' }
];

interface ScenarioLibraryProps {
  scenarios: ScenarioMap;
  folders: ScenarioFolderMap;
  activeScenarioId: string | null;
  recording: boolean;
  executing: boolean;
  executingScenarioId: string | null;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onCreateFolder?: () => void;
}

/**
 * Component for displaying and organizing scenarios with search, filtering, and folder capabilities
 */
const ScenarioLibrary: React.FC<ScenarioLibraryProps> = ({
  scenarios,
  folders,
  activeScenarioId,
  recording,
  executing,
  executingScenarioId,
  onPlay,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateFolder
}) => {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [filteredScenarios, setFilteredScenarios] = useState<ScenarioMap>(scenarios);
  
  // Extract all unique tags from scenarios for the tag filter dropdown
  const allTags = Array.from(
    new Set(
      Object.values(scenarios)
        .flatMap(scenario => scenario.tags || [])
        .filter(Boolean)
    )
  );
  
  // Apply filters when any filter criteria changes
  useEffect(() => {
    let filtered = scenarios;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filterScenariosBySearchTerm(filtered, searchTerm);
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filterScenariosByTags(filtered, selectedTags);
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filterScenariosByCategory(filtered, selectedCategory);
    }
    
    // Apply folder filter
    filtered = filterScenariosByFolder(filtered, selectedFolderId);
    
    setFilteredScenarios(filtered);
  }, [scenarios, searchTerm, selectedTags, selectedCategory, selectedFolderId]);
  
  // Handle search input change
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };
  
  // Handle tag selection change
  const handleTagChange = (values: string[]) => {
    setSelectedTags(values);
  };
  
  // Handle category selection change
  const handleCategoryChange = (value: string | undefined) => {
    setSelectedCategory(value);
  };
  
  // Handle folder selection change
  const handleFolderSelect = (selectedKeys: React.Key[]) => {
    const folderId = selectedKeys.length > 0 ? selectedKeys[0].toString() : null;
    setSelectedFolderId(folderId === 'root' ? null : folderId);
  };
  
  // Build folder tree data
  const buildFolderTree = () => {
    // Get root folders (those with no parent)
    const rootFolders = Object.entries(folders)
      .filter(([_, folder]) => !folder.parentId)
      .map(([id, folder]) => ({
        key: id,
        title: folder.title,
        children: buildFolderChildren(id)
      }));
    
    return [
      {
        key: 'root',
        title: 'All Scenarios',
        children: rootFolders
      }
    ];
  };
  
  // Build children for a folder
  const buildFolderChildren = (parentId: string) => {
    return Object.entries(folders)
      .filter(([_, folder]) => folder.parentId === parentId)
      .map(([id, folder]) => ({
        key: id,
        title: folder.title,
        children: buildFolderChildren(id)
      }));
  };
  
  // Count scenarios in each folder
  const countScenariosInFolder = (folderId: string | null) => {
    return Object.values(scenarios).filter(scenario => scenario.folderId === folderId).length;
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search and filter section */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Search
          placeholder="Search scenarios"
          allowClear
          onSearch={handleSearch}
          style={{ flex: 1 }}
        />
        <Select
          mode="multiple"
          placeholder="Filter by tags"
          value={selectedTags}
          onChange={handleTagChange}
          style={{ minWidth: '150px' }}
          options={allTags.map(tag => ({ value: tag, label: tag }))}
          allowClear
        />
        <Select
          placeholder="Filter by category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{ minWidth: '150px' }}
          options={categoryOptions}
          allowClear
        />
      </div>
      
      {/* Folder and scenario section */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Folder tree */}
        <div style={{ width: '200px', borderRight: '1px solid #f0f0f0', paddingRight: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0 }}>Folders</h4>
            {onCreateFolder && (
              <Button 
                type="text" 
                icon={<IconFolderPlus size={16} />} 
                onClick={onCreateFolder}
                title="Create new folder"
              />
            )}
          </div>
          <Tree
            defaultExpandAll
            selectedKeys={selectedFolderId ? [selectedFolderId] : ['root']}
            onSelect={handleFolderSelect}
            treeData={buildFolderTree()}
          />
        </div>
        
        {/* Scenario list */}
        <div style={{ flex: 1 }}>
          {Object.keys(filteredScenarios).length > 0 ? (
            <ScenarioList
              scenarios={filteredScenarios}
              activeScenarioId={activeScenarioId}
              recording={recording}
              executing={executing}
              executingScenarioId={executingScenarioId}
              onPlay={onPlay}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ) : (
            <Empty 
              description={
                <span>
                  No scenarios found matching your filters.
                  <br />
                  Try adjusting your search or filter criteria.
                </span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioLibrary;