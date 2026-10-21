import styled from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

export const RepeatsSection = styled.section`
  flex: none;
  border-top: 1px solid ${tokens.color.border};
  background: ${tokens.color.surface};
  font-size: ${tokens.font.size.sm}px;
`;

export const RepeatsHeader = styled.header`
  /* Stays in view while the chains scroll under it */
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 2px 6px 2px 12px;
  background: ${tokens.color.primaryBg};
  color: ${tokens.color.primary};
  font-size: ${tokens.font.size.xs}px;
  font-weight: 600;
`;

export const RepeatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 6px 0 0;
  border-top: 1px solid ${tokens.color.border};
  color: ${tokens.color.text};

  &:hover {
    background: ${tokens.color.surfaceMuted};
  }
`;

/** The page a group of chains starts on; the current page is tinted */
export const RouteHeader = styled.div<{ $current: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 2px 8px 2px 12px;
  border-top: 1px solid ${tokens.color.border};
  background: ${({ $current }) => ($current ? tokens.color.successBg : tokens.color.surfaceMuted)};
  color: ${({ $current }) => ($current ? tokens.color.success : tokens.color.textSecondary)};
  font-size: 11px;
`;

/** The whole chain is the button that selects it in the log; on the whole panel its steps wrap */
export const RepeatButton = styled.button<{ $wrap?: boolean }>`
  display: flex;
  flex: 1 1 auto;
  flex-wrap: ${({ $wrap }) => ($wrap ? "wrap" : "nowrap")};
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 36px;
  padding: 4px 0 4px 12px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
`;
