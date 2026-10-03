import styled, { css, keyframes } from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { IconButton } from "@entrypoints/shared/components/IconButton";

/* ---------- Fields of the step form ---------- */

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

export const FieldHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
`;

export const Label = styled.label`
  font-size: ${tokens.font.size.xs}px;
  font-weight: 600;
  color: ${tokens.color.textSecondary};
`;

export const Optional = styled.span`
  margin-left: 6px;
  font-weight: 400;
  color: ${tokens.color.textMuted};
`;

export const Hint = styled.p`
  margin: 0;
  font-size: ${tokens.font.size.xs}px;
  line-height: 1.45;
  color: ${tokens.color.textMuted};

  code {
    padding: 0 4px;
    border-radius: ${tokens.radius.sm}px;
    background: ${tokens.color.surfaceMuted};
    border: 1px solid ${tokens.color.border};
    font-family: ${tokens.font.mono};
    font-size: 11px;
    color: ${tokens.color.text};
  }
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.danger};
`;

/** antd fields take the mono font where they hold code or XPaths */
export const monoField = css`
  font-family: ${tokens.font.mono};
  font-size: ${tokens.font.size.xs}px;
  line-height: 1.5;
`;

export const MonoArea = styled.div`
  textarea,
  input {
    ${monoField}
  }
`;

/* ---------- The element of a step ---------- */

export type Tone = "success" | "warning" | "danger" | "muted" | "primary";

const tones: Record<Tone, { color: string; bg: string }> = {
  success: { color: tokens.color.success, bg: tokens.color.successBg },
  warning: { color: tokens.color.warning, bg: tokens.color.warningBg },
  danger: { color: tokens.color.danger, bg: tokens.color.dangerBg },
  muted: { color: tokens.color.textMuted, bg: tokens.color.surfaceMuted },
  primary: { color: tokens.color.primary, bg: tokens.color.primaryBg },
};

export const StatusChip = styled.span<{ $tone: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ $tone }) => tones[$tone].bg};
  color: ${({ $tone }) => tones[$tone].color};
  font-size: ${tokens.font.size.xs}px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &::before {
    content: "";
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
  }
`;

export const ElementToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  > ${StatusChip} {
    flex: 0 1 auto;
    margin-right: auto;
  }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45); }
  100% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
`;

/** Shown while the user picks the element on the page */
export const PickingBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 12px;
  border: 1px solid ${tokens.color.primaryBorder};
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.primaryBg};
  color: ${tokens.color.primary};
  font-size: ${tokens.font.size.xs}px;
  font-weight: 500;

  &::before {
    content: "";
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${tokens.color.primary};
    animation: ${pulse} 1.2s ease-out infinite;
  }

  > span {
    flex: 1 1 auto;
    min-width: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

export const Fallbacks = styled.details`
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textMuted};

  summary {
    width: fit-content;
    cursor: pointer;
    user-select: none;
  }

  ol {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }
`;

export const FallbackRow = styled.li`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 8px;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.surfaceMuted};

  code {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ${tokens.font.mono};
    font-size: 11px;
    color: ${tokens.color.textSecondary};
  }
`;

/* ---------- Type picker ---------- */

export const TypeOption = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  svg {
    flex: none;
    color: ${tokens.color.textMuted};
  }
`;

/** A switch with its label and a line under it */
export const SwitchRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.surfaceMuted};
  cursor: pointer;

  > span {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: ${tokens.font.size.sm}px;
    font-weight: 500;
    color: ${tokens.color.text};
  }

  small {
    font-size: ${tokens.font.size.xs}px;
    font-weight: 400;
    color: ${tokens.color.textMuted};
  }
`;

export const StoredValues = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const StoredValueChip = styled.li`
  max-width: 100%;
  padding: 1px 8px;
  border: 1px solid ${tokens.color.border};
  border-radius: 999px;
  background: ${tokens.color.surfaceMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ${tokens.font.mono};
  font-size: 11px;
  color: ${tokens.color.textSecondary};
`;

export const FormFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid ${tokens.color.border};

  > :first-child {
    margin-right: auto;
  }
`;

/** The shared icon button with a smaller glyph, for compact rows */
export const SmallIconButton = styled(IconButton)`
  svg {
    width: 15px;
    height: 15px;
  }
`;

/* ---------- The scenario form around the steps ---------- */

export const ScenarioForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

export const DetailsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.surfaceMuted};
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${tokens.color.border};

  h3 {
    margin: 0;
    font-size: ${tokens.font.size.xs}px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${tokens.color.textSecondary};
  }

  > :last-child:not(:nth-child(2)) {
    margin-left: auto;
  }
`;

export const CountBadge = styled.span`
  padding: 0 7px;
  border-radius: 999px;
  background: ${tokens.color.primaryBg};
  color: ${tokens.color.primary};
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
`;

export const Alert = styled.p`
  margin: 0;
  padding: 8px 10px;
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.dangerBg};
  color: ${tokens.color.danger};
  font-size: ${tokens.font.size.xs}px;
`;
