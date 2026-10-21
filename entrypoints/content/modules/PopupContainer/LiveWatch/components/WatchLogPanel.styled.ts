import styled, { css, keyframes } from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

/** Fixed row height: the list only renders the rows in view, so it stays fast with thousands of them */
export const ROW_HEIGHT = 34;

const pulse = keyframes`
  50% { opacity: 0.35; }
`;

export const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 4px 12px;
  border-bottom: 1px solid ${tokens.color.border};
  color: ${tokens.color.textMuted};
  font-size: ${tokens.font.size.xs}px;
`;

export const LiveDot = styled.span<{ $on: boolean }>`
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: ${({ $on }) => ($on ? tokens.color.success : tokens.color.borderStrong)};
  ${({ $on }) =>
    $on &&
    css`
      animation: ${pulse} 1.6s ease-in-out infinite;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const ListViewport = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* Rows drop the time when the panel is narrow, so the action keeps its room */
  container-type: inline-size;
`;

export const Row = styled.div<{ $selected: boolean; $playing: boolean; $minor: boolean; $focused: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: ${ROW_HEIGHT}px;
  /* With the 3px playing marker, the number lines up with the header's 12px edge */
  padding: 0 12px 0 9px;
  border-left: 3px solid transparent;
  color: ${({ $minor }) => ($minor ? tokens.color.textMuted : tokens.color.text)};
  font-size: ${tokens.font.size.sm}px;
  cursor: default;
  user-select: none;

  &:hover {
    background: ${tokens.color.surfaceMuted};
  }

  ${({ $selected }) =>
    $selected &&
    css`
      background: ${tokens.color.primaryBg};
      &:hover {
        background: ${tokens.color.primaryBg};
      }
    `}

  ${({ $focused }) =>
    $focused &&
    css`
      :host([data-hi-keyboard]) & {
        box-shadow: inset 0 0 0 2px ${tokens.color.focusRing};
      }
    `}

  ${({ $playing }) =>
    $playing &&
    css`
      border-left-color: ${tokens.color.primary};
      background: ${tokens.color.primaryBg};
    `}
`;

/** As wide as the longest number in the list (set on ListViewport), not a fixed gap before short ones */
export const RowNumber = styled.span`
  flex: none;
  min-width: calc(var(--row-number-digits, 2) * 1ch);
  color: ${tokens.color.textMuted};
  font-family: ${tokens.font.mono};
  font-size: 11px;
  text-align: right;
`;

export const RowIcon = styled.span<{ $navigation: boolean }>`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${tokens.radius.md}px;
  background: ${({ $navigation }) => ($navigation ? tokens.color.successBg : tokens.color.surfaceMuted)};
  color: ${({ $navigation }) => ($navigation ? tokens.color.success : tokens.color.textSecondary)};

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const RowText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong {
    font-weight: 600;
  }
`;

export const RowMeta = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 45%;
  color: ${tokens.color.textMuted};
  font-size: 11px;
  font-variant-numeric: tabular-nums;
`;

export const RowTime = styled.span`
  @container (max-width: 380px) {
    display: none;
  }
`;

export const Chip = styled.span<{ $tone?: "primary" | "muted" }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  border-radius: 999px;
  line-height: 18px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $tone }) => ($tone === "muted" ? tokens.color.surfaceMuted : tokens.color.primaryBg)};
  color: ${({ $tone }) => ($tone === "muted" ? tokens.color.textSecondary : tokens.color.primary)};
  border: 1px solid ${({ $tone }) => ($tone === "muted" ? tokens.color.border : tokens.color.primaryBorder)};
  min-width: 0;
  max-width: 120px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  svg {
    flex: none;
  }
`;

export const ReplayBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid ${tokens.color.border};
  background: ${tokens.color.primaryBg};
  font-size: ${tokens.font.size.sm}px;
`;

export const Progress = styled.div<{ $value: number }>`
  height: 3px;
  border-radius: 999px;
  background: ${tokens.color.primaryBorder};
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $value }) => Math.round($value * 100)}%;
    background: ${tokens.color.primary};
    transition: width 0.2s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      transition: none;
    }
  }
`;

export const FooterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${tokens.color.surfaceMuted};
`;
