import React from "react";
import { Button, Form, Popover } from "antd";
import { IconPlayerPause, IconPlayerPlay, IconDeviceFloppy, IconBolt } from "@tabler/icons-react";
import { AutomationFooterContainer } from "../styles.ts";

interface RecordingFooterProps {
  isPaused: boolean;
  onPauseToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Component for displaying the recording footer with pause/resume and save buttons
 */
const RecordingFooter: React.FC<RecordingFooterProps> = ({ isPaused, onPauseToggle, onSave, onCancel }) => {
  const handleSave = () => {
    onSave();
  };

  return (
    <AutomationFooterContainer>
      <div className="flex items-center text-left">
        <span style={{ fontWeight: "bold", color: isPaused ? "#ff7875" : "#1890ff" }}>
          {isPaused ? "Session Paused" : "Recording in Progress"}
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onPauseToggle}
          icon={isPaused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
          type={isPaused ? "primary" : "default"}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button type="primary" onClick={handleSave} icon={<IconDeviceFloppy size={16} />}>
          Save
        </Button>
      </div>
    </AutomationFooterContainer>
  );
};

export default RecordingFooter;
