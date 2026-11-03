// RobotIcon.tsx
import React from "react";
import "./robot.tsx";
import { StyledRobot } from "./robot.tsx";
import { ExecutionStatus } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types.ts";

interface RobotIconProps {
  size?: number | string;
  status?: ExecutionStatus | null;
  variant?: number; // picks one of the silly animations (0–4)
}

export const RobotIcon: React.FC<RobotIconProps> = ({ size = 48, status = ExecutionStatus.SUCCESS, variant = 0 }) => {
  return (
    <StyledRobot
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      $status={status!}
      $variant={variant}
    >
      {/* Head */}
      <rect x="10" y="14" width="28" height="20" rx="4" stroke="#555" strokeWidth="2.5" fill="none" />

      {/* Antenna */}
      <line x1="24" y1="8" x2="24" y2="14" stroke="#555" strokeWidth="2" />
      <circle cx="24" cy="6" r="3" fill="#555" className="hover-inspector-antenna" />

      {/* Eyes */}
      {status === ExecutionStatus.ERROR ? (
        <>
          {/* Left eye as a cross */}
          <line className="hover-inspector-error-eye" x1="16" y1="22" x2="20" y2="26" />
          <line className="hover-inspector-error-eye" x1="20" y1="22" x2="16" y2="26" />

          {/* Right eye as a cross */}
          <line className="hover-inspector-error-eye" x1="28" y1="22" x2="32" y2="26" />
          <line className="hover-inspector-error-eye" x1="32" y1="22" x2="28" y2="26" />
        </>
      ) : (
        <>
          <circle className="hover-inspector-eye hover-inspector-left" cx="18" cy="24" r="3" />
          <circle className="hover-inspector-eye hover-inspector-right" cx="30" cy="24" r="3" />
        </>
      )}

      {/* Ears */}
      <rect x="5" y="20" width="3" height="8" fill="#555" />
      <rect x="40" y="20" width="3" height="8" fill="#555" />
    </StyledRobot>
  );
};
