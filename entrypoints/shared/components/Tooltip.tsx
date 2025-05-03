import React, {useState} from "react";
import {Tooltip as ReactTooltip} from "antd";
import {ZINDEX_INSPECTOR_ELEMENT_TOOLTIP} from "@entrypoints/shared/constant/zIndex.ts";

export const Tooltip: React.FC<{
    title: string; clickTile?: string; placement?: "top" | "bottom" | "left" | "right"; children: React.ReactNode; onOpen?: () => void; onClose?: () => void;
}> = ({title, clickTile, placement, children, onOpen, onClose}) => {
    // TROUBLESHOOTING прийщлося додати цю умову, томущо пілся того як додається слово.. відбувається рендер і тултіп завісає,
    // ізза того що він був відкритий іншою іконкою, а вона вже змістилась, або може зникнути
    const [open, setOpen] = useState(false);
    const [tooltipTitle, setTooltipTitle] = useState(title);

    const handleOpenChange = (open: boolean) => {
        setOpen(open);

        if (open) {
            onOpen?.()
        } else {
            onClose?.()
        }
    };

    const handleClickTooltip = () => {
        if (clickTile) {
            setTooltipTitle(clickTile);

            setTimeout(() => {
                setTooltipTitle(title);
                setOpen(false);
            }, 500)
        } else {
            setOpen(false);
        }
    }

    return (<ReactTooltip
        open={open}
        onOpenChange={handleOpenChange}
        title={tooltipTitle}
        placement={placement}
        zIndex={ZINDEX_INSPECTOR_ELEMENT_TOOLTIP}
        mouseLeaveDelay={0}
        styles={{
            root: {
                pointerEvents: "none"
            }
        }}
        // @ts-ignore
        getPopupContainer={() => (document.querySelector('hover-inspector')!.shadowRoot as HTMLElement)?.querySelector('html > body')}
    >
        <div onClick={handleClickTooltip}>{children}</div>
    </ReactTooltip>);
};
