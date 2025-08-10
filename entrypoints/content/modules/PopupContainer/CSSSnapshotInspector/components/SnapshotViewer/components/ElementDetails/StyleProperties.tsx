import React, { useMemo } from "react";
import { StylePropertiesProps } from "../../types";

/**
 * Component for displaying CSS properties
 */
export const StyleProperties: React.FC<StylePropertiesProps> = ({ selectedElementStyles }) => {
  if (selectedElementStyles.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <p
          style={{
            color: "#666",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          No significant styles found for this element.
        </p>
      </div>
    );
  }

  // Define category matchers for use-case grouping
  const categories = useMemo(
    () => [
      {
        key: "layout",
        title: "Layout & Display",
        color: "#1d4ed8",
        match: (p: string) =>
          [
            "display",
            "visibility",
            "float",
            "clear",
            "overflow",
            "overflow-x",
            "overflow-y",
            "contain",
            "isolation",
          ].some((k) => p === k || p.startsWith(k + "-")),
      },
      {
        key: "box",
        title: "Box Model",
        color: "#16a34a",
        match: (p: string) =>
          [
            "box-sizing",
            "width",
            "height",
            "min-width",
            "min-height",
            "max-width",
            "max-height",
            "margin",
            "padding",
          ].some((k) => p === k || p.startsWith(k + "-")),
      },
      {
        key: "position",
        title: "Positioning",
        color: "#9333ea",
        match: (p: string) =>
          [
            "position",
            "top",
            "right",
            "bottom",
            "left",
            "inset",
            "z-index",
            "object-fit",
            "object-position",
          ].some((k) => p === k || p.startsWith(k + "-")),
      },
      {
        key: "flex",
        title: "Flexbox",
        color: "#ea580c",
        match: (p: string) =>
          [
            "flex",
            "flex-grow",
            "flex-shrink",
            "flex-basis",
            "flex-direction",
            "flex-wrap",
            "justify-content",
            "align-items",
            "align-content",
            "align-self",
            "order",
            "gap",
            "row-gap",
            "column-gap",
            "place-content",
            "place-items",
            "place-self",
          ].some((k) => p === k || p.startsWith(k + "-")),
      },
      {
        key: "grid",
        title: "Grid",
        color: "#0ea5e9",
        match: (p: string) =>
          [
            "grid",
            "grid-template",
            "grid-auto",
            "grid-row",
            "grid-column",
            "justify-items",
            "justify-self",
            "align-items",
            "align-self",
            "place-items",
            "place-self",
          ].some((k) => p === k || p.startsWith(k + "-")),
      },
      {
        key: "typography",
        title: "Typography",
        color: "#dc2626",
        match: (p: string) =>
          [
            "font",
            "line-height",
            "letter-spacing",
            "word-spacing",
            "text",
            "white-space",
            "vertical-align",
            "text-decoration",
            "text-transform",
            "text-overflow",
            "text-align",
            "text-indent",
            "text-shadow",
            "direction",
            "unicode-bidi",
          ].some((k) => p === k || p.startsWith(k + "-")),
      },
      {
        key: "color-bg",
        title: "Color & Background",
        color: "#059669",
        match: (p: string) =>
          ["color", "background", "background-color", "background-image", "background-size", "background-position", "background-repeat", "background-blend-mode", "fill", "stroke"].some(
            (k) => p === k || p.startsWith(k + "-")
          ),
      },
      {
        key: "borders",
        title: "Borders & Radius",
        color: "#2563eb",
        match: (p: string) =>
          ["border", "outline", "border-radius", "outline-offset"].some((k) => p === k || p.startsWith(k + "-")),
      },
      {
        key: "effects",
        title: "Effects",
        color: "#7c3aed",
        match: (p: string) =>
          ["box-shadow", "filter", "backdrop-filter", "opacity", "mix-blend-mode"].some(
            (k) => p === k || p.startsWith(k + "-")
          ),
      },
      {
        key: "transform",
        title: "Transforms & Transitions",
        color: "#fb923c",
        match: (p: string) =>
          ["transform", "transform-origin", "transform-style", "transition", "will-change", "perspective"].some(
            (k) => p === k || p.startsWith(k + "-")
          ),
      },
      {
        key: "animation",
        title: "Animation",
        color: "#10b981",
        match: (p: string) => ["animation"].some((k) => p === k || p.startsWith(k + "-")),
      },
    ],
    []
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Array<[string, any]>>();
    const customVars: Array<[string, any]> = [];
    const other: Array<[string, any]> = [];

    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, []);
      return map.get(key)!;
    };

    for (const [prop, val] of selectedElementStyles) {
      if (prop.startsWith("--")) {
        customVars.push([prop, val]);
        continue;
      }
      const cat = categories.find((c) => c.match(prop));
      if (cat) {
        ensure(cat.key).push([prop, val]);
      } else {
        other.push([prop, val]);
      }
    }

    return { map, customVars, other };
  }, [selectedElementStyles, categories]);

  const Section = ({ title, color, items }: { title: string; color: string; items: Array<[string, any]> }) => {
    if (!items || items.length === 0) return null;
    return (
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            padding: "8px 10px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{title}</span>
          <span
            style={{
              fontSize: 11,
              color: "#64748b",
              background: "#e2e8f0",
              borderRadius: 999,
              padding: "1px 6px",
            }}
          >
            {items.length}
          </span>
        </div>
        <div style={{ padding: 10 }}>
          {items.map(([property, value]) => (
            <div key={property} style={{ marginBottom: 6 }}>
              <span style={{ color, fontWeight: 600 }}>{property}:</span>
              <span style={{ marginLeft: 6, color: "#334155" }}>{String(value)};</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "monospace", fontSize: 13 }}>
      {categories.map((c) => (
        <Section key={c.key} title={c.title} color={c.color} items={grouped.map.get(c.key) || []} />
      ))}
      {/* Custom properties (CSS variables) */}
      <Section title="Custom Properties" color="#0ea5e9" items={grouped.customVars} />
      {/* Fallback for anything uncategorized */}
      <Section title="Other" color="#64748b" items={grouped.other} />
    </div>
  );
};