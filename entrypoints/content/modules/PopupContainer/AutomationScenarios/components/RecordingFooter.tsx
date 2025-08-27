import React from "react";
import { Button } from "antd";
import { IconPlayerPause, IconPlayerPlay, IconDeviceFloppy } from "@tabler/icons-react";
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
  const handlePauseToggle = () => {
    console.log(`🎬 [RECORDING] ${isPaused ? 'Resuming' : 'Pausing'} recording session`);
    onPauseToggle();
  };

  const handleSave = () => {
    console.log('💾 [SAVE SCENARIO] Saving recording session as scenario');
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
          onClick={handlePauseToggle}
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
