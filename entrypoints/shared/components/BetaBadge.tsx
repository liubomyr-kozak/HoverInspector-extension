import React from "react";
import styled, { css } from "styled-components";

type BetaBadgeVariant = "gradient" | "solid" | "subtle" | "outline" | "minimal";

export interface BetaBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BetaBadgeVariant;
}

interface StyledProps {
  $variant: BetaBadgeVariant;
}

const baseColor = "#ff6b4a"; // primary accent for beta
const gradient = "linear-gradient(135deg, #ff7e5f, #feb47b)"; // legacy gradient kept as an option

const variantStyles = {
  gradient: css`
    background: ${gradient};
    color: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    border: none;
  `,
  solid: css`
    background: ${baseColor};
    color: #fff;
    border: none;
  `,
  subtle: css`
    background: rgba(255, 107, 74, 0.12);
    color: ${baseColor};
    border: 1px solid rgba(255, 107, 74, 0.28);
  `,
  outline: css`
    background: transparent;
    color: ${baseColor};
    border: 1px solid ${baseColor};
  `,
  minimal: css`
    background: rgba(0, 0, 0, 0.05);
    color: #555;
    border: 1px solid rgba(0, 0, 0, 0.15);
    font-weight: 500;
    letter-spacing: 0.4px;
    box-shadow: none;
  `,
};

const StyledBadge = styled.span<StyledProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  border-radius: 999px;
  padding: 3px 8px 4px; /* tiny optical tweak */
  text-transform: uppercase;
  letter-spacing: 0.6px;
  user-select: none;
  white-space: nowrap;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen;
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  ${(p) => variantStyles[p.$variant]};

  /* Hover focus states (non-intrusive) */
  &:hover {
    ${(p) =>
      p.$variant === "outline"
        ? css`background: ${baseColor}; color: #fff;`
        : p.$variant === "subtle"
        ? css`background: rgba(255, 107, 74, 0.18);`
        : p.$variant === "solid"
        ? css`filter: brightness(1.05);`
        : p.$variant === "gradient"
        ? css`filter: brightness(1.07);`
        : css``}
  }
`;

// Default export component keeping backward compatibility with previous usage <BetaBadge>Beta</BetaBadge>
export const BetaBadge: React.FC<BetaBadgeProps> = ({ variant = "gradient", children, ...rest }) => {
  return (
    <StyledBadge $variant={variant} {...rest}>
      {children || "Beta"}
    </StyledBadge>
  );
};

// Small helper if we ever want to use named variants directly
export const BetaBadgeGradient: React.FC<Omit<BetaBadgeProps, "variant">> = (props) => (
  <BetaBadge variant="gradient" {...props} />
);
export const BetaBadgeSolid: React.FC<Omit<BetaBadgeProps, "variant">> = (props) => (
  <BetaBadge variant="solid" {...props} />
);
export const BetaBadgeSubtle: React.FC<Omit<BetaBadgeProps, "variant">> = (props) => (
  <BetaBadge variant="subtle" {...props} />
);
export const BetaBadgeMinimal: React.FC<Omit<BetaBadgeProps, "variant">> = (props) => (
  <BetaBadge variant="minimal" {...props} />
);