import React from "react";
import { IconTag, IconId, IconBraces, IconRuler, IconSitemap, IconCopy } from "@tabler/icons-react";
import { ElementPropertiesProps } from "../../types";
import { SectionHeader } from "../SectionHeader";
import { copyToClipboard } from "../../utils/copyToClipboard";

/**
 * Component for displaying element properties (tag, id, classes, attributes, bounds, path)
 */
export const ElementProperties: React.FC<ElementPropertiesProps> = ({ selectedElementData }) => {
  if (!selectedElementData) return null;

  return (
    <div style={{ marginBottom: "14px" }}>
      {/* Tag */}
      <div
        style={{
          marginBottom: "10px",
          backgroundColor: "#f8fafc",
          padding: "8px 10px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
        }}
      >
        <SectionHeader
          title="Tag"
          icon={<IconTag size={14} color="#2563eb" />}
          content={selectedElementData.tagName}
          description="HTML element type (e.g., div, span, button)"
        />
        <div style={{ paddingLeft: "12px", fontFamily: "monospace", fontSize: "13px", color: "#334155" }}>
          {selectedElementData.tagName}
        </div>
      </div>

      {/* ID */}
      {selectedElementData.id && (
        <div
          style={{
            marginBottom: "10px",
            backgroundColor: "#fff1f2",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #fecdd3",
          }}
        >
          <SectionHeader
            title="ID"
            icon={<IconId size={14} color="#e11d48" />}
            content={selectedElementData.id}
            description="Unique identifier for this element (used in CSS with #id selectors)"
          />
          <div style={{ paddingLeft: "12px", fontFamily: "monospace", fontSize: "13px", color: "#881337" }}>
            {selectedElementData.id}
          </div>
        </div>
      )}

      {/* Classes */}
      {selectedElementData.classes && selectedElementData.classes.length > 0 && (
        <div
          style={{
            marginBottom: "10px",
            backgroundColor: "#ecfdf5",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #a7f3d0",
          }}
        >
          <SectionHeader
            title="Classes"
            icon={<IconBraces size={14} color="#059669" />}
            content={selectedElementData.classes.join(" ")}
            description="CSS classes applied to this element (used in CSS with .class selectors)"
          />
          <div
            style={{
              paddingLeft: "12px",
              fontFamily: "monospace",
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
            }}
          >
            {selectedElementData.classes.map((cls: string, index: number) => (
              <span
                key={index}
                style={{
                  display: "inline-block",
                  backgroundColor: "#d1fae5",
                  padding: "3px 6px",
                  borderRadius: "4px",
                  margin: "0 3px 3px 0",
                  fontSize: "12px",
                  border: "1px solid #a7f3d0",
                  cursor: "pointer",
                  color: "#065f46",
                }}
                onClick={() => copyToClipboard(cls)}
                title={`Click to copy ${cls}`}
              >
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {selectedElementData.attributes && Object.keys(selectedElementData.attributes).length > 0 && (
        <div
          style={{
            marginBottom: "10px",
            backgroundColor: "#fff7ed",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #fed7aa",
          }}
        >
          <SectionHeader
            title="Attributes"
            icon={<IconBraces size={14} color="#ea580c" />}
            content={Object.entries(selectedElementData.attributes)
              .map(([key, value]) => `${key}="${value}"`)
              .join(" ")}
            description="HTML attributes that provide additional information about the element"
          />
          <div style={{ paddingLeft: "12px", fontFamily: "monospace", fontSize: "13px" }}>
            {Object.entries(selectedElementData.attributes).map(([key, value]: [string, any], index: number) => (
              <div key={index} style={{ marginBottom: "6px", display: "flex", alignItems: "center" }}>
                <span style={{ color: "#0369a1", fontWeight: "500", fontSize: "12px" }}>{key}</span>
                <span style={{ margin: "0 3px" }}>:</span>
                <span
                  style={{
                    color: "#9a3412",
                    backgroundColor: "#ffedd5",
                    padding: "2px 5px",
                    borderRadius: "3px",
                    border: "1px solid #fed7aa",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                  onClick={() => copyToClipboard(String(value))}
                  title="Click to copy value"
                >
                  {String(value)}
                </span>
                <button
                  onClick={() => copyToClipboard(`${key}="${value}"`)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "3px",
                    marginLeft: "6px",
                    color: "#666",
                  }}
                  title={`Copy ${key} attribute with value`}
                >
                  <IconCopy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bounds */}
      {selectedElementData.bounds && (
        <div
          style={{
            marginBottom: "10px",
            backgroundColor: "#faf5ff",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #e9d5ff",
          }}
        >
          <SectionHeader
            title="Bounds"
            icon={<IconRuler size={14} color="#9333ea" />}
            content={`x: ${selectedElementData.bounds.x}, y: ${selectedElementData.bounds.y}, width: ${selectedElementData.bounds.width}, height: ${selectedElementData.bounds.height}`}
            description="Position and size of the element in the viewport (useful for layout analysis)"
          />
          <div
            style={{
              paddingLeft: "12px",
              fontFamily: "monospace",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f3e8ff",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #e9d5ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#6b21a8" }}>x: {selectedElementData.bounds.x}</span>
              <button
                onClick={() => copyToClipboard(`${selectedElementData.bounds.x}`)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  color: "#9333ea",
                }}
                title="Copy x value"
              >
                <IconCopy size={10} />
              </button>
            </div>
            <div
              style={{
                backgroundColor: "#f3e8ff",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #e9d5ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#6b21a8" }}>y: {selectedElementData.bounds.y}</span>
              <button
                onClick={() => copyToClipboard(`${selectedElementData.bounds.y}`)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  color: "#9333ea",
                }}
                title="Copy y value"
              >
                <IconCopy size={10} />
              </button>
            </div>
            <div
              style={{
                backgroundColor: "#f3e8ff",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #e9d5ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#6b21a8" }}>width: {selectedElementData.bounds.width}</span>
              <button
                onClick={() => copyToClipboard(`${selectedElementData.bounds.width}`)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  color: "#9333ea",
                }}
                title="Copy width value"
              >
                <IconCopy size={10} />
              </button>
            </div>
            <div
              style={{
                backgroundColor: "#f3e8ff",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #e9d5ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#6b21a8" }}>height: {selectedElementData.bounds.height}</span>
              <button
                onClick={() => copyToClipboard(`${selectedElementData.bounds.height}`)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  color: "#9333ea",
                }}
                title="Copy height value"
              >
                <IconCopy size={10} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
