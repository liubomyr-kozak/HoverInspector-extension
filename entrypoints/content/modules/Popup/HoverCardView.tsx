import React from "react";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { CardSectionRows, CardValue, HoverCardConfig, resolveCard } from "@entrypoints/shared/hoverCard/catalog";
import { cutPx, getTagMeta } from "./helpers.tsx";
import { BoxLabelContainer } from "./Popup.styled.ts";
import { cardSourceFor } from "./cardSource";

const MONO = 'Monaco, "Cascadia Code", "SF Mono", Consolas, monospace';

// Label on the left, value pushed to the right edge, never touching each other
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  minWidth: 0,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#495057",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
const labelStyle: React.CSSProperties = { fontSize: "11px", color: "#666", whiteSpace: "nowrap", flexShrink: 0 };

const TONE: Record<string, { color: string; background: string; border: string }> = {
  ok: { color: tokens.color.success, background: tokens.color.successBg, border: "#bbf7d0" },
  warn: { color: tokens.color.warning, background: tokens.color.warningBg, border: "#fde68a" },
  bad: { color: tokens.color.danger, background: tokens.color.dangerBg, border: "#fecaca" },
};

const Swatch = ({ color }: { color: string }) => (
  <span
    aria-hidden
    style={{
      display: "inline-block",
      flexShrink: 0,
      width: "12px",
      height: "12px",
      borderRadius: "3px",
      background: color,
      border: "1px solid rgba(0,0,0,0.1)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}
  />
);

const Value = ({ value }: { value: CardValue }) => {
  const tone = value.tone ? TONE[value.tone] : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
      {value.swatches?.map((c, i) => <Swatch key={i} color={c} />)}
      <span
        // Long values are cut with an ellipsis; the tooltip has all of it
        title={value.title && value.title !== value.text ? `${value.text}\n${value.title}` : value.text}
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: "11px",
          fontFamily: MONO,
          color: tone?.color ?? "#495057",
          background: tone?.background ?? "#f8f9fa",
          padding: "2px 6px",
          borderRadius: "3px",
          border: `1px solid ${tone?.border ?? "#e9ecef"}`,
        }}
      >
        {value.text}
      </span>
    </div>
  );
};

export const HoverCardSections = ({ sections }: { sections: CardSectionRows[] }) => (
  <>
    {sections.map((section) => (
      <div key={section.id} style={{ marginBottom: "12px" }} data-card-section={section.id}>
        <div style={sectionTitleStyle}>{section.label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px" }}>
          {section.rows.map((row) => (
            <div key={row.id} style={rowStyle} data-card-row={row.id}>
              <span style={labelStyle}>{row.label}:</span>
              <Value value={row.value} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </>
);

interface HoverCardViewProps {
  node: any;
  summary: Record<string, any>;
  config: HoverCardConfig;
  frameContext?: { text: string; limited: boolean } | null;
}

/** The hover card's content: element header, frame note and the configured sections */
export const HoverCardView = ({ node, summary, config, frameContext }: HoverCardViewProps) => {
  const { width, height, tag, className, id } = summary;
  const source = cardSourceFor(node, summary);
  const sections = source ? resolveCard(source, config) : [];
  const hasBody = sections.length > 0 || !!frameContext;

  return (
    <BoxLabelContainer className="BoxContainer">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          ...(hasBody ? { marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #e9ecef" } : {}),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>{getTagMeta(tag, id, className)}</div>
        <div
          style={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontSize: "12px",
            fontWeight: "600",
            color: "#495057",
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            padding: "4px 8px",
            borderRadius: "6px",
            border: "1px solid #dee2e6",
          }}
        >
          {cutPx(String(width ?? "0"))} × {cutPx(String(height ?? "0"))}px
        </div>
      </div>

      {frameContext && (
        <div
          style={{
            marginBottom: "12px",
            fontSize: "11px",
            lineHeight: 1.4,
            color: frameContext.limited ? "#8a4b00" : "#495057",
            background: frameContext.limited ? "#fff4e0" : "#f1f3f5",
            border: `1px solid ${frameContext.limited ? "#f5d2a0" : "#e9ecef"}`,
            borderRadius: "4px",
            padding: "4px 8px",
            overflowWrap: "anywhere",
          }}
        >
          {frameContext.text}
        </div>
      )}

      <HoverCardSections sections={sections} />
    </BoxLabelContainer>
  );
};
