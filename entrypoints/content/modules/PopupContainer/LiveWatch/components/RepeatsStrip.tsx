import React, { useState } from "react";
import { IconChevronDown, IconChevronUp, IconEyeOff, IconRepeat } from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { dismissPattern } from "../store";
import { DetectedPattern } from "../types";
import { Chip } from "./WatchLogPanel.styled";
import { RepeatButton, RepeatRow, RepeatsHeader, RepeatsSection } from "./RepeatsStrip.styled";

interface RepeatsStripProps {
  patterns: DetectedPattern[];
  /** Selects the rows of the pattern's latest round in the log */
  onSelect: (pattern: DetectedPattern) => void;
  /** Rows the pattern's latest round has in the log, for its label */
  rowCount: (pattern: DetectedPattern) => number;
}

/** Collapsed, only the best chain is listed */
const SHOWN_EXPANDED = 5;

const chainText = (pattern: DetectedPattern) => {
  const labels = pattern.events.map((event) => event.label).filter(Boolean);
  if (labels.length <= 2) return labels.join(" → ");
  return `${labels[0]} → … → ${labels[labels.length - 1]}`;
};

/**
 * The chains of steps the user repeats, under the log. Nothing pops up: clicking a chain selects its latest
 * round in the log, and the panel's own Play or Save as scenario does the rest, if the user wants it.
 */
export const RepeatsStrip: React.FC<RepeatsStripProps> = ({ patterns, onSelect, rowCount }) => {
  const [expanded, setExpanded] = useState(false);
  if (!patterns.length) return null;
  const shown = expanded ? patterns.slice(0, SHOWN_EXPANDED) : patterns.slice(0, 1);

  return (
    <RepeatsSection aria-label="Repeated steps">
      <RepeatsHeader>
        <IconRepeat size={14} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          {patterns.length === 1 ? "You repeat one chain of steps" : `You repeat ${patterns.length} chains of steps`}
        </span>
        {patterns.length > 1 && (
          <IconButton label={expanded ? "Show only the best chain" : "Show every chain"} size={24} onClick={() => setExpanded(!expanded)}>
            {expanded ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
          </IconButton>
        )}
      </RepeatsHeader>
      {shown.map((pattern) => (
        <RepeatRow key={pattern.id}>
          <RepeatButton
            type="button"
            onClick={() => onSelect(pattern)}
            title={`Select: ${pattern.events.map((event) => event.label).join(" → ")}`}
          >
            <Chip>{rowCount(pattern)} steps</Chip>
            <Chip $tone="muted">×{pattern.occurrences}</Chip>
            <span className="min-w-0 flex-1 truncate">{chainText(pattern)}</span>
          </RepeatButton>
          <IconButton label="Don't suggest this chain again" size={24} onClick={() => dismissPattern(pattern.id)}>
            <IconEyeOff size={14} />
          </IconButton>
        </RepeatRow>
      ))}
    </RepeatsSection>
  );
};
