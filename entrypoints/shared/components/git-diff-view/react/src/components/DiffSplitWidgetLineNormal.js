import { emptyBGName } from "../utils";
import * as React from "react";
import { SplitSide } from "..";
import { useDomWidth } from "../hooks/useDomWidth";
import { useSyncHeight } from "../hooks/useSyncHeight";
import { useDiffViewContext } from "./DiffViewContext";
import { useDiffWidgetContext } from "./DiffWidgetContext";
const InternalDiffSplitWidgetLine = ({ index, side, diffFile, lineNumber, }) => {
    const { useWidget } = useDiffWidgetContext();
    const { useDiffContext } = useDiffViewContext();
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const widgetSide = useWidget.useShallowStableSelector((s) => s.widgetSide);
    const widgetLineNumber = useWidget.getReadonlyState().widgetLineNumber;
    const setWidget = useWidget.getReadonlyState().setWidget;
    const oldLineWidget = oldLine.lineNumber && widgetSide === SplitSide.old && widgetLineNumber === oldLine.lineNumber;
    const newLineWidget = newLine.lineNumber && widgetSide === SplitSide.new && widgetLineNumber === newLine.lineNumber;
    const currentLine = side === SplitSide.old ? oldLine : newLine;
    const otherSide = side === SplitSide.old ? SplitSide.new : SplitSide.old;
    const currentHasWidget = side === SplitSide.old ? oldLineWidget : newLineWidget;
    const hasWidget = oldLineWidget || newLineWidget;
    const renderWidgetLine = useDiffContext.useShallowStableSelector((s) => s.renderWidgetLine);
    const currentWidgetRendered = currentHasWidget &&
        (renderWidgetLine === null || renderWidgetLine === void 0 ? void 0 : renderWidgetLine({
            diffFile,
            side,
            lineNumber: currentLine.lineNumber,
            onClose: () => setWidget({}),
        }));
    useSyncHeight({
        selector: `div[data-line="${lineNumber}-widget-content"]`,
        wrapper: `tr[data-line="${lineNumber}-widget"]`,
        side: SplitSide[currentHasWidget ? side : otherSide],
        enable: hasWidget && typeof renderWidgetLine === "function",
    });
    const width = useDomWidth({
        selector: side === SplitSide.old ? ".old-diff-table-wrapper" : ".new-diff-table-wrapper",
        enable: !!currentHasWidget && typeof renderWidgetLine === "function",
    });
    if (!renderWidgetLine)
        return null;
    return (React.createElement("tr", { "data-line": `${lineNumber}-widget`, "data-state": "widget", "data-side": SplitSide[side], className: "diff-line diff-line-widget" }, currentHasWidget ? (React.createElement("td", { className: `diff-line-widget-${SplitSide[side]}-content p-0`, colSpan: 2 },
        React.createElement("div", { "data-line": `${lineNumber}-widget-content`, "data-side": SplitSide[side], className: "diff-line-widget-wrapper sticky left-0 z-[1]", style: { width } }, width > 0 && currentWidgetRendered))) : (React.createElement("td", { className: `diff-line-widget-${SplitSide[side]}-placeholder p-0`, style: { backgroundColor: `var(${emptyBGName})` }, colSpan: 2 },
        React.createElement("div", { "data-line": `${lineNumber}-widget-content`, "data-side": SplitSide[side] })))));
};
// TODO! improve performance
export const DiffSplitWidgetLine = ({ index, side, diffFile, lineNumber, }) => {
    const { useWidget } = useDiffWidgetContext();
    const currentIsShow = useWidget.useShallowSelector(React.useCallback((s) => {
        const widgetLineNumber = s.widgetLineNumber;
        const widgetSide = s.widgetSide;
        const oldLine = diffFile.getSplitLeftLine(index);
        const newLine = diffFile.getSplitRightLine(index);
        const oldLineWidget = oldLine.lineNumber && widgetSide === SplitSide.old && widgetLineNumber === oldLine.lineNumber;
        const newLineWidget = newLine.lineNumber && widgetSide === SplitSide.new && widgetLineNumber === newLine.lineNumber;
        const currentIsShow = oldLineWidget || newLineWidget;
        return currentIsShow;
    }, [diffFile, index]), (p, c) => p === c);
    if (!currentIsShow)
        return null;
    return React.createElement(InternalDiffSplitWidgetLine, { index: index, side: side, diffFile: diffFile, lineNumber: lineNumber });
};
