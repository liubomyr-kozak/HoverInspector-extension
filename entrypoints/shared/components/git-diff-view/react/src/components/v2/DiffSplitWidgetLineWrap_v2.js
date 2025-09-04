import { borderColorName, emptyBGName } from "../utils";
import * as React from "react";
import { SplitSide } from "../DiffView";
import { useDiffViewContext } from "../DiffViewContext";
import { useDiffWidgetContext } from "../DiffWidgetContext";
const InternalDiffSplitWidgetLine = ({ index, diffFile, lineNumber, oldLineWidget, newLineWidget, }) => {
    const { useWidget } = useDiffWidgetContext();
    const setWidget = useWidget.getReadonlyState().setWidget;
    const { useDiffContext } = useDiffViewContext();
    const renderWidgetLine = useDiffContext.useShallowStableSelector((s) => s.renderWidgetLine);
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    if (!renderWidgetLine)
        return null;
    const oldWidgetRendered = oldLineWidget &&
        (renderWidgetLine === null || renderWidgetLine === void 0 ? void 0 : renderWidgetLine({
            diffFile,
            side: SplitSide.old,
            lineNumber: oldLine.lineNumber,
            onClose: () => setWidget({}),
        }));
    const newWidgetRendered = newLineWidget &&
        (renderWidgetLine === null || renderWidgetLine === void 0 ? void 0 : renderWidgetLine({
            diffFile,
            side: SplitSide.new,
            lineNumber: newLine.lineNumber,
            onClose: () => setWidget({}),
        }));
    return (React.createElement("div", { "data-line": `${lineNumber}-widget`, "data-state": "widget", className: "diff-line diff-line-widget flex" },
        oldWidgetRendered ? (React.createElement("div", { className: "diff-line-widget-old-content w-[50%] p-0" },
            React.createElement("div", { className: "diff-line-widget-wrapper" }, oldWidgetRendered))) : (React.createElement("div", { className: "diff-line-widget-old-placeholder w-[50%] select-none p-0", style: { backgroundColor: `var(${emptyBGName})` } })),
        React.createElement("div", { className: "diff-split-line w-[1px] flex-shrink-0", style: { backgroundColor: `var(${borderColorName})` } }),
        newWidgetRendered ? (React.createElement("div", { className: "diff-line-widget-new-content w-[50%] p-0" },
            React.createElement("div", { className: "diff-line-widget-wrapper" }, newWidgetRendered))) : (React.createElement("div", { className: "diff-line-widget-new-placeholder w-[50%] select-none p-0", style: { backgroundColor: `var(${emptyBGName})` } }))));
};
export const DiffSplitWidgetLine = ({ index, diffFile, lineNumber, }) => {
    const { useWidget } = useDiffWidgetContext();
    const { widgetLineNumber, widgetSide } = useWidget.useShallowStableSelector((s) => ({
        widgetLineNumber: s.widgetLineNumber,
        widgetSide: s.widgetSide,
    }));
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const oldLineWidget = oldLine.lineNumber && widgetSide === SplitSide.old && widgetLineNumber === oldLine.lineNumber;
    const newLineWidget = newLine.lineNumber && widgetSide === SplitSide.new && widgetLineNumber === newLine.lineNumber;
    const currentIsShow = oldLineWidget || newLineWidget;
    if (!currentIsShow)
        return null;
    return (React.createElement(InternalDiffSplitWidgetLine, { index: index, diffFile: diffFile, lineNumber: lineNumber, oldLineWidget: oldLineWidget, newLineWidget: newLineWidget }));
};
