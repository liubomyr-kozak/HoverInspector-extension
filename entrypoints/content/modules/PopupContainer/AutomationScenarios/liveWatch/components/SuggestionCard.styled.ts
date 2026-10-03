import styled, { css, keyframes } from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { ZINDEX_LAUNCHER_CONTAINER } from "@entrypoints/shared/constant/zIndex";

const enter = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: none; }
`;

/** Floating card in the bottom-right corner, built like the tool panel: header, body, footer */
export const Card = styled.section`
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: ${ZINDEX_LAUNCHER_CONTAINER};
  display: flex;
  flex-direction: column;
  width: 340px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border: 1px solid ${tokens.color.border};
  border-radius: 12px;
  background: ${tokens.color.surface};
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 12px 32px -4px rgba(15, 23, 42, 0.18);
  color: ${tokens.color.text};
  font-family: ${tokens.font.family};
  font-size: ${tokens.font.size.sm}px;
  line-height: 1.45;
  animation: ${enter} 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 10px 10px 14px;
  border-bottom: 1px solid ${tokens.color.border};
`;

export const Body = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px 12px;
`;

export const Footer = styled.footer`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid ${tokens.color.border};
  background: ${tokens.color.surfaceMuted};
`;

export const Headline = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: ${tokens.font.size.md}px;
  font-weight: 600;
  line-height: 1.35;
  color: ${tokens.color.text};
`;

export const CountBadge = styled.span`
  flex: none;
  padding: 1px 8px;
  border-radius: 999px;
  background: ${tokens.color.primaryBg};
  color: ${tokens.color.primary};
  font-size: ${tokens.font.size.xs}px;
  font-weight: 600;
`;

export const Hint = styled.p`
  margin: 4px 0 0;
  color: ${tokens.color.textMuted};
  font-size: ${tokens.font.size.xs}px;
`;

/** Thin progress bar under the header while a pattern is replayed */
export const Progress = styled.div<{ $value: number }>`
  height: 3px;
  background: ${tokens.color.border};

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $value }) => Math.round($value * 100)}%;
    background: ${tokens.color.primary};
    transition: width 0.3s ease;
  }
`;

export type StepState = "todo" | "current" | "done";

/** The steps as a short timeline: dots joined by a line */
export const Timeline = styled.ol`
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
`;

export const TimelineItem = styled.li<{ $state: StepState }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  padding: 3px 6px;
  border-radius: ${tokens.radius.md}px;
  background: ${({ $state }) => ($state === "current" ? tokens.color.primaryBg : "transparent")};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $state }) => ($state === "current" ? tokens.color.primaryBg : tokens.color.surfaceMuted)};
  }

  /* The line to the next dot */
  &:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 16px;
    top: 26px;
    bottom: -6px;
    width: 1px;
    background: ${tokens.color.border};
  }
`;

const dotStates = {
  todo: css`
    border: 1px solid ${tokens.color.borderStrong};
    background: ${tokens.color.surface};
    color: ${tokens.color.textSecondary};
  `,
  current: css`
    border: 1px solid ${tokens.color.primary};
    background: ${tokens.color.primary};
    color: ${tokens.color.surface};
    box-shadow: 0 0 0 3px ${tokens.color.primaryBorder};
  `,
  done: css`
    border: 1px solid ${tokens.color.success};
    background: ${tokens.color.successBg};
    color: ${tokens.color.success};
  `,
};

export const Dot = styled.span<{ $state: StepState }>`
  position: relative;
  z-index: 1;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  ${({ $state }) => dotStates[$state]}

  svg {
    width: 13px;
    height: 13px;
  }
`;

export const StepText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 22px;
  color: ${tokens.color.textSecondary};

  strong {
    font-weight: 500;
    color: ${tokens.color.text};
  }
`;

export const KindIcon = styled.span`
  flex: none;
  display: inline-flex;
  color: ${tokens.color.textMuted};

  svg {
    width: 15px;
    height: 15px;
  }
`;

/** A saved scenario that uses the clicked field */
export const ScenarioRow = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.surface};
`;

export const ErrorBox = styled.p`
  margin: 12px 0 0;
  padding: 8px 10px;
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.dangerBg};
  color: ${tokens.color.danger};
  font-size: ${tokens.font.size.xs}px;
`;
