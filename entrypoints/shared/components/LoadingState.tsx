import React from "react";
import { Spin } from "antd";
import styled from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

const Wrapper = styled.div<{ $inline: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(p) => (p.$inline ? "stretch" : "center")};
  justify-content: center;
  gap: 8px;
  padding: ${(p) => (p.$inline ? "8px 0" : "32px 16px")};
  color: ${tokens.color.textSecondary};
  font-size: ${tokens.font.size.sm}px;
  line-height: 1.5;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Track = styled.div`
  height: 4px;
  width: 100%;
  border-radius: 2px;
  background: ${tokens.color.border};
  overflow: hidden;
`;

const Fill = styled.div`
  height: 100%;
  background: ${tokens.color.primary};
  transition: width 150ms linear;
`;

export interface LoadingStateProps {
  /** What is happening, e.g. "Loading notes…" */
  label: React.ReactNode;
  /** Determinate progress: shows a bar and "n of m" under the label */
  progress?: { done: number; total: number } | null;
  /** Unit for the progress count, e.g. "elements" */
  progressUnit?: string;
  /** Left-aligned and compact, for loading inside a section rather than a whole panel */
  inline?: boolean;
  className?: string;
}

/**
 * The one loading state every tool uses: antd's spinner with a short label, announced politely to
 * screen readers. Pass `progress` when the work is countable to add a progress bar.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ label, progress, progressUnit, inline = false, className }) => {
  const percent = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <Wrapper $inline={inline} className={className} role="status" aria-live="polite">
      <Row>
        <Spin size="small" />
        <span>
          {label}
          {progress
            ? ` ${progress.done.toLocaleString()} of ${progress.total.toLocaleString()}${progressUnit ? ` ${progressUnit}` : ""}`
            : null}
        </span>
      </Row>
      {progress !== undefined && (
        <Track aria-hidden>
          <Fill style={{ width: `${percent}%` }} />
        </Track>
      )}
    </Wrapper>
  );
};
