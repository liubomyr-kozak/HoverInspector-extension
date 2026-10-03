import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Button, Checkbox, Switch } from "antd";
import { IconArrowDown, IconArrowUp, IconChevronDown, IconChevronRight, IconRestore } from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { tokens } from "@entrypoints/shared/styles/tokens";
import DomNodeManager, { useDomNodeObserver } from "@entrypoints/core/services/dom/DomNodeManager";
import {
  CARD_PROPERTIES,
  defaultConfig,
  HoverCardConfig,
  PROPERTY_BY_ID,
  SECTIONS,
  SectionId,
} from "@entrypoints/shared/hoverCard/catalog";
import { resetHoverCardConfig, setHoverCardConfig, useHoverCardConfig } from "@entrypoints/shared/hoverCard/store";
import { HoverCardView } from "@entrypoints/content/modules/Popup/HoverCardView";
import { describeFrameContext } from "@entrypoints/content/frameAgentHost";

const SmallIconButton = styled(IconButton)`
  && svg {
    width: 14px;
    height: 14px;
  }
  &&:disabled {
    background: transparent;
    color: ${tokens.color.borderStrong};
  }
`;

const SectionBox = styled.div`
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.surface};
  & + & {
    margin-top: 6px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 4px;
  min-width: 0;
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 2px 4px;
  border: none;
  background: transparent;
  border-radius: ${tokens.radius.sm}px;
  cursor: pointer;
  font-size: ${tokens.font.size.sm}px;
  font-weight: 600;
  color: ${tokens.color.text};
  text-align: left;
  &:hover {
    background: ${tokens.color.surfaceMuted};
  }
  &:focus-visible {
    outline: 2px solid ${tokens.color.focusRing};
    outline-offset: 1px;
  }
  svg {
    flex-shrink: 0;
    color: ${tokens.color.textMuted};
  }
`;

const PropRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 0 6px 0 30px;
  border-top: 1px solid ${tokens.color.surfaceMuted};
  .hint {
    display: block;
    font-size: ${tokens.font.size.xs}px;
    color: ${tokens.color.textMuted};
    line-height: 1.3;
  }
  .ant-checkbox-wrapper {
    flex: 1;
    min-width: 0;
    font-size: ${tokens.font.size.sm}px;
  }
`;

const move = <T,>(list: T[], index: number, delta: number): T[] => {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

/** Which element the preview shows: the selected one, else the last hovered one, else <body> */
const usePreviewNode = () => {
  const hovered = useDomNodeObserver("hoverElement");
  const selected = useDomNodeObserver("selectedElement");
  return selected || hovered || DomNodeManager.get("hoverElement") || document.body;
};

const sameAsDefault = (config: HoverCardConfig) => JSON.stringify(config) === JSON.stringify(defaultConfig());

interface HoverCardEditorProps {
  onDone: () => void;
}

/**
 * Edit mode for the hover card: choose and order the rows it shows, with a live preview. Changes are
 * saved to browser.storage.local and apply to the hover card at once.
 */
export const HoverCardEditor = ({ onDone }: HoverCardEditorProps) => {
  const config = useHoverCardConfig();
  const enabled = useMemo(() => new Set(config.enabled), [config.enabled]);
  const [expanded, setExpanded] = useState<Set<SectionId>>(() => new Set());
  const previewNode = usePreviewNode();
  const summary = previewNode ? DomNodeManager.getStyleByNode(previewNode) : null;

  const update = (patch: Partial<HoverCardConfig>) => setHoverCardConfig({ ...config, ...patch });

  const toggleProp = (id: string, on: boolean) => {
    // Keep catalogue order in the stored list; the card follows config.order anyway
    const next = CARD_PROPERTIES.map((p) => p.id).filter((pid) => (pid === id ? on : enabled.has(pid)));
    update({ enabled: next });
  };

  const toggleSection = (section: SectionId, on: boolean) => {
    const ids = new Set(config.order[section]);
    const next = CARD_PROPERTIES.map((p) => p.id).filter((pid) => (ids.has(pid) ? on : enabled.has(pid)));
    update({ enabled: next });
  };

  const moveSection = (index: number, delta: number) => update({ sections: move(config.sections, index, delta) });
  const moveProp = (section: SectionId, index: number, delta: number) =>
    update({ order: { ...config.order, [section]: move(config.order[section], index, delta) } });

  const toggleExpanded = (section: SectionId) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });

  const previewLabel = previewNode
    ? `${previewNode.localName}${previewNode.id ? `#${previewNode.id}` : ""}`
    : "";

  return (
    <div className="w-full" data-testid="hover-card-editor">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="m-0 font-semibold" style={{ fontSize: tokens.font.size.lg }}>
          Customize hover card
        </h3>
        <div className="flex items-center gap-2">
          <Button size="small" icon={<IconRestore size={14} />} onClick={resetHoverCardConfig} disabled={sameAsDefault(config)}>
            Reset to default
          </Button>
          <Button size="small" type="primary" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>

      <div className="mb-1 text-xs" style={{ color: tokens.color.textSecondary }}>
        Preview · <code>{previewLabel}</code>
      </div>
      <div
        className="mb-1"
        style={{
          padding: 12,
          background: tokens.color.surfaceMuted,
          border: `1px dashed ${tokens.color.borderStrong}`,
          borderRadius: tokens.radius.md,
          display: "flex",
          justifyContent: "center",
        }}
        aria-label="Hover card preview"
        role="group"
      >
        {summary && Object.keys(summary).length ? (
          <div style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.04)", borderRadius: 8, maxWidth: "100%" }}>
            <HoverCardView node={previewNode} summary={summary} config={config} frameContext={describeFrameContext(previewNode)} />
          </div>
        ) : (
          <span className="text-xs" style={{ color: tokens.color.textMuted }}>
            Hover an element on the page to preview it.
          </span>
        )}
      </div>
      <div className="mb-4 text-xs" style={{ color: tokens.color.textMuted }}>
        Hover or select an element on the page to preview it here.
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <label htmlFor="hover-card-hide-defaults" className="text-sm">
          Hide default values
          <span className="block text-xs" style={{ color: tokens.color.textMuted }}>
            Skip values nobody set, like a 0px border, opacity 1 or static position
          </span>
        </label>
        <Switch
          id="hover-card-hide-defaults"
          size="small"
          checked={config.hideDefaults}
          onChange={(checked) => update({ hideDefaults: checked })}
          aria-label="Hide default values"
        />
      </div>

      <div className="mb-2 text-xs" style={{ color: tokens.color.textSecondary }}>
        Properties shown on the card
      </div>
      <div role="list" aria-label="Hover card sections">
        {config.sections.map((sectionId, sectionIndex) => {
          const section = SECTIONS.find((s) => s.id === sectionId)!;
          const ids = config.order[sectionId];
          const onCount = ids.filter((id) => enabled.has(id)).length;
          const isOpen = expanded.has(sectionId);
          const panelId = `hover-card-section-${sectionId}`;
          return (
            <SectionBox key={sectionId} role="listitem" data-section={sectionId}>
              <SectionHeader>
                <Checkbox
                  checked={onCount === ids.length}
                  indeterminate={onCount > 0 && onCount < ids.length}
                  onChange={(e) => toggleSection(sectionId, e.target.checked)}
                  aria-label={`Show all ${section.label} properties`}
                />
                <ExpandButton type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggleExpanded(sectionId)}>
                  {isOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  <span className="truncate">{section.label}</span>
                  <span style={{ fontWeight: 400, fontSize: tokens.font.size.xs, color: tokens.color.textMuted }}>
                    {onCount}/{ids.length}
                  </span>
                </ExpandButton>
                <SmallIconButton
                  size={24}
                  label={`Move ${section.label} up`}
                  disabled={sectionIndex === 0}
                  onClick={() => moveSection(sectionIndex, -1)}
                >
                  <IconArrowUp />
                </SmallIconButton>
                <SmallIconButton
                  size={24}
                  label={`Move ${section.label} down`}
                  disabled={sectionIndex === config.sections.length - 1}
                  onClick={() => moveSection(sectionIndex, 1)}
                >
                  <IconArrowDown />
                </SmallIconButton>
              </SectionHeader>
              {isOpen && (
                <div id={panelId} role="group" aria-label={`${section.label} properties`} className="pb-1">
                  {ids.map((id, index) => {
                    const prop = PROPERTY_BY_ID.get(id)!;
                    return (
                      <PropRow key={id} data-prop={id}>
                        <Checkbox checked={enabled.has(id)} onChange={(e) => toggleProp(id, e.target.checked)}>
                          {prop.label}
                          {prop.hint && <span className="hint">{prop.hint}</span>}
                        </Checkbox>
                        <SmallIconButton size={22} label={`Move ${prop.label} up`} disabled={index === 0} onClick={() => moveProp(sectionId, index, -1)}>
                          <IconArrowUp />
                        </SmallIconButton>
                        <SmallIconButton
                          size={22}
                          label={`Move ${prop.label} down`}
                          disabled={index === ids.length - 1}
                          onClick={() => moveProp(sectionId, index, 1)}
                        >
                          <IconArrowDown />
                        </SmallIconButton>
                      </PropRow>
                    );
                  })}
                </div>
              )}
            </SectionBox>
          );
        })}
      </div>
    </div>
  );
};

export default HoverCardEditor;
