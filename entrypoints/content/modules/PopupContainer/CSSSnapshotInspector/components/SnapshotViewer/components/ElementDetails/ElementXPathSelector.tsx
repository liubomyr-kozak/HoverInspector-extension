import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";
import { setElementDetailsData } from "@entrypoints/content/store/elementDetails/elementDetails.slice";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { copyToClipboard } from "../../utils/copyToClipboard";
import { IconSitemap, IconCopy, IconCheck, IconTarget } from "@tabler/icons-react";
import type { XPathVariants } from "../../../../types";

export const ElementXPathSelector: React.FC = () => {
  const dispatch = useDispatch();
  const highlightManager = useHighlightOverlay();
  const { xpathVariants, selectedXPathKey } = useSelector((s: RootState) => s.elementDetails);
  // showFull: show full multiline (wrapped) XPath values; when false show truncated single-line ellipsis.
  const [showFull, setShowFull] = useState(false);
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

  const effectiveKey =
    (selectedXPathKey as keyof XPathVariants | undefined) ?? (entries[0]?.key as keyof XPathVariants);

  const onUse = (key: keyof XPathVariants) => {
    const value = (xpathVariants as any)[key as any] as string;
    dispatch(setElementDetailsData({ selectedXPathKey: key as any, xpath: value }));
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "#334155" }}>
          <IconSitemap size={14} color="#475569" />
          <span style={{ fontSize: 12 }}>XPath Variants</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setShowFull((v) => !v)}
            style={{
              background: showFull ? "#2563eb" : "#e2e8f0",
              color: showFull ? "#ffffff" : "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
            }}
            title={showFull ? "Показати скорочено" : "Показати повністю"}
          >
            {showFull ? "Full" : "Compact"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {entries
          .filter((e) => {
            // When collapsed (showFull = false), show only selected entry
            // When expanded (showFull = true), show all entries
            if (!showFull) {
              const isSelected = (effectiveKey as any) === (e.key as any);
              return isSelected;
            }
            return true;
          })
          .map((e) => {
          const isSelected = (effectiveKey as any) === (e.key as any);
          const isCopied = copiedKey === (e.key as any);
          return (
            <div
              key={e.key as string}
              onClick={(ev) => {
                // Avoid selecting when clicking action buttons
                if ((ev.target as HTMLElement).closest("[data-action]") || isSelected) return;
                onUse(e.key);
              }}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: 8,
                padding: "4px 6px",
                borderRadius: 6,
                border: `1px solid ${isSelected ? "#60a5fa" : "#e2e8f0"}`,
                background: isSelected ? "#eff6ff" : "#ffffff",
                cursor: isSelected ? "default" : "pointer",
                transition: "background 120ms, border-color 120ms",
              }}
            >
              <input
                type="radio"
                name="xpath-variant"
                checked={isSelected}
                onChange={() => onUse(e.key)}
                style={{ margin: 0, cursor: "pointer" }}
                aria-label={`Select ${e.label}`}
              />
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isSelected ? "#1d4ed8" : "#475569" }}>
                  {e.label}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    lineHeight: 1.4,
                    color: "#111827",
                    background: showFull ? "#f1f5f9" : "transparent",
                    border: showFull ? "1px dashed #cbd5e1" : "none",
                    padding: showFull ? "4px 6px" : 0,
                    borderRadius: 4,
                    whiteSpace: showFull ? "normal" : "nowrap",
                    overflow: showFull ? "visible" : "hidden",
                    textOverflow: showFull ? "unset" : "ellipsis",
                  }}
                  title={e.value}
                >
                  {e.value}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={(ev) => ev.stopPropagation()}>
                <button
                  data-action
                  onClick={() => onCopyVariant(e.key as any)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: isCopied ? "#16a34a" : "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 6px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  title="Copy XPath"
                >
                  {isCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </button>
                <button
                  data-action
                  onClick={() => {
                    const value = (xpathVariants as any)[e.key as any] as string;
                    if (value) highlightManager.startHighlight(value);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 6px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  title="Highlight element"
                >
                  <IconTarget size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
