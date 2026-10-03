import React from "react";
import { IconAlertTriangle, IconCheck, IconQuestionMark } from "@tabler/icons-react";
import { tokens } from "@entrypoints/shared/styles/tokens";
import type { ThemeMatch } from "../utils/themeDiff";

const STYLE = {
  match: { bg: tokens.color.successBg, fg: tokens.color.success, border: "#bbf7d0", Icon: IconCheck },
  near: { bg: tokens.color.warningBg, fg: tokens.color.warning, border: "#fde68a", Icon: IconQuestionMark },
  off: { bg: tokens.color.dangerBg, fg: tokens.color.danger, border: "#fecaca", Icon: IconAlertTriangle },
} as const;

/** One line for tooltips and screen readers */
export const describeMatch = (match: ThemeMatch): string => {
  if (match.status === "match") return `Matches theme token ${match.token}`;
  const nearest = match.token ? `nearest token ${match.token}${match.tokenValue ? ` (${match.tokenValue})` : ""}` : "no token close";
  return `${match.status === "near" ? "Close to the theme" : "Not in the theme"}: ${nearest}${match.delta ? `, ${match.delta}` : ""}`;
};

/** ✓ matches a theme token, ? close to one, ⚠ nothing close */
export const MatchBadge: React.FC<{ match: ThemeMatch | null | undefined; size?: number; className?: string }> = ({
  match,
  size = 16,
  className = "",
}) => {
  if (!match) return null;
  const { bg, fg, border, Icon } = STYLE[match.status];
  const label = describeMatch(match);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, border: `1px solid ${border}` }}
    >
      <Icon size={size - 6} stroke={2.5} aria-hidden />
    </span>
  );
};

/** The theme status as a sentence, for the detail panel */
export const MatchLine: React.FC<{ label?: string; match: ThemeMatch | null }> = ({ label, match }) => {
  if (!match) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {label && <span className="w-20 shrink-0 text-gray-600">{label}</span>}
        <span>Not defined in the theme</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 text-xs">
      {label && <span className="w-20 shrink-0 text-gray-600 pt-px">{label}</span>}
      <MatchBadge match={match} />
      <span className="min-w-0 text-gray-700">
        {match.status === "match" ? (
          <>
            Matches <code className="font-mono text-gray-900 break-all">{match.token}</code>
          </>
        ) : (
          <>
            {match.status === "near" ? "Close to " : "Not in the theme. Nearest: "}
            <code className="font-mono text-gray-900 break-all">{match.token}</code>
            {match.tokenValue && <span className="font-mono text-gray-500 break-all"> {match.tokenValue}</span>}
            {match.delta && <span style={{ color: STYLE[match.status].fg }}> · {match.delta}</span>}
          </>
        )}
      </span>
    </div>
  );
};
