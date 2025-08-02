import React, { useState } from "react";
import { IconCopy, IconInfoCircle } from "@tabler/icons-react";
import { SectionHeaderProps } from "../types";
import { copyToClipboard } from "../utils/copyToClipboard";

/**
 * Component for section headers with copy button
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, content, description }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontWeight: "500",
        marginBottom: "3px",
        fontSize: "13px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {icon}
        <span>{title}</span>
        {description && (
          <div
            style={{
              position: "relative",
              display: "inline-block",
            }}
          >
            <IconInfoCircle
              size={12}
              style={{
                color: "#64748b",
                cursor: "help",
                marginLeft: "3px",
              }}
              title={description}
            />
          </div>
        )}
      </div>
      <button
        onClick={handleCopy}
        style={{
          background: isCopied ? "#dcfce7" : "none",
          border: isCopied ? "1px solid #bbf7d0" : "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "3px",
          borderRadius: "3px",
          color: isCopied ? "#16a34a" : "#64748b",
          transition: "all 0.2s ease",
          gap: "3px",
        }}
        title={`Copy ${title.toLowerCase()}`}
      >
        <IconCopy size={12} />
        {isCopied && <span style={{ fontSize: "11px" }}>Copied!</span>}
      </button>
    </div>
  );
};