import React from "react";

// CSS-in-JS style objects instead of styled-components
export const treeNodeWrapperStyle = (changeType?: string, isSelected?: boolean): React.CSSProperties => ({
  cursor: "pointer",
  marginBottom: "4px",
  position: "relative",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
});

export const treeNodeContentStyle = (changeType?: string, isSelected?: boolean): React.CSSProperties => ({
  paddingLeft: "20px",
  backgroundColor: isSelected
    ? changeType === "added"
      ? "rgba(46, 160, 67, 0.15)"
      : changeType === "removed"
        ? "rgba(248, 81, 73, 0.15)"
        : changeType === "changed"
          ? "rgba(246, 185, 59, 0.15)"
          : "rgba(33, 136, 255, 0.15)"
    : "transparent",
  borderLeft: `3px solid ${
    changeType === "added"
      ? "#2ea043"
      : changeType === "removed"
        ? "#f85149"
        : changeType === "changed"
          ? "#f6b93b"
          : "#dadce0"
  }`,
  display: "flex",
  flexDirection: "column",
  fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
  zIndex: isSelected ? 1 : "auto",
  marginBottom: "6px",
  ...(changeType === "added" && {
    backgroundColor: "rgba(46, 160, 67, 0.1)",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "4px",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid rgba(46, 160, 67, 0.3)",
  }),
});

export const expandToggleStyle: React.CSSProperties = {
  position: "relative",
  marginRight: "8px",
  width: "16px",
  height: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export const expandLineStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "8px",
  height: "1px",
  backgroundColor: "#e1e4e8",
};

export const expandIconStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16px",
  height: "16px",
  color: "#5f6368",
  cursor: "pointer",
  transition: "color 0.15s ease",
  zIndex: 1,
};

export const elementTagStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flex: 1,
};

export const tagNameStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "13px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
};

export const tagSymbolStyle = (color: string): React.CSSProperties => ({
  color,
});

export const changeIndicatorStyle: React.CSSProperties = {
  marginRight: "8px",
  fontSize: "12px",
  fontWeight: 500,
};

export const actionButtonStyle = (isActive?: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  color: isActive ? "#1976d2" : "#5f6368",
  transition: "color 0.15s ease",
});

export const nodeChildrenStyle = (changeType?: string): React.CSSProperties => ({
  position: "relative",
  paddingLeft: "20px",
  marginLeft: "4px",
  ...(changeType === "added" && {
    backgroundColor: "rgba(46, 160, 67, 0.05)",
    borderLeft: "2px solid rgba(46, 160, 67, 0.3)",
    borderRadius: "0 0 4px 4px",
    padding: "8px 8px 8px 20px",
  }),
});

export const verticalLineStyle = (changeType?: string): React.CSSProperties => ({
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: "1px",
  backgroundColor: changeType === "added" ? "#2ea043" : "#e1e4e8",
});

export const closingTagStyle = (changeType?: string): React.CSSProperties => ({
  padding: "2px 0",
  paddingLeft: "8px",
  color: changeType === "added" ? "#22863a" : "#5f6368",
  fontFamily: "monospace",
  fontSize: "13px",
  opacity: 0.8,
  display: "flex",
  alignItems: "center",
  position: "relative",
});

export const closingTagLineStyle = (changeType?: string): React.CSSProperties => ({
  position: "absolute",
  left: 0,
  width: "8px",
  height: "1px",
  backgroundColor: changeType === "added" ? "#2ea043" : "#e1e4e8",
});

export const detailsOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: "50px",
  right: "20px",
  width: "500px",
  maxHeight: "80vh",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  zIndex: 1000,
  overflow: "auto",
  padding: "16px",
  border: "1px solid #e0e0e0",
};

export const detailsHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "16px",
};

export const closeButtonStyle: React.CSSProperties = {
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: "#f5f5f5",
  transition: "background-color 0.15s ease",
};
