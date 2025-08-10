import React from "react";
import { Popover } from "antd";
import { IconBolt } from "@tabler/icons-react";

interface SpeedControlButtonProps {
  initialSpeed: number;
  onSpeedChange: (speed: number) => void;
}

/**
 * Component for controlling execution speed with a popover menu
 */
const SpeedControlButton: React.FC<SpeedControlButtonProps> = ({
  initialSpeed,
  onSpeedChange,
}) => {
  return (
    <Popover
      content={
        <div className="flex flex-col gap-2">
          <button
            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onSpeedChange(0.5);
            }}
          >
            <span>Slow</span>
          </button>
          <button
            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onSpeedChange(1);
            }}
          >
            <span>Medium (Reply Speed)</span>
          </button>
          <button
            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onSpeedChange(2.0);
            }}
          >
            <span>Fast (Bot Speed)</span>
          </button>
        </div>
      }
      getPopupContainer={() =>
        // @ts-ignore
        (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
      }
      trigger="click"
      placement="topRight"
      title="Running Speed"
    >
      <button 
        className="flex items-center ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" 
        title={`Running Speed: ${initialSpeed}x`}
      >
        <IconBolt size={14} color="#faad14" />
        <span className="ml-1">{initialSpeed}x</span>
      </button>
    </Popover>
  );
};

export default SpeedControlButton;