import React, { useEffect, useState } from "react";
import { Button, Input } from "antd";
import {
  IconCheck,
  IconDeviceFloppy,
  IconEye,
  IconEyeOff,
  IconForms,
  IconHandFinger,
  IconKeyboard,
  IconPlayerPlayFilled,
  IconPlayerSkipForward,
  IconPlayerStopFilled,
  IconPointer,
  IconRefresh,
  IconSelector,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { useLiveWatch } from "../LiveWatchContext";
import { Suggestion, SuggestionKind, WatchEvent, WatchEventKind } from "../types";
import { PatternRun, RunPhase } from "../usePatternRun";
import { describeEventParts } from "../utils/patterns";
import { TargetHighlight } from "./TargetHighlight";
import {
  Body,
  Card,
  CountBadge,
  Dot,
  ErrorBox,
  Footer,
  Header,
  Headline,
  Hint,
  KindIcon,
  Progress,
  ScenarioRow,
  StepState,
  StepText,
  Timeline,
  TimelineItem,
} from "./SuggestionCard.styled";

const MAX_LISTED_STEPS = 6;

const KIND_ICONS: Record<WatchEventKind, React.ComponentType> = {
  [WatchEventKind.CLICK]: IconPointer,
  [WatchEventKind.INPUT]: IconForms,
  [WatchEventKind.SELECT]: IconSelector,
  [WatchEventKind.KEY_PRESS]: IconKeyboard,
  [WatchEventKind.NAVIGATE]: IconWorld,
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** antd icon slot: keeps the icon centred on the text line */
const buttonIcon = (Icon: React.ComponentType<{ size?: number }>) => (
  <span className="flex items-center">
    <Icon size={14} />
  </span>
);

interface StepListProps {
  events: WatchEvent[];
  /** Number shown for the first event (1 unless the list continues a pattern) */
  firstNumber?: number;
  /** Index in `events` of the step being done; earlier ones show as done */
  currentIndex?: number;
  onHover: (event: WatchEvent | null) => void;
}

/** The actions of a pattern as a timeline; hovering one outlines its element on the page */
const StepList: React.FC<StepListProps> = ({ events, firstNumber = 1, currentIndex, onHover }) => {
  const shown = events.slice(0, MAX_LISTED_STEPS);
  const stateOf = (i: number): StepState =>
    currentIndex === undefined || i > currentIndex ? "todo" : i === currentIndex ? "current" : "done";
  return (
    <Timeline onMouseLeave={() => onHover(null)}>
      {shown.map((event, i) => {
        const state = stateOf(i);
        const { verb, target, detail } = describeEventParts(event);
        const KindGlyph = KIND_ICONS[event.kind];
        return (
          <TimelineItem key={event.id} $state={state} onMouseEnter={() => onHover(event)} aria-current={state === "current" ? "step" : undefined}>
            <Dot $state={state}>{state === "done" ? <IconCheck aria-label="Done" /> : firstNumber + i}</Dot>
            <StepText title={`${verb} ${target}${detail ? `: ${detail}` : ""}`}>
              {verb} <strong>{target}</strong>
              {detail && <> · {detail}</>}
            </StepText>
            <KindIcon aria-hidden="true">
              <KindGlyph />
            </KindIcon>
          </TimelineItem>
        );
      })}
      {events.length > shown.length && <Hint className="pl-9">+ {plural(events.length - shown.length, "more step")}</Hint>}
    </Timeline>
  );
};

interface SectionProps {
  onHover: (event: WatchEvent | null) => void;
}

/** A card: header actions, body and footer for one state */
interface CardParts {
  body: React.ReactNode;
  footer?: React.ReactNode;
}

const useSuggestionParts = (suggestion: Suggestion, { onHover }: SectionProps): CardParts => {
  const { playPattern, savePattern, playScenario, close } = useLiveWatch();

  if (suggestion.kind === SuggestionKind.FIELD) {
    return {
      body: (
        <>
          <Headline>
            <span className="min-w-0 truncate">Scenarios for "{suggestion.fieldLabel}"</span>
            <CountBadge>{suggestion.matches.length}</CountBadge>
          </Headline>
          <Hint>Run one from the start, or from the step that fills this field.</Hint>
          <ul className="m-0 mt-3 p-0 list-none flex flex-col gap-2">
            {suggestion.matches.map((match) => (
              <ScenarioRow key={match.scenarioId}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-gray-800">{match.title}</span>
                  <span className="block text-xs text-gray-500">
                    Step {match.stepIndex + 1} of {match.stepCount}
                  </span>
                </span>
                {match.stepIndex > 0 && (
                  <Button size="small" type="text" onClick={() => playScenario(match.scenarioId, match.stepIndex)}>
                    From here
                  </Button>
                )}
                <Button
                  size="small"
                  type="primary"
                  icon={buttonIcon(IconPlayerPlayFilled)}
                  onClick={() => playScenario(match.scenarioId)}
                >
                  Run
                </Button>
              </ScenarioRow>
            ))}
          </ul>
        </>
      ),
    };
  }

  if (suggestion.kind === SuggestionKind.CONTINUE_SCENARIO) {
    return {
      body: (
        <>
          <Headline>
            <span className="min-w-0 truncate">Finish "{suggestion.title}"?</span>
          </Headline>
          <Hint>Your last actions are how this scenario starts. {plural(suggestion.remaining, "step")} left.</Hint>
        </>
      ),
      footer: (
        <>
          <Button
            size="small"
            type="primary"
            icon={buttonIcon(IconPlayerPlayFilled)}
            onClick={() => playScenario(suggestion.scenarioId, suggestion.nextStepIndex)}
          >
            Play the rest
          </Button>
          <Button size="small" type="text" onClick={close}>
            Not now
          </Button>
        </>
      ),
    };
  }

  const isContinuation = suggestion.kind === SuggestionKind.CONTINUE_PATTERN;
  const events = isContinuation ? suggestion.pattern.events.slice(suggestion.doneCount) : suggestion.pattern.events;
  const needsText = events.some((event) => event.kind === WatchEventKind.INPUT);

  return {
    body: (
      <>
        <Headline>
          {isContinuation ? "Finish the steps you repeat?" : `You repeat these ${plural(events.length, "step")}`}
          {!isContinuation && <CountBadge>{suggestion.pattern.occurrences}×</CountBadge>}
        </Headline>
        <Hint>
          {isContinuation
            ? `${suggestion.doneCount} of ${suggestion.pattern.events.length} done. Next:`
            : `Hover a step to see it on the page.${needsText ? " Fields ask for their text." : ""}`}
        </Hint>
        <StepList events={events} firstNumber={isContinuation ? suggestion.doneCount + 1 : 1} onHover={onHover} />
      </>
    ),
    footer: (
      <>
        <Button size="small" type="primary" icon={buttonIcon(IconPlayerPlayFilled)} onClick={() => playPattern(false)}>
          {isContinuation ? "Play the rest" : "Play"}
        </Button>
        <Button size="small" icon={buttonIcon(IconHandFinger)} onClick={() => playPattern(true)}>
          Step by step
        </Button>
        {!isContinuation && (
          <Button size="small" type="text" className="ml-auto" icon={buttonIcon(IconDeviceFloppy)} onClick={savePattern}>
            Save
          </Button>
        )}
      </>
    ),
  };
};

const useRunParts = (run: PatternRun, { onHover }: SectionProps): CardParts => {
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
    return {
      body: (
        <>
          <Headline>
            All {plural(run.steps.length, "step")} done
            <CountBadge>
              <IconCheck size={12} className="align-[-2px]" aria-hidden="true" />
            </CountBadge>
          </Headline>
          <Hint>Save them as a scenario to run them from the Automation panel, on a schedule or by a trigger.</Hint>
        </>
      ),
      footer: (
        <>
          <Button size="small" type="primary" icon={buttonIcon(IconDeviceFloppy)} onClick={savePattern}>
            Save as scenario
          </Button>
          <Button size="small" type="text" onClick={stopRun}>
            Close
          </Button>
        </>
      ),
    };
  }

  const waitingForUser = run.phase === RunPhase.WAITING_USER || run.phase === RunPhase.FAILED;
  return {
    body: (
      <>
        <Headline>
          {run.phase === RunPhase.WAITING_VALUE
            ? `What goes in "${event?.label}"?`
            : run.phase === RunPhase.WAITING_USER
              ? "Your turn"
              : run.phase === RunPhase.FAILED
                ? "This step didn't work"
                : "Playing…"}
        </Headline>
        <Hint>
          {run.phase === RunPhase.WAITING_USER
            ? "Do the highlighted step on the page, or let the extension do it."
            : `Step ${run.index + 1} of ${run.steps.length}`}
        </Hint>
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
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Text for "${event.label}"`}
              aria-label={`Text for "${event.label}"`}
            />
            <Button type="primary" htmlType="submit">
              Fill
            </Button>
          </form>
        )}
        {run.phase === RunPhase.FAILED && <ErrorBox role="alert">{run.error || "The element was not found."}</ErrorBox>}
      </>
    ),
    footer: (
      <>
        {waitingForUser && (
          <Button
            size="small"
            type="primary"
            icon={buttonIcon(run.phase === RunPhase.FAILED ? IconRefresh : IconPlayerPlayFilled)}
            onClick={() => doStep()}
          >
            {run.phase === RunPhase.FAILED ? "Try again" : "Do it"}
          </Button>
        )}
        {run.phase !== RunPhase.PLAYING && (
          <Button size="small" icon={buttonIcon(IconPlayerSkipForward)} onClick={skipStep}>
            Skip
          </Button>
        )}
        <Button size="small" type="text" danger className="ml-auto" icon={buttonIcon(IconPlayerStopFilled)} onClick={stopRun}>
          Stop
        </Button>
      </>
    ),
  };
};

const SuggestionContent: React.FC<SectionProps & { suggestion: Suggestion }> = ({ suggestion, onHover }) => {
  const parts = useSuggestionParts(suggestion, { onHover });
  return <CardSections {...parts} />;
};

const RunContent: React.FC<SectionProps & { run: PatternRun }> = ({ run, onHover }) => {
  const parts = useRunParts(run, { onHover });
  return <CardSections {...parts} />;
};

const CardSections: React.FC<CardParts> = ({ body, footer }) => (
  <>
    <Body>{body}</Body>
    {footer && <Footer>{footer}</Footer>}
  </>
);

/**
 * The live watching card, fixed in the bottom-right corner: a suggestion, or the replay of a pattern.
 * Same anatomy as the tool panel (feature icon and uppercase title, body, muted footer with the actions).
 */
export const SuggestionCard: React.FC = () => {
  const { suggestion, run, close, stopRun, dismissForever } = useLiveWatch();
  const [hovered, setHovered] = useState<WatchEvent | null>(null);

  useEffect(() => setHovered(null), [suggestion, run?.index]);

  if (!suggestion && !run) return null;

  const current = run && run.phase !== RunPhase.DONE ? run.events[run.index] : null;
  const outlined = hovered || current;
  const title = run ? (run.guided ? "Step by step" : "Live watching") : "Live watching";
  const canDismiss = !run && suggestion && suggestion.kind !== SuggestionKind.CONTINUE_SCENARIO;

  return (
    <>
      {outlined && (
        <TargetHighlight xpath={outlined.xpath} alternativeXpaths={outlined.alternativeXpaths} scrollIntoView={!hovered} />
      )}
      <Card aria-label="Live watching suggestion">
        <Header>
          <FeatureTitle>
            <FeatureIcon icon={IconEye} size={18} />
            <FeatureTitleText>{title}</FeatureTitleText>
          </FeatureTitle>
          {canDismiss && (
            <IconButton
              label={suggestion.kind === SuggestionKind.FIELD ? "Don't suggest for this field" : "Don't suggest this again"}
              size={28}
              onClick={dismissForever}
            >
              <IconEyeOff />
            </IconButton>
          )}
          <IconButton label={run ? "Stop" : "Close suggestion"} size={28} onClick={run ? stopRun : close}>
            <IconX />
          </IconButton>
        </Header>
        {run && run.phase !== RunPhase.DONE && <Progress $value={run.index / run.steps.length} aria-hidden="true" />}
        {run ? <RunContent run={run} onHover={setHovered} /> : <SuggestionContent suggestion={suggestion!} onHover={setHovered} />}
      </Card>
    </>
  );
};
