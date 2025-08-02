import React, { useState, useMemo } from "react";
import { IconInfoCircle, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import { ElementListProps } from "../types";

interface TreeNode {
  path: string;
  name: string;
  element: any;
  children: TreeNode[];
  isExpanded: boolean;
  level: number;
}

/**
 * Component for displaying a hierarchical tree view of elements with changes
 */
export const TreeView: React.FC<ElementListProps> = ({
  filteredElements,
  selectedElement,
  setSelectedElement,
  scrollToAndHighlightElement,
  stylesA,
  stylesB,
  elementRefs,
}) => {
  // State to track expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Filter out elements with view changes (hasMoved property)
  const elementsWithoutViewChanges = useMemo(() => {
    return filteredElements.filter(item => !item.hasMoved);
  }, [filteredElements]);

  // Convert flat list to tree structure
  const treeData = useMemo(() => {
    const rootNode: TreeNode = {
      path: "",
      name: "Root",
      element: null,
      children: [],
      isExpanded: true,
      level: 0,
    };

    // Sort elements by path to ensure parents come before children
    const sortedElements = [...elementsWithoutViewChanges].sort((a, b) => a.path.localeCompare(b.path));

    // Build tree structure
    sortedElements.forEach(item => {
      // Get element details from extracted styles
      const element = stylesA[item.path] || stylesB[item.path];
      const classes = element?.classes?.join(".") || "";

      // Create a more descriptive element name
      const elementName = element 
        ? `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${
            classes ? `.${classes}` : ""
          }`
        : item.path.split(">").pop()?.trim() || "Unknown";

      // Split path into segments
      const pathSegments = item.path.split(">").filter(Boolean);
      
      // Start from root
      let currentNode = rootNode;
      let currentPath = "";
      
      // Navigate through path segments to find/create parent nodes
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const segment = pathSegments[i].trim();
        currentPath = currentPath ? `${currentPath}>${segment}` : segment;
        
        // Find existing node or create a new one
        let found = currentNode.children.find(child => child.path === currentPath);
        
        if (!found) {
          // Create a placeholder parent node if it doesn't exist in our filtered elements
          const parentElement = stylesA[currentPath] || stylesB[currentPath];
          const parentClasses = parentElement?.classes?.join(".") || "";
          const parentName = parentElement 
            ? `${parentElement.tagName.toLowerCase()}${parentElement.id ? `#${parentElement.id}` : ""}${
                parentClasses ? `.${parentClasses}` : ""
              }`
            : segment;
          
          found = {
            path: currentPath,
            name: parentName,
            element: null,
            children: [],
            isExpanded: expandedNodes[currentPath] ?? true,
            level: i + 1,
          };
          currentNode.children.push(found);
        }
        
        currentNode = found;
      }
      
      // Add the actual element node
      currentNode.children.push({
        path: item.path,
        name: elementName,
        element: item,
        children: [],
        isExpanded: expandedNodes[item.path] ?? true,
        level: pathSegments.length,
      });
    });

    // Sort children by name for better readability
    const sortChildren = (node: TreeNode) => {
      if (node.children.length > 0) {
        // Sort children by name
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        // Recursively sort grandchildren
        node.children.forEach(child => sortChildren(child));
      }
    };
    
    sortChildren(rootNode);

    return rootNode;
  }, [elementsWithoutViewChanges, stylesA, stylesB, expandedNodes]);

  // Toggle node expansion
  const toggleNode = (path: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Recursive function to render tree nodes
  const renderTreeNodes = (nodes: TreeNode[]) => {
    return nodes.map(node => {
      // Skip the node if it doesn't have an element and no children
      if (!node.element && node.children.length === 0) {
        return null;
      }

      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodes[node.path] ?? true;
      
      // If this is just a parent node with no element data of its own, render differently
      if (!node.element) {
        return (
          <React.Fragment key={node.path}>
            <div
              style={{
                padding: "8px",
                paddingLeft: `${node.level * 16 + 8}px`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                backgroundColor: "transparent",
                borderRadius: "4px",
                marginBottom: "4px",
                transition: "background-color 0.2s ease",
                border: "1px solid transparent",
                borderLeft: "3px solid #dadce0",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                ":hover": {
                  backgroundColor: "#f8f9fa",
                },
              }}
              onClick={() => toggleNode(node.path)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {hasChildren && (
                <span 
                  style={{ 
                    marginRight: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "16px",
                    height: "16px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    color: "#5f6368",
                    cursor: "pointer"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(node.path);
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                  }}
                >
                  {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </span>
              )}
              {!hasChildren && <span style={{ width: "24px" }}></span>}
              <span style={{ 
                color: "#5f6368", 
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: 500
              }}>{node.name}</span>
            </div>
            {isExpanded && renderTreeNodes(node.children)}
          </React.Fragment>
        );
      }

      const item = node.element;
      
      // Count changes by type
      const addedCount = item.changes.filter((c) => c.changeType === "added").length;
      const removedCount = item.changes.filter((c) => c.changeType === "removed").length;
      const changedCount = item.changes.filter((c) => c.changeType === "changed").length;
      const positionChangeCount = item.positionChanges?.length || 0;

      // Create a summary of changes
      const changeSummary = [
        addedCount > 0 ? `${addedCount} added` : "",
        removedCount > 0 ? `${removedCount} removed` : "",
        changedCount > 0 ? `${changedCount} modified` : "",
        positionChangeCount > 0 ? `${positionChangeCount} position changes` : "",
      ]
        .filter(Boolean)
        .join(", ");

      return (
        <React.Fragment key={item.path}>
          <div
            ref={(el) => (elementRefs.current[item.path] = el)}
            style={{
              padding: "8px",
              paddingLeft: `${node.level * 16 + 8}px`,
              cursor: "pointer",
              backgroundColor:
                selectedElement === item.path
                  ? item.changeType === "added"
                    ? "rgba(19, 115, 51, 0.1)"
                    : item.changeType === "removed"
                    ? "rgba(197, 34, 31, 0.1)"
                    : item.changeType === "changed"
                    ? "rgba(234, 134, 0, 0.1)"
                    : "#e8f0fe"
                  : "transparent",
              borderRadius: "4px",
              marginBottom: "4px",
              borderLeft: `3px solid ${
                item.changeType === "added"
                  ? "#137333"
                  : item.changeType === "removed"
                  ? "#c5221f"
                  : item.changeType === "changed"
                  ? "#ea8600"
                  : "#dadce0"
              }`,
              border: "1px solid #e8eaed",
              boxShadow: selectedElement === item.path ? "0 2px 4px rgba(0,0,0,0.15)" : "0 1px 2px rgba(0,0,0,0.1)",
              position: "relative",
              transition: "all 0.2s ease",
              zIndex: selectedElement === item.path ? 1 : "auto",
              display: "flex",
              alignItems: "center",
            }}
            onMouseOver={(e) => {
              if (selectedElement !== item.path) {
                e.currentTarget.style.backgroundColor = 
                  item.changeType === "added"
                    ? "rgba(19, 115, 51, 0.05)"
                    : item.changeType === "removed"
                    ? "rgba(197, 34, 31, 0.05)"
                    : item.changeType === "changed"
                    ? "rgba(234, 134, 0, 0.05)"
                    : "#f8f9fa";
              }
            }}
            onMouseOut={(e) => {
              if (selectedElement !== item.path) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {hasChildren && (
              <span 
                style={{ 
                  marginRight: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  color: "#5f6368",
                  cursor: "pointer"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(item.path);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                }}
              >
                {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </span>
            )}
            {!hasChildren && <span style={{ width: "24px" }}></span>}
            <div
              style={{ flex: 1 }}
              onClick={() => {
                setSelectedElement(item.path);
                scrollToAndHighlightElement(item.path);
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "90%",
                  }}
                >
                  {node.name}
                </div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#5f6368",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "70%",
                  }}
                >
                  {item.path}
                </div>
                <Tooltip content={`${changeSummary}`}>
                  <div style={{ display: "flex", alignItems: "center", cursor: "help" }}>
                    <IconInfoCircle size={14} />
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
          {isExpanded && renderTreeNodes(node.children)}
        </React.Fragment>
      );
    });
  };

  return <>{renderTreeNodes(treeData.children)}</>;
};