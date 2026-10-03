import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { IconArrowDown, IconArrowUp, IconChevronDown, IconTrash } from "@tabler/icons-react";
import { selectFunctions } from "@entrypoints/content/store/automation/automation.slice";
import { ScenarioStep } from "../../types";
import { getStepIcon } from "../../utils/stepIcons";
import { summarizeStep } from "./stepSummary";
import { SmallIconButton } from "./StepForm.styled";
import {
  Actions,
  Body,
  Card,
  Chevron,
  DetailLine,
  Header,
  Incomplete,
  StepNumber,
  Target,
  TitleLine,
  Toggle,
  Texts,
  TypeGlyph,
  ValueChip,
} from "./StepCard.styled";

interface StepCardProps {
  step: ScenarioStep;
  index: number;
  total: number;
  expanded: boolean;
  invalid: boolean;
  onToggle: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  /** The step form, rendered while the card is expanded */
  children: React.ReactNode;
}

/**
 * One step of the scenario being edited: a compact row (number, type, element, value) that expands into its form
 */
export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  total,
  expanded,
  invalid,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}) => {
  const functions = useSelector(selectFunctions);
  const functionTitle = useCallback((id: string) => functions[id]?.title, [functions]);
  const { label, target, value } = summarizeStep(step, functionTitle);
  const bodyId = `step-form-${index}`;

  return (
    <Card $expanded={expanded} $invalid={invalid} data-step-index={index}>
      <Header>
        <Toggle type="button" aria-expanded={expanded} aria-controls={bodyId} onClick={() => onToggle(index)}>
          <StepNumber $expanded={expanded} $invalid={invalid}>
            {index + 1}
          </StepNumber>
          <TypeGlyph aria-hidden>{getStepIcon(step.type || "", 16)}</TypeGlyph>
          <Texts>
            <TitleLine>{label}</TitleLine>
            {(target || value || invalid) && (
              <DetailLine>
                {invalid && <Incomplete>Incomplete</Incomplete>}
                {target && <Target>{target}</Target>}
                {value && <ValueChip title={value}>{value}</ValueChip>}
              </DetailLine>
            )}
          </Texts>
        </Toggle>
        <Actions>
          <SmallIconButton label="Move step up" size={24} disabled={index === 0} onClick={() => onMoveUp(index)}>
            <IconArrowUp />
          </SmallIconButton>
          <SmallIconButton label="Move step down" size={24} disabled={index === total - 1} onClick={() => onMoveDown(index)}>
            <IconArrowDown />
          </SmallIconButton>
          <SmallIconButton label="Delete step" size={24} onClick={() => onDelete(index)}>
            <IconTrash />
          </SmallIconButton>
        </Actions>
        <SmallIconButton
          label={expanded ? "Collapse step" : "Edit step"}
          size={24}
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => onToggle(index)}
        >
          <Chevron $expanded={expanded}>
            <IconChevronDown />
          </Chevron>
        </SmallIconButton>
      </Header>
      {expanded && <Body id={bodyId}>{children}</Body>}
    </Card>
  );
};
