import React, { useState } from "react";
import { Tooltip as ReactTooltip } from "antd";
import { ZINDEX_INSPECTOR_ELEMENT_TOOLTIP } from "@entrypoints/shared/constant/zIndex.ts";

export const Tooltip: React.FC<{
  title?: string;
  content?: string;
  clickTile?: string;
  placement?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}> = ({ title, content, clickTile, placement, children, onOpen, onClose }) => {
  // TROUBLESHOOTING: this condition is needed because adding a word triggers a render and the tooltip gets stuck,
  // since another icon opened it and that icon has moved or may disappear
  const [open, setOpen] = useState(false);
  const [tooltipTitle, setTooltipTitle] = useState(title || content);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);

    if (open) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const handleClickTooltip = () => {
    if (clickTile) {
      setTooltipTitle(clickTile);

      setTimeout(() => {
        setTooltipTitle(title);
        setOpen(false);
      }, 500);
    } else {
      setOpen(false);
    }
  };

  return (
    <ReactTooltip
      open={open}
      onOpenChange={handleOpenChange}
      title={tooltipTitle}
      placement={placement}
      zIndex={ZINDEX_INSPECTOR_ELEMENT_TOOLTIP}
      mouseLeaveDelay={0}
      styles={{
        root: {
          pointerEvents: "none",
        },
      }}
      // @ts-ignore
      getPopupContainer={() =>
        // @ts-ignore
        (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")
      }
    >
      <div onClick={handleClickTooltip}>{children}</div>
    </ReactTooltip>
  );
};
