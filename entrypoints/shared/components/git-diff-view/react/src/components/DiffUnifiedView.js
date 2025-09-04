/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getUnifiedContentLine, SplitSide } from "@git-diff-view/core";
import { diffFontSizeName, removeAllSelection, diffAsideWidthName } from "../utils";
import * as React from "react";
import { Fragment, memo, useEffect, useMemo, useRef } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import { useTextWidth } from "../hooks/useTextWidth";
import { DiffUnifiedContentLine } from "./DiffUnifiedContentLine";
import { DiffUnifiedExtendLine } from "./DiffUnifiedExtendLine";
import { DiffUnifiedHunkLine } from "./DiffUnifiedHunkLine";
import { DiffUnifiedWidgetLine } from "./DiffUnifiedWidgetLine";
import { useDiffViewContext } from "./DiffViewContext";
import { DiffWidgetContext } from "./DiffWidgetContext";
import { createDiffWidgetStore } from "./tools";
export const DiffUnifiedView = memo(({ diffFile }) => {
    const { useDiffContext } = useDiffViewContext();
    const ref = useRef(null);
    const tempRef = useRef();
    const useDiffContextRef = useRef(useDiffContext);
    useDiffContextRef.current = useDiffContext;
    // performance optimization
    const useWidget = useMemo(() => createDiffWidgetStore(useDiffContextRef), []);
    const contextValue = useMemo(() => ({ useWidget }), [useWidget]);
    const { fontSize, enableWrap, enableHighlight, enableAddWidget, onCreateUseWidgetHook } = useDiffContext.useShallowStableSelector((s) => ({
        fontSize: s.fontSize,
        enableWrap: s.enableWrap,
        enableHighlight: s.enableHighlight,
        enableAddWidget: s.enableAddWidget,
        onCreateUseWidgetHook: s.onCreateUseWidgetHook,
    }));
    useSyncExternalStore(diffFile.subscribe, diffFile.getUpdateCount, diffFile.getUpdateCount);
    useEffect(() => {
        const { setWidget } = useWidget.getReadonlyState();
        setWidget({});
    }, [diffFile, useWidget]);
    useEffect(() => {
        onCreateUseWidgetHook === null || onCreateUseWidgetHook === void 0 ? void 0 : onCreateUseWidgetHook(useWidget);
    }, [useWidget, onCreateUseWidgetHook]);
    const unifiedLineLength = Math.max(diffFile.unifiedLineLength, diffFile.fileLineLength);
    const _width = useTextWidth({
        text: unifiedLineLength.toString(),
        font: useMemo(() => ({ fontSize: fontSize + "px", fontFamily: "Menlo, Consolas, monospace" }), [fontSize]),
    });
    const width = Math.max(40, _width + 10);
    const lines = getUnifiedContentLine(diffFile);
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
                    if (tempRef.current !== SplitSide.new) {
                        tempRef.current = SplitSide.new;
                        setStyle(SplitSide.new);
                        removeAllSelection();
                    }
                    return;
                }
            }
            ele = ele.parentElement;
        }
    };
    return (React.createElement(DiffWidgetContext.Provider, { value: contextValue },
        React.createElement("div", { className: `unified-diff-view ${enableWrap ? "unified-diff-view-wrap" : "unified-diff-view-normal"} w-full` },
            React.createElement("style", { "data-select-style": true, ref: ref }),
            React.createElement("div", { className: "unified-diff-table-wrapper diff-table-scroll-container w-full overflow-x-auto overflow-y-hidden", style: {
                    // @ts-ignore
                    [diffAsideWidthName]: `${Math.round(width)}px`,
                    fontFamily: "Menlo, Consolas, monospace",
                    fontSize: `var(${diffFontSizeName})`,
                } },
                React.createElement("table", { className: `unified-diff-table w-full border-collapse border-spacing-0 ${enableWrap ? "table-fixed" : ""}` },
                    React.createElement("colgroup", null,
                        React.createElement("col", { className: "unified-diff-table-num-col" }),
                        React.createElement("col", { className: "unified-diff-table-content-col" })),
                    React.createElement("thead", { className: "hidden" },
                        React.createElement("tr", null,
                            React.createElement("th", { scope: "col" }, "line number"),
                            React.createElement("th", { scope: "col" }, "line content"))),
                    React.createElement("tbody", { className: "diff-table-body leading-[1.6]", onMouseDownCapture: onMouseDown },
                        lines.map((item) => (React.createElement(Fragment, { key: item.index },
                            React.createElement(DiffUnifiedHunkLine, { index: item.index, lineNumber: item.lineNumber, diffFile: diffFile }),
                            React.createElement(DiffUnifiedContentLine, { index: item.index, lineNumber: item.lineNumber, diffFile: diffFile, enableWrap: enableWrap, enableHighlight: enableHighlight, enableAddWidget: enableAddWidget }),
                            React.createElement(DiffUnifiedWidgetLine, { index: item.index, lineNumber: item.lineNumber, diffFile: diffFile }),
                            React.createElement(DiffUnifiedExtendLine, { index: item.index, lineNumber: item.lineNumber, diffFile: diffFile })))),
                        React.createElement(DiffUnifiedHunkLine, { index: diffFile.unifiedLineLength, lineNumber: diffFile.unifiedLineLength, diffFile: diffFile })))))));
});
DiffUnifiedView.displayName = "DiffUnifiedView";
