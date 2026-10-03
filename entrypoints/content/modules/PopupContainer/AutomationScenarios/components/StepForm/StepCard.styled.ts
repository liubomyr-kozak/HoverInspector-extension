import styled, { css, keyframes } from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

export const StepList = styled.ol`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Actions = styled.div`
  display: none;
  flex: none;
  align-items: center;
  gap: 2px;
`;

export const Card = styled.li<{ $expanded: boolean; $invalid: boolean }>`
  border: 1px solid ${({ $invalid }) => ($invalid ? tokens.color.danger : tokens.color.border)};
  border-radius: 10px;
  background: ${tokens.color.surface};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: ${({ $invalid }) => ($invalid ? tokens.color.danger : tokens.color.borderStrong)};
  }

  ${({ $expanded, $invalid }) =>
    $expanded &&
    css`
      border-color: ${$invalid ? tokens.color.danger : tokens.color.primaryBorder};
      box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.06),
        0 10px 24px -10px rgba(15, 23, 42, 0.18);

      &:hover {
        border-color: ${$invalid ? tokens.color.danger : tokens.color.primaryBorder};
      }

      ${Actions} {
        display: flex;
      }
    `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 4px 6px 4px 4px;

  &:hover ${Actions}, &:focus-within ${Actions} {
    display: flex;
  }
`;

/** The step's number, type and target; toggles the form */
export const Toggle = styled.button`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 4px 6px;
  border: none;
  border-radius: ${tokens.radius.md}px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
`;

export const StepNumber = styled.span<{ $expanded: boolean; $invalid: boolean }>`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid ${tokens.color.border};
  background: ${tokens.color.surfaceMuted};
  color: ${tokens.color.textSecondary};
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  ${({ $expanded }) =>
    $expanded &&
    css`
      border-color: ${tokens.color.primary};
      background: ${tokens.color.primary};
      color: ${tokens.color.surface};
    `}

  ${({ $invalid }) =>
    $invalid &&
    css`
      border-color: ${tokens.color.danger};
      background: ${tokens.color.dangerBg};
      color: ${tokens.color.danger};
    `}
`;

export const TypeGlyph = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.primaryBg};
  color: ${tokens.color.primary};
`;

export const Texts = styled.span`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

export const TitleLine = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${tokens.font.size.sm}px;
  font-weight: 600;
  line-height: 1.3;
  color: ${tokens.color.text};
`;

export const Incomplete = styled.span`
  flex: none;
  font-size: 11px;
  font-weight: 500;
  color: ${tokens.color.danger};
`;

export const DetailLine = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: ${tokens.font.size.xs}px;
  line-height: 1.35;
  color: ${tokens.color.textMuted};
`;

export const Target = styled.span`
  flex: 0 1 auto;
  min-width: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ValueChip = styled.span`
  flex: 0 3 auto;
  min-width: 32px;
  max-width: 60%;
  padding: 0 6px;
  border-radius: ${tokens.radius.sm}px;
  background: ${tokens.color.surfaceMuted};
  border: 1px solid ${tokens.color.border};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ${tokens.font.mono};
  font-size: 11px;
  color: ${tokens.color.textSecondary};
`;

export const Chevron = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  transition: transform 0.2s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? 180 : 0)}deg);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const reveal = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
`;

export const Body = styled.div`
  padding: 14px 14px 16px;
  border-top: 1px solid ${tokens.color.border};
  animation: ${reveal} 0.18s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* ---------- "Insert a step here" between the cards ---------- */

export const InsertSlot = styled.li`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12px;

  /* The line the new step would go on */
  &::before {
    content: "";
    position: absolute;
    left: 12px;
    right: 12px;
    top: 50%;
    height: 2px;
    border-radius: 2px;
    background: ${tokens.color.primary};
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover::before,
  &:focus-within::before {
    opacity: 1;
  }
`;

export const InsertButton = styled.button`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 8px 0 6px;
  border: none;
  border-radius: 999px;
  background: ${tokens.color.primary};
  color: ${tokens.color.surface};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;

  ${InsertSlot}:hover &,
  &:focus-visible {
    opacity: 1;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;
