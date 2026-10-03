import React from "react";
import { Button } from "antd";
import styled, { css, keyframes } from "styled-components";
import { IconPlayerPause, IconPlayerPlay, IconDeviceFloppy } from "@tabler/icons-react";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { AutomationFooterContainer } from "../styles.ts";

interface RecordingFooterProps {
  isRecording?: boolean;
  isPaused: boolean;
  onPauseToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

type Mode = "recording" | "paused" | "editing";

const blink = keyframes`
  50% { opacity: 0.35; }
`;

const Footer = styled(AutomationFooterContainer)`
  flex-wrap: wrap;
  gap: 8px;
  box-shadow: none;
  border-top: 1px solid ${tokens.color.border};
  background: ${tokens.color.surfaceMuted};
`;

const Status = styled.span<{ $mode: Mode }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: auto;
  padding: 2px 10px 2px 8px;
  border-radius: 999px;
  font-size: ${tokens.font.size.xs}px;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ $mode }) => ($mode === "recording" ? tokens.color.dangerBg : $mode === "paused" ? tokens.color.warningBg : tokens.color.primaryBg)};
  color: ${({ $mode }) => ($mode === "recording" ? tokens.color.danger : $mode === "paused" ? tokens.color.warning : tokens.color.primary)};

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: currentColor;
    ${({ $mode }) =>
      $mode === "recording" &&
      css`
        animation: ${blink} 1.2s ease-in-out infinite;
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

const Buttons = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const LABELS: Record<Mode, string> = { recording: "Recording", paused: "Paused", editing: "Editing" };

/**
 * Footer of the scenario form: whether the page is being recorded, and pause / cancel / save
 */
const RecordingFooter: React.FC<RecordingFooterProps> = ({ isRecording = true, isPaused, onPauseToggle, onSave, onCancel }) => {
  const mode: Mode = !isRecording ? "editing" : isPaused ? "paused" : "recording";

  return (
    <Footer>
      <Status $mode={mode} role="status">
        {LABELS[mode]}
      </Status>
      <Buttons>
        <Button onClick={onCancel}>Cancel</Button>
        {isRecording && (
          <Button
            onClick={onPauseToggle}
            icon={isPaused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
            type={isPaused ? "primary" : "default"}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
        )}
        <Button type="primary" onClick={onSave} icon={<IconDeviceFloppy size={16} />}>
          Save
        </Button>
      </Buttons>
    </Footer>
  );
};

export default RecordingFooter;
