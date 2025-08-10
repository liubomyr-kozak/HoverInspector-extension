import React from "react";
import { BetaBadge } from "@entrypoints/shared/components/BetaBadge.tsx";
import type { IconProps } from "@tabler/icons-react";

export interface FeatureIconProps {
  icon: any;
  size?: number;
  className?: string;
  squareClassName?: string;
  bg?: string;
  border?: string;
  isBetta?: boolean; // show small beta badge in bottom-right corner
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Reusable square wrapper for header feature icons.
 * Provides consistent sizing, padding, background and color.
 */
export const FeatureIcon: React.FC<FeatureIconProps> = ({
  icon,
  size = 20,
  className = "",
  squareClassName = "",
  bg = "bg-blue-500",
  border = "border border-blue-200",
  isBetta = false,
  onClick,
}) => {
  const Icon = icon as any;

  return (
    <div className={`relative inline-flex mr-1 ${squareClassName}`} style={{ lineHeight: 0 }}>
      <div
        className={`inline-flex items-center justify-center rounded-md ${bg} ${border} w-[28px] h-[28px] ${onClick ? `cursor-pointer hover:bg-blue-800` : ""}`}
        onClick={onClick}
      >
        <Icon size={size} className={`${className} text-white`} />
      </div>
      {isBetta && (
        <span className="absolute -bottom-1 -right-1" title="Beta feature">
          <BetaBadge
            variant="gradient"
            style={{
              padding: "0 3px 1px",
              fontSize: 7,
              lineHeight: 1,
              borderRadius: 5,
              fontWeight: 600,
              letterSpacing: 0.5,
              boxShadow: "0 0 0 1px rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.35)",
            }}
            aria-label="Beta"
          >
            Beta
          </BetaBadge>
        </span>
      )}
    </div>
  );
};
