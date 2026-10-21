import React, { useMemo } from "react";
import { IconArrowsMaximize, IconArrowsMinimize, IconEyeOff, IconMapPin, IconRepeat } from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { dismissPattern } from "../store";
import { DetectedPattern } from "../types";
import { groupByRoute, routeOf } from "../utils/routes";
import { Chip } from "./WatchLogPanel.styled";
import { RepeatButton, RepeatRow, RepeatsHeader, RepeatsSection, RouteHeader } from "./RepeatsStrip.styled";

interface RepeatsStripProps {
  patterns: DetectedPattern[];
  /** Selects the rows of the pattern's latest round in the log */
  onSelect: (pattern: DetectedPattern) => void;
  /** Rows the pattern's latest round has in the log, for its label */
  rowCount: (pattern: DetectedPattern) => number;
  /** The repeats fill the panel instead of the log */
  full: boolean;
  onToggleFull: () => void;
}

const chainText = (pattern: DetectedPattern, full: boolean) => {
  const labels = pattern.events.map((event) => event.label).filter(Boolean);
  // With the whole panel there is room for every step
  if (full || labels.length <= 2) return labels.join(" → ");
  return `${labels[0]} → … → ${labels[labels.length - 1]}`;
};

/**
 * The chains of steps the user repeats, under the log, grouped by the page each starts on (the current page
 * first). Clicking a chain selects its latest round, and the panel's own Play or Save as scenario does the
 * rest. They can take the whole panel; the log keeps recording meanwhile.
 */
export const RepeatsStrip: React.FC<RepeatsStripProps> = ({ patterns, onSelect, rowCount, full, onToggleFull }) => {
  const groups = useMemo(() => groupByRoute(patterns, routeOf(window.location.href)), [patterns]);
  if (!patterns.length) return null;

  return (
    <RepeatsSection aria-label="Repeated steps">
      <RepeatsHeader>
        <IconRepeat size={14} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          {patterns.length === 1 ? "You repeat one chain of steps" : `You repeat ${patterns.length} chains of steps`}
        </span>
        <IconButton label={full ? "Show the log again" : "Show the repeats on the whole panel"} size={24} onClick={onToggleFull}>
          {full ? <IconArrowsMinimize size={14} aria-hidden="true" /> : <IconArrowsMaximize size={14} aria-hidden="true" />}
        </IconButton>
      </RepeatsHeader>
      {groups.map((group) => (
        <div key={group.route} role="group" aria-label={`${group.current ? "This page" : "Page"} ${group.route}`}>
          <RouteHeader $current={group.current} title={group.route}>
            <IconMapPin size={12} className="flex-none" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-mono">{group.route}</span>
            {group.current && <Chip>This page</Chip>}
          </RouteHeader>
          {group.patterns.map((pattern) => (
            <RepeatRow key={pattern.id}>
              <RepeatButton
                type="button"
                $wrap={full}
                onClick={() => onSelect(pattern)}
                title={`Select: ${pattern.events.map((event) => event.label).join(" → ")}`}
              >
                <Chip>{rowCount(pattern)} steps</Chip>
                <Chip $tone="muted">×{pattern.occurrences}</Chip>
                <span className={full ? "min-w-0 flex-1" : "min-w-0 flex-1 truncate"}>{chainText(pattern, full)}</span>
              </RepeatButton>
              <IconButton label="Don't suggest this chain again" size={24} onClick={() => dismissPattern(pattern.id)}>
                <IconEyeOff size={14} />
              </IconButton>
            </RepeatRow>
          ))}
        </div>
      ))}
    </RepeatsSection>
  );
};
