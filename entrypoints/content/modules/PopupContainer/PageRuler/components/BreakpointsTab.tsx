import React, { useState } from "react";
import styled from "styled-components";
import { Button, Card, InputNumber, Select } from "antd";
import { CopyButton } from "@entrypoints/shared/components/CopyButton";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { breakpoints as RESIZE_PRESETS, describeResizeMiss, resizeViewportTo } from "../../ViewportRuler";
import { FRAMEWORK_BREAKPOINTS } from "../data/frameworkBreakpoints";
import { formatRange, getActiveBreakpoint, getNextBreakpoint, mediaQueryFor } from "../utils/viewport";
import { Code, ExternalLink, Hint, Note, SectionTitle } from "../PageRuler.styled";

interface BreakpointsTabProps {
  width: number;
}

const BreakpointList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
`;

const BreakpointRow = styled.li<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 8px;
  border: 1px solid ${({ $active }) => ($active ? tokens.color.primaryBorder : tokens.color.border)};
  border-radius: ${tokens.radius.md}px;
  background: ${({ $active }) => ($active ? tokens.color.primaryBg : tokens.color.surface)};
`;

const BreakpointName = styled.span`
  font-size: ${tokens.font.size.sm}px;
  font-weight: 600;
  color: ${tokens.color.text};
`;

const BreakpointRange = styled.span`
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textSecondary};
  font-variant-numeric: tabular-nums;
`;

const Current = styled.p`
  margin: 0;
  font-size: ${tokens.font.size.sm}px;
  color: ${tokens.color.text};
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

// The ruler at the top of the page shows these labels with device emoji; the panel's buttons don't need them
const presetLabel = (label: string) => label.replace(/^[^\p{L}]+/u, "");

const MIN_CUSTOM_WIDTH = 200;
const MAX_CUSTOM_WIDTH = 7680;

export const BreakpointsTab: React.FC<BreakpointsTabProps> = ({ width }) => {
  const [frameworkId, setFrameworkId] = useState(FRAMEWORK_BREAKPOINTS[0].id);
  const framework = FRAMEWORK_BREAKPOINTS.find((f) => f.id === frameworkId) ?? FRAMEWORK_BREAKPOINTS[0];
  const active = getActiveBreakpoint(framework.breakpoints, width);
  const next = getNextBreakpoint(framework.breakpoints, width);

  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [resizeMiss, setResizeMiss] = useState("");
  const [pendingWidth, setPendingWidth] = useState<number | null>(null);

  const applyWidth = async (target: number) => {
    setPendingWidth(target);
    setResizeMiss("");
    try {
      setResizeMiss(describeResizeMiss(target, await resizeViewportTo(target)));
    } catch {
      setResizeMiss("The window could not be resized.");
    } finally {
      setPendingWidth(null);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Card size="small">
        <SectionTitle>Framework breakpoints</SectionTitle>
        <Select
          className="w-full"
          size="small"
          value={framework.id}
          onChange={setFrameworkId}
          options={FRAMEWORK_BREAKPOINTS.map((f) => ({ value: f.id, label: f.name }))}
          aria-label="Framework"
        />
        <Current className="mt-2">
          At {width}px: <strong>{active?.name ?? "none"}</strong>
          {next && (
            <>
              {" · "}
              {next.breakpoint.name} starts {next.distance}px wider
            </>
          )}
        </Current>
        <BreakpointList>
          {framework.breakpoints.map((bp) => {
            const query = mediaQueryFor(bp);
            const isActive = bp === active;
            return (
              <BreakpointRow key={bp.name} $active={isActive} aria-current={isActive ? "true" : undefined}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <BreakpointName>{bp.name}</BreakpointName>
                    <BreakpointRange>{formatRange(bp)}</BreakpointRange>
                  </div>
                  <Code>{query}</Code>
                </div>
                {bp.min > 0 || bp.max !== undefined ? (
                  <CopyButton value={query} title={`Copy the ${bp.name} media query`} />
                ) : null}
              </BreakpointRow>
            );
          })}
        </BreakpointList>
        <Hint className="mt-2">
          Default values. <ExternalLink href={framework.source}>{framework.name} docs</ExternalLink>
        </Hint>
      </Card>

      <Card size="small">
        <SectionTitle>Resize window</SectionTitle>
        {resizeMiss && <Note className="mb-2">{resizeMiss}</Note>}
        <ButtonGroup>
          {RESIZE_PRESETS.map((bp) => (
            <Button
              key={bp.value}
              onClick={() => applyWidth(bp.value)}
              size="small"
              type={width === bp.value ? "primary" : "default"}
              loading={pendingWidth === bp.value}
            >
              {presetLabel(bp.label)}
            </Button>
          ))}
        </ButtonGroup>
        <form
          className="flex gap-2 mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (customWidth) applyWidth(customWidth);
          }}
        >
          <InputNumber
            className="flex-1"
            size="small"
            min={MIN_CUSTOM_WIDTH}
            max={MAX_CUSTOM_WIDTH}
            value={customWidth}
            onChange={setCustomWidth}
            placeholder="Width"
            addonAfter="px"
            aria-label="Viewport width in px"
          />
          <Button size="small" htmlType="submit" disabled={!customWidth} loading={pendingWidth === customWidth}>
            Resize
          </Button>
        </form>
      </Card>
    </div>
  );
};
