import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";
import { setElementDetailsData } from "@entrypoints/content/store/elementDetails/elementDetails.slice";
import { setXPath } from "@entrypoints/content/store/highlight/highlightSlice";
import { copyToClipboard } from "../../utils/copyToClipboard";
import { IconSitemap, IconCopy, IconCheck, IconCircle, IconCircleDot, IconTarget } from "@tabler/icons-react";
import type { XPathVariants } from "../../../../types";

export const ElementXPathSelector: React.FC = () => {
  const dispatch = useDispatch();
  const { xpathVariants, selectedXPathKey } = useSelector((s: RootState) => s.elementDetails);
  const [expanded, setExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<keyof XPathVariants | null>(null);

  const entries = useMemo(() => {
  if (!xpathVariants) return [] as Array<{ key: keyof XPathVariants; label: string; value: string }>;
    return (
      [
        ["optimized", "Optimized"],
        ["withId", "With ID"],
        ["withClasses", "With Classes"],
        ["withAttributes", "With Attributes"],
        ["absolute", "Absolute"],
      ] as const
    )
      .map(([key, label]) => ({
    key: key as keyof XPathVariants,
        label,
        value: (xpathVariants as any)[key] as string,
      }))
      .filter((e) => !!e.value);
  }, [xpathVariants]);

  if (!xpathVariants || entries.length === 0) return null;

  const effectiveKey = (selectedXPathKey as keyof XPathVariants | undefined) ?? (entries[0]?.key as keyof XPathVariants);
  const currentValue = effectiveKey ? (xpathVariants as any)[effectiveKey] : entries[0].value;

  const onUse = (key: keyof XPathVariants) => {
    const value = (xpathVariants as any)[key as any] as string;
    dispatch(setElementDetailsData({ selectedXPathKey: key as any, xpath: value }));
    if (value) dispatch(setXPath(value));
  };

  const onCopyVariant = async (key: keyof XPathVariants) => {
    const value = (xpathVariants as any)[key as any] as string;
    if (!value) return;
    await copyToClipboard(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1200);
  };

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 8,
        marginBottom: 12,
        fontSize: 13,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Header row: label + expand toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#334155", fontWeight: 600 }}>
          <IconSitemap size={14} color="#475569" />
          <span style={{ fontSize: 12 }}>XPath</span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "#e2e8f0",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
          title={expanded ? "Collapse details" : "Expand details"}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Compact list: show all except selected when collapsed; only selected when expanded */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(entries.filter((e) => (expanded ? (e.key as any) === (effectiveKey as any) : (e.key as any) !== (effectiveKey as any)))).map((e) => {
          const isSelected = (effectiveKey as any) === (e.key as any);
          const isCopied = copiedKey === (e.key as any);
          return (
            <div
              key={e.key as string}
              style={{
                border: `1px solid ${isSelected ? "#60a5fa" : "#e2e8f0"}`,
                background: isSelected ? "#eff6ff" : "#ffffff",
                borderRadius: 6,
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isSelected ? <IconCircleDot size={14} color="#2563eb" /> : <IconCircle size={14} color="#94a3b8" />}
                  <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "#1d4ed8" : "#334155" }}>{e.label}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => onUse(e.key as any)}
                    style={{
                      background: isSelected ? "#2563eb" : "#e2e8f0",
                      color: isSelected ? "#ffffff" : "#0f172a",
                      border: "none",
                      borderRadius: 6,
                      padding: "2px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    title={isSelected ? "Selected" : "Select this XPath"}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </button>
                  <button
                    onClick={() => onCopyVariant(e.key as any)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: isCopied ? "#16a34a" : "#3b82f6",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      padding: "2px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    title="Copy this XPath"
                  >
                    {isCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => {
                      // Trigger HighlightOverlay via setXPath
                      const value = (xpathVariants as any)[e.key as any] as string;
                      if (value) dispatch(setXPath(value));
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      padding: "2px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    title="Find element (highlight)"
                  >
                    <IconTarget size={14} />
                    Find
                  </button>
                </div>
              </div>
              {expanded ? (
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    wordBreak: "break-all",
                    color: "#111827",
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 6,
                    padding: 6,
                  }}
                >
                  {e.value}
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#111827",
                  }}
                  title={e.value}
                >
                  {e.value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
