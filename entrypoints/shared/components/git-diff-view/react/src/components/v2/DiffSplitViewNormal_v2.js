/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DiffFileLineType, getSplitLines } from "@git-diff-view/core";
import { removeAllSelection, syncScroll, diffFontSizeName, diffAsideWidthName, borderColorName, } from "../utils";
import { memo, useEffect, useRef } from "react";
import * as React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import { useTextWidth } from "../../hooks/useTextWidth";
import { SplitSide } from "../DiffView";
import { useDiffViewContext } from "../DiffViewContext";
import { DiffSplitViewLine } from "./DiffSplitViewLineNormal_v2";
export const DiffSplitViewTable = ({ side, diffFile, onMouseDown, }) => {
    const className = side === SplitSide.new ? "new-diff-table" : "old-diff-table";
    const lines = getSplitLines(diffFile);
    return (React.createElement("div", { className: className + " w-max min-w-full", "data-mode": SplitSide[side] },
        React.createElement("div", { className: "diff-table-body leading-[1.6]", onMouseDownCapture: onMouseDown }, lines.map((line) => (React.createElement(DiffSplitViewLine, { key: line.index + "-" + DiffFileLineType[line.type], side: side, line: line, diffFile: diffFile }))))));
};
export const DiffSplitViewNormal = memo(({ diffFile }) => {
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref = useRef();
    const tempRef = useRef();
    const splitLineLength = Math.max(diffFile.splitLineLength, diffFile.fileLineLength);
    const { useDiffContext } = useDiffViewContext();
    const fontSize = useDiffContext.useShallowStableSelector((s) => s.fontSize);
    useSyncExternalStore(diffFile.subscribe, diffFile.getUpdateCount, diffFile.getUpdateCount);
    useEffect(() => {
        const left = ref1.current;
        const right = ref2.current;
        if (!left || !right)
            return;
        return syncScroll(left, right);
    }, []);
    const font = React.useMemo(() => ({ fontSize: fontSize + "px", fontFamily: "Menlo, Consolas, monospace" }), [fontSize]);
    const _width = useTextWidth({
        text: splitLineLength.toString(),
        font,
    });
    const width = Math.max(40, _width + 25);
    const setStyle = (side) => {
        if (!ref.current)
            return;
        if (!side) {
            ref.current.textContent = "";
        }
        else {
            const id = `diff-root${diffFile.getId()}`;
            ref.current.textContent = `#${id} [data-state="extend"] {user-select: none} \n#${id} [data-state="hunk"] {user-select: none} \n#${id} [data-state="widget"] {user-select: none}`;
        }
    };
    const onMouseDown = (e) => {
        let ele = e.target;
        // need remove all the selection
        if (ele && ele instanceof HTMLElement && ele.nodeName === "BUTTON") {
            removeAllSelection();
            return;
        }
        while (ele && ele instanceof HTMLElement) {
            const state = ele.getAttribute("data-state");
            const side = ele.getAttribute("data-side");
            if (side) {
                if (tempRef.current !== SplitSide[side]) {
                    tempRef.current = SplitSide[side];
                    setStyle(SplitSide[side]);
                    removeAllSelection();
                }
            }
            if (state) {
                if (state === "extend" || state === "hunk" || state === "widget") {
                    if (tempRef.current !== undefined) {
                        tempRef.current = undefined;
                        setStyle(undefined);
                        removeAllSelection();
                    }
                    return;
                }
                else {
                    return;
                }
            }
            ele = ele.parentElement;
        }
    };
    return (React.createElement("div", { className: "split-diff-view split-diff-view-normal flex w-full basis-[50%]" },
        React.createElement("style", { "data-select-style": true, ref: ref }),
        React.createElement("style", null, `
.diff-tailwindcss-wrapper .diff-add-widget-wrapper.diff-add-widget-wrapper.diff-add-widget-wrapper {
  transform: translate(-50%, -50%) !important;
}
.diff-tailwindcss-wrapper .diff-add-widget-wrapper.diff-add-widget-wrapper.diff-add-widget-wrapper:hover {
  transform: translate(-50%, -50%) scale(1.1) !important;
}
        `),
        React.createElement("div", { className: "old-diff-table-wrapper diff-table-scroll-container w-full overflow-x-auto overflow-y-hidden", ref: ref1, style: {
                // @ts-ignore
                [diffAsideWidthName]: `${Math.round(width)}px`,
                overscrollBehaviorX: "none",
                fontFamily: "Menlo, Consolas, monospace",
                fontSize: `var(${diffFontSizeName})`,
            } },
            React.createElement(DiffSplitViewTable, { side: SplitSide.old, diffFile: diffFile, onMouseDown: onMouseDown })),
        React.createElement("div", { className: "diff-split-line w-[1.5px]", style: { backgroundColor: `var(${borderColorName})` } }),
        React.createElement("div", { className: "new-diff-table-wrapper diff-table-scroll-container w-full overflow-x-auto overflow-y-hidden", ref: ref2, style: {
                // @ts-ignore
                [diffAsideWidthName]: `${Math.round(width)}px`,
                overscrollBehaviorX: "none",
                fontFamily: "Menlo, Consolas, monospace",
                fontSize: `var(${diffFontSizeName})`,
            } },
            React.createElement(DiffSplitViewTable, { side: SplitSide.new, diffFile: diffFile, onMouseDown: onMouseDown }))));
});
DiffSplitViewNormal.displayName = "DiffSplitViewNormal";
