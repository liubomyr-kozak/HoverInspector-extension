import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Input } from "antd";
import { IconEye, IconX } from "@tabler/icons-react";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { ZINDEX_LAUNCHER_CONTAINER } from "@entrypoints/shared/constant/zIndex";
import { useLiveWatch } from "../LiveWatchContext";
import { Suggestion, SuggestionKind, WatchEvent, WatchEventKind } from "../types";
import { RunPhase, PatternRun } from "../usePatternRun";
import { describeEvent } from "../utils/patterns";
import { TargetHighlight } from "./TargetHighlight";

const MAX_LISTED_STEPS = 6;

const Card = styled.section`
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: ${ZINDEX_LAUNCHER_CONTAINER};
  width: 320px;
  max-width: calc(100vw - 32px);
  padding: 12px;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg}px;
  background: ${tokens.color.surface};
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
  color: ${tokens.color.text};
  font-family: ${tokens.font.family};
  font-size: ${tokens.font.size.sm}px;
  line-height: 1.4;
`;

const StepRow = styled.li<{ $current?: boolean }>`
  display: flex;
  gap: 8px;
  padding: 4px 6px;
  border-radius: ${tokens.radius.sm}px;
  background: ${({ $current }) => ($current ? tokens.color.primaryBg : "transparent")};
  color: ${tokens.color.textSecondary};

  &:hover {
    background: ${tokens.color.surfaceMuted};
  }
`;

const StepNumber = styled.span`
  flex: none;
  width: 16px;
  color: ${tokens.color.textMuted};
  text-align: right;
`;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

interface StepListProps {
  events: WatchEvent[];
  /** Number shown for the first event (1 unless the list continues a pattern) */
  firstNumber?: number;
  currentIndex?: number;
  onHover: (event: WatchEvent | null) => void;
}

/** The actions of a pattern; hovering one outlines its element on the page */
const StepList: React.FC<StepListProps> = ({ events, firstNumber = 1, currentIndex, onHover }) => {
  const shown = events.slice(0, MAX_LISTED_STEPS);
  return (
    <ol className="m-0 mt-2 p-0 list-none" onMouseLeave={() => onHover(null)}>
      {shown.map((event, i) => (
        <StepRow key={event.id} $current={currentIndex === i} onMouseEnter={() => onHover(event)}>
          <StepNumber>{firstNumber + i}</StepNumber>
          <span className="min-w-0 truncate">{describeEvent(event)}</span>
        </StepRow>
      ))}
      {events.length > shown.length && (
        <li className="pl-7 text-gray-500">and {plural(events.length - shown.length, "more step")}</li>
      )}
    </ol>
  );
};

const titleFor = (suggestion: Suggestion): string => {
  switch (suggestion.kind) {
    case SuggestionKind.PATTERN:
      return `You repeated this ${suggestion.pattern.occurrences} times`;
    case SuggestionKind.CONTINUE_PATTERN:
      return "Finish the repeated steps?";
    case SuggestionKind.CONTINUE_SCENARIO:
      return `Finish "${suggestion.title}"?`;
    case SuggestionKind.FIELD:
      return "Scenarios for this field";
    default:
      return "Live watching";
  }
};

/** Body of the card for a suggestion (nothing is running) */
const SuggestionBody: React.FC<{ suggestion: Suggestion; onHover: (event: WatchEvent | null) => void }> = ({
  suggestion,
  onHover,
}) => {
  const { playPattern, savePattern, playScenario, dismissForever, close } = useLiveWatch();

  if (suggestion.kind === SuggestionKind.FIELD) {
    return (
      <>
        <p className="m-0 text-gray-600">
          "{suggestion.fieldLabel}" is used by {plural(suggestion.matches.length, "scenario")}.
        </p>
        <ul className="m-0 mt-2 p-0 list-none flex flex-col gap-2">
          {suggestion.matches.map((match) => (
            <li key={match.scenarioId} className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-gray-800">{match.title}</span>
                <span className="block text-xs text-gray-500">
                  Step {match.stepIndex + 1} of {match.stepCount}
                </span>
              </span>
              <Button size="small" type="primary" onClick={() => playScenario(match.scenarioId)}>
                Run
              </Button>
              {match.stepIndex > 0 && (
                <Button size="small" onClick={() => playScenario(match.scenarioId, match.stepIndex)}>
                  From here
                </Button>
              )}
            </li>
          ))}
        </ul>
        <Button type="link" size="small" className="mt-2 px-0" onClick={dismissForever}>
          Don't suggest for this field
        </Button>
      </>
    );
  }

  if (suggestion.kind === SuggestionKind.CONTINUE_SCENARIO) {
    return (
      <>
        <p className="m-0 text-gray-600">
          Your last actions are the start of this scenario. {plural(suggestion.remaining, "step")} left.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="small" type="primary" onClick={() => playScenario(suggestion.scenarioId, suggestion.nextStepIndex)}>
            Play the rest
          </Button>
          <Button size="small" onClick={close}>
            Not now
          </Button>
        </div>
      </>
    );
  }

  const isContinuation = suggestion.kind === SuggestionKind.CONTINUE_PATTERN;
  const events = isContinuation ? suggestion.pattern.events.slice(suggestion.doneCount) : suggestion.pattern.events;
  const needsText = events.some((event) => event.kind === WatchEventKind.INPUT);

  return (
    <>
      <p className="m-0 text-gray-600">
        {isContinuation
          ? `You did ${suggestion.doneCount} of ${suggestion.pattern.events.length} steps you often repeat. Next:`
          : `${plural(events.length, "step")} on this page. Hover a step to see its element.`}
      </p>
      <StepList events={events} firstNumber={isContinuation ? suggestion.doneCount + 1 : 1} onHover={onHover} />
      {needsText && <p className="m-0 mt-2 text-xs text-gray-500">You'll be asked what to type in the fields.</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="small" type="primary" onClick={() => playPattern(false)}>
          {isContinuation ? "Play the rest" : "Play"}
        </Button>
        <Button size="small" onClick={() => playPattern(true)}>
          Step by step
        </Button>
        {!isContinuation && (
          <Button size="small" onClick={savePattern}>
            Save as scenario
          </Button>
        )}
      </div>
      <Button type="link" size="small" className="mt-2 px-0" onClick={dismissForever}>
        Don't suggest this again
      </Button>
    </>
  );
};

/** Body of the card while a pattern is replayed */
const RunBody: React.FC<{ run: PatternRun; onHover: (event: WatchEvent | null) => void }> = ({ run, onHover }) => {
  const { doStep, skipStep, stopRun, savePattern, typedValue } = useLiveWatch();
  const event = run.events[run.index];
  const [text, setText] = useState("");
  // Long patterns: keep the current step in the listed window
  const listStart = Math.max(0, Math.min(run.index - 1, run.events.length - MAX_LISTED_STEPS));

  // Prefill a typing step with the text typed there last on this page
  useEffect(() => {
    if (run.phase === RunPhase.WAITING_VALUE) setText(run.steps[run.index]?.value ?? typedValue(event?.xpath ?? "") ?? "");
  }, [run.phase, run.index]);

  if (run.phase === RunPhase.DONE) {
    return (
      <>
        <p className="m-0 text-gray-600">All {plural(run.steps.length, "step")} done.</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="small" type="primary" onClick={savePattern}>
            Save as scenario
          </Button>
          <Button size="small" onClick={stopRun}>
            Close
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="m-0 text-gray-500 text-xs">
        Step {run.index + 1} of {run.steps.length}
      </p>
      <StepList
        events={run.events.slice(listStart)}
        firstNumber={listStart + 1}
        currentIndex={run.index - listStart}
        onHover={onHover}
      />

      {run.phase === RunPhase.WAITING_VALUE && event && (
        <form
          className="flex gap-2 mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            doStep(text);
          }}
        >
          <Input
            size="small"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Text for "${event.label}"`}
            aria-label={`Text for "${event.label}"`}
          />
          <Button size="small" type="primary" htmlType="submit">
            Fill
          </Button>
        </form>
      )}
      {run.phase === RunPhase.WAITING_USER && (
        <p className="m-0 mt-3 text-gray-600">Do it on the page, or let the extension do it.</p>
      )}
      {run.phase === RunPhase.FAILED && (
        <p className="m-0 mt-3 text-red-600" role="alert">
          {run.error || "This step failed."}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {(run.phase === RunPhase.WAITING_USER || run.phase === RunPhase.FAILED) && (
          <Button size="small" type="primary" onClick={() => doStep()}>
            {run.phase === RunPhase.FAILED ? "Try again" : "Do it"}
          </Button>
        )}
        {run.phase !== RunPhase.PLAYING && (
          <Button size="small" onClick={skipStep}>
            Skip
          </Button>
        )}
        <Button size="small" danger onClick={stopRun}>
          Stop
        </Button>
      </div>
    </>
  );
};

/**
 * The live watching card, fixed in the bottom-right corner: a suggestion, or the replay of a pattern
 */
export const SuggestionCard: React.FC = () => {
  const { suggestion, run, close, stopRun } = useLiveWatch();
  const [hovered, setHovered] = useState<WatchEvent | null>(null);

  useEffect(() => setHovered(null), [suggestion, run?.index]);

  if (!suggestion && !run) return null;

  const current = run && run.phase !== RunPhase.DONE ? run.events[run.index] : null;
  const outlined = hovered || current;
  const title = run ? (run.guided ? "Step by step" : run.phase === RunPhase.DONE ? "Done" : "Playing") : titleFor(suggestion!);

  return (
    <>
      {outlined && (
        <TargetHighlight
          xpath={outlined.xpath}
          alternativeXpaths={outlined.alternativeXpaths}
          scrollIntoView={!hovered}
        />
      )}
      <Card aria-label="Live watching suggestion">
        <div className="flex items-start gap-2">
          <IconEye size={18} className="flex-none mt-px text-blue-600" aria-hidden="true" />
          <h2 className="m-0 flex-1 min-w-0 text-sm font-semibold text-gray-800" aria-live="polite">
            {title}
          </h2>
          <IconButton label={run ? "Stop" : "Close suggestion"} size={24} onClick={run ? stopRun : close}>
            <IconX />
          </IconButton>
        </div>
        <div className="mt-1">
          {run ? <RunBody run={run} onHover={setHovered} /> : <SuggestionBody suggestion={suggestion!} onHover={setHovered} />}
        </div>
      </Card>
    </>
  );
};
