/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getSplitContentLines } from "@git-diff-view/core";
import { removeAllSelection, syncScroll, diffFontSizeName, borderColorName, diffAsideWidthName } from "../utils";
import { Fragment, memo, useEffect, useRef } from "react";
import * as React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import { useTextWidth } from "../hooks/useTextWidth";
import { DiffSplitContentLine } from "./DiffSplitContentLineNormal";
import { DiffSplitExtendLine } from "./DiffSplitExtendLineNormal";
import { DiffSplitHunkLine } from "./DiffSplitHunkLineNormal";
import { DiffSplitWidgetLine } from "./DiffSplitWidgetLineNormal";
import { SplitSide } from "./DiffView";
import { useDiffViewContext } from "./DiffViewContext";
const DiffSplitViewTable = ({ side, diffFile, enableAddWidget, enableHighlight, onMouseDown, }) => {
    const className = side === SplitSide.new ? "new-diff-table" : "old-diff-table";
    const lines = getSplitContentLines(diffFile);
    return (React.createElement("table", { className: className + " w-full border-collapse border-spacing-0", "data-mode": SplitSide[side] },
        React.createElement("colgroup", null,
            React.createElement("col", { className: `diff-table-${SplitSide[side]}-num-col` }),
            React.createElement("col", { className: `diff-table-${SplitSide[side]}-content-col` })),
        React.createElement("thead", { className: "hidden" },
            React.createElement("tr", null,
                React.createElement("th", { scope: "col" },
                    SplitSide[side],
                    " line number"),
                React.createElement("th", { scope: "col" },
                    SplitSide[side],
                    " line content"))),
        React.createElement("tbody", { className: "diff-table-body leading-[1.6]", onMouseDownCapture: onMouseDown },
            lines.map((line) => (React.createElement(Fragment, { key: line.index },
                React.createElement(DiffSplitHunkLine, { index: line.index, side: side, lineNumber: line.lineNumber, diffFile: diffFile }),
                React.createElement(DiffSplitContentLine, { index: line.index, side: side, lineNumber: line.lineNumber, diffFile: diffFile, enableAddWidget: enableAddWidget, enableHighlight: enableHighlight }),
                React.createElement(DiffSplitWidgetLine, { index: line.index, side: side, lineNumber: line.lineNumber, diffFile: diffFile }),
                React.createElement(DiffSplitExtendLine, { index: line.index, side: side, lineNumber: line.lineNumber, diffFile: diffFile })))),
            React.createElement(DiffSplitHunkLine, { side: side, index: diffFile.splitLineLength, lineNumber: diffFile.splitLineLength, diffFile: diffFile }))));
};
export const DiffSplitViewNormal = memo(({ diffFile }) => {
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref = useRef();
    const tempRef = useRef();
    const splitLineLength = Math.max(diffFile.splitLineLength, diffFile.fileLineLength);
    const { useDiffContext } = useDiffViewContext();
    const { fontSize, enableAddWidget, enableHighlight } = useDiffContext.useShallowStableSelector((s) => ({
        fontSize: s.fontSize,
        enableAddWidget: s.enableAddWidget,
        enableHighlight: s.enableHighlight,
    }));
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
        React.createElement("div", { className: "old-diff-table-wrapper diff-table-scroll-container w-full overflow-x-auto overflow-y-hidden", ref: ref1, style: {
                // @ts-ignore
                [diffAsideWidthName]: `${Math.round(width)}px`,
                overscrollBehaviorX: "none",
                fontFamily: "Menlo, Consolas, monospace",
                fontSize: `var(${diffFontSizeName})`,
            } },
            React.createElement(DiffSplitViewTable, { side: SplitSide.old, diffFile: diffFile, enableAddWidget: enableAddWidget, enableHighlight: enableHighlight, onMouseDown: onMouseDown })),
        React.createElement("div", { className: "diff-split-line w-[1.5px]", style: { backgroundColor: `var(${borderColorName})` } }),
        React.createElement("div", { className: "new-diff-table-wrapper diff-table-scroll-container w-full overflow-x-auto overflow-y-hidden", ref: ref2, style: {
                // @ts-ignore
                [diffAsideWidthName]: `${Math.round(width)}px`,
                overscrollBehaviorX: "none",
                fontFamily: "Menlo, Consolas, monospace",
                fontSize: `var(${diffFontSizeName})`,
            } },
            React.createElement(DiffSplitViewTable, { side: SplitSide.new, diffFile: diffFile, enableAddWidget: enableAddWidget, enableHighlight: enableHighlight, onMouseDown: onMouseDown }))));
});
DiffSplitViewNormal.displayName = "DiffSplitViewNormal";
