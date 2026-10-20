import styled from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

export const RepeatsSection = styled.section`
  flex: none;
  border-top: 1px solid ${tokens.color.border};
  background: ${tokens.color.surface};
  font-size: ${tokens.font.size.sm}px;
`;

export const RepeatsHeader = styled.header`
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
  padding: 4px 6px 4px 12px;
  border-top: 1px solid ${tokens.color.border};
  color: ${tokens.color.text};
`;
