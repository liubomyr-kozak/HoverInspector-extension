/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getSplitContentLines } from "@git-diff-view/core";
import { diffAsideWidthName, diffFontSizeName, removeAllSelection } from "../utils";
import { Fragment, memo, useMemo, useRef } from "react";
import * as React from "react";
// SEE https://github.com/facebook/react/pull/25231
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import { SplitSide } from "..";
import { useTextWidth } from "../hooks/useTextWidth";
import { DiffSplitContentLine } from "./DiffSplitContentLineWrap";
import { DiffSplitExtendLine } from "./DiffSplitExtendLineWrap";
import { DiffSplitHunkLine } from "./DiffSplitHunkLineWrap";
import { DiffSplitWidgetLine } from "./DiffSplitWidgetLineWrap";
import { useDiffViewContext } from "./DiffViewContext";
export const DiffSplitViewWrap = memo(({ diffFile }) => {
    const splitLineLength = Math.max(diffFile.splitLineLength, diffFile.fileLineLength);
    const { useDiffContext } = useDiffViewContext();
    const ref = useRef(null);
    const tempRef = useRef();
    const { fontSize, enableAddWidget, enableHighlight } = useDiffContext.useShallowStableSelector((s) => ({
        fontSize: s.fontSize,
        enableAddWidget: s.enableAddWidget,
        enableHighlight: s.enableHighlight,
    }));
    useSyncExternalStore(diffFile.subscribe, diffFile.getUpdateCount, diffFile.getUpdateCount);
    const font = useMemo(() => ({ fontSize: fontSize + "px", fontFamily: "Menlo, Consolas, monospace" }), [fontSize]);
    const _width = useTextWidth({
        text: splitLineLength.toString(),
        font,
    });
    const width = Math.max(40, _width + 25);
    const lines = getSplitContentLines(diffFile);
    const setStyle = (side) => {
        if (!ref.current)
            return;
        if (!side) {
            ref.current.textContent = "";
        }
        else {
            const id = `diff-root${diffFile.getId()}`;
            const targetSide = side === SplitSide.old ? SplitSide.new : SplitSide.old;
            ref.current.textContent = `#${id} [data-side="${SplitSide[targetSide]}"] {user-select: none} \n#${id} [data-state="extend"] {user-select: none} \n#${id} [data-state="hunk"] {user-select: none} \n#${id} [data-state="widget"] {user-select: none}`;
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
    return (React.createElement("div", { className: "split-diff-view split-diff-view-wrap w-full" },
        React.createElement("div", { className: "diff-table-wrapper w-full", style: {
                // @ts-ignore
                [diffAsideWidthName]: `${Math.round(width)}px`,
                fontFamily: "Menlo, Consolas, monospace",
                fontSize: `var(${diffFontSizeName})`,
            } },
            React.createElement("style", { "data-select-style": true, ref: ref }),
            React.createElement("table", { className: "diff-table w-full table-fixed border-collapse border-spacing-0" },
                React.createElement("colgroup", null,
                    React.createElement("col", { className: "diff-table-old-num-col", width: Math.round(width) }),
                    React.createElement("col", { className: "diff-table-old-content-col" }),
                    React.createElement("col", { className: "diff-table-new-num-col", width: Math.round(width) }),
                    React.createElement("col", { className: "diff-table-new-content-col" })),
                React.createElement("thead", { className: "hidden" },
                    React.createElement("tr", null,
                        React.createElement("th", { scope: "col" }, "old line number"),
                        React.createElement("th", { scope: "col" }, "old line content"),
                        React.createElement("th", { scope: "col" }, "new line number"),
                        React.createElement("th", { scope: "col" }, "new line content"))),
                React.createElement("tbody", { className: "diff-table-body leading-[1.6]", onMouseDownCapture: onMouseDown },
                    lines.map((line) => (React.createElement(Fragment, { key: line.index },
                        React.createElement(DiffSplitHunkLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile }),
                        React.createElement(DiffSplitContentLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile, enableAddWidget: enableAddWidget, enableHighlight: enableHighlight }),
                        React.createElement(DiffSplitWidgetLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile }),
                        React.createElement(DiffSplitExtendLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile })))),
                    React.createElement(DiffSplitHunkLine, { index: diffFile.splitLineLength, lineNumber: diffFile.splitLineLength, diffFile: diffFile }))))));
});
DiffSplitViewWrap.displayName = "DiffSplitViewWrap";
