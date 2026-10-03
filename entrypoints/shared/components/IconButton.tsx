import React, { forwardRef } from "react";
import styled, { css } from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

type Variant = "ghost" | "primary" | "danger";

const variants: Record<Variant, ReturnType<typeof css>> = {
  ghost: css`
    background: transparent;
    color: ${tokens.color.textSecondary};
    &:hover:not(:disabled) {
      background: #f3f4f6;
      color: ${tokens.color.text};
    }
  `,
  primary: css`
    background: ${tokens.color.primary};
    color: #fff;
    &:hover:not(:disabled) {
      background: ${tokens.color.primaryHover};
    }
  `,
  danger: css`
    background: ${tokens.color.danger};
    color: #fff;
    &:hover:not(:disabled) {
      background: ${tokens.color.dangerHover};
    }
  `,
};

const StyledIconButton = styled.button<{ $variant: Variant; $active?: boolean; $size: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  padding: 0;
  border: none;
  border-radius: ${tokens.radius.md}px;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    color 150ms ease;
  ${(p) => variants[p.$variant]}
  ${(p) =>
    p.$active &&
    p.$variant === "ghost" &&
    css`
      background: ${tokens.color.primaryBg};
      color: ${tokens.color.primary};
      &:hover:not(:disabled) {
        background: #dbeafe;
        color: ${tokens.color.primaryHover};
      }
    `}

  &:disabled {
    cursor: not-allowed;
    background: #f3f4f6;
    color: #9ca3af;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Accessible name; also used as the tooltip unless `title` is given */
  label: string;
  variant?: Variant;
  /** Toggle buttons: highlighted and announced as pressed */
  active?: boolean;
  /** Square size in px (default 28, fits the panel header) */
  size?: number;
}

/**
 * Square icon-only button used in panel headers and toolbars, so every tool's header actions look and
 * behave the same: one size, one hover, a visible focus ring and an accessible name.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, variant = "ghost", active, size = 28, title, type = "button", children, ...rest }, ref) => (
    <StyledIconButton
      ref={ref}
      type={type}
      aria-label={label}
      title={title ?? label}
      aria-pressed={active === undefined ? undefined : active}
      $variant={variant}
      $active={active}
      $size={size}
      {...rest}
    >
      {children}
    </StyledIconButton>
  ),
);

IconButton.displayName = "IconButton";
