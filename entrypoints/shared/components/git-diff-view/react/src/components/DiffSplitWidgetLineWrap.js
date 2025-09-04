import { borderColorName, emptyBGName } from "../utils";
import * as React from "react";
import { SplitSide } from "..";
import { useDiffViewContext } from "./DiffViewContext";
import { useDiffWidgetContext } from "./DiffWidgetContext";
const InternalDiffSplitWidgetLine = ({ index, diffFile, lineNumber, }) => {
    const { useWidget } = useDiffWidgetContext();
    const setWidget = useWidget.getReadonlyState().setWidget;
    const { useDiffContext } = useDiffViewContext();
    const renderWidgetLine = useDiffContext.useShallowStableSelector((s) => s.renderWidgetLine);
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const widgetSide = useWidget.useShallowStableSelector((s) => s.widgetSide);
    const widgetLineNumber = useWidget.getReadonlyState().widgetLineNumber;
    const oldLineWidget = oldLine.lineNumber && widgetSide === SplitSide.old && widgetLineNumber === oldLine.lineNumber;
    const newLineWidget = newLine.lineNumber && widgetSide === SplitSide.new && widgetLineNumber === newLine.lineNumber;
    const oldWidgetRendered = oldLineWidget &&
        (renderWidgetLine === null || renderWidgetLine === void 0 ? void 0 : renderWidgetLine({ diffFile, side: SplitSide.old, lineNumber: oldLine.lineNumber, onClose: () => setWidget({}) }));
    const newWidgetRendered = newLineWidget &&
        (renderWidgetLine === null || renderWidgetLine === void 0 ? void 0 : renderWidgetLine({ diffFile, side: SplitSide.new, lineNumber: newLine.lineNumber, onClose: () => setWidget({}) }));
    if (!renderWidgetLine)
        return null;
    return (React.createElement("tr", { "data-line": `${lineNumber}-widget`, "data-state": "widget", className: "diff-line diff-line-widget" },
        oldWidgetRendered ? (React.createElement("td", { className: "diff-line-widget-old-content p-0", colSpan: 2 },
            React.createElement("div", { className: "diff-line-widget-wrapper" }, oldWidgetRendered))) : (React.createElement("td", { className: "diff-line-widget-old-placeholder select-none p-0", style: { backgroundColor: `var(${emptyBGName})` }, colSpan: 2 })),
        newWidgetRendered ? (React.createElement("td", { className: "diff-line-widget-new-content border-l-[1px] p-0", colSpan: 2, style: { borderLeftColor: `var(${borderColorName})`, borderLeftStyle: "solid" } },
            React.createElement("div", { className: "diff-line-widget-wrapper" }, newWidgetRendered))) : (React.createElement("td", { className: "diff-line-widget-new-placeholder select-none border-l-[1px] p-0", style: {
                backgroundColor: `var(${emptyBGName})`,
                borderLeftColor: `var(${borderColorName})`,
                borderLeftStyle: "solid",
            }, colSpan: 2 }))));
};
// TODO! improve performance
export const DiffSplitWidgetLine = ({ index, diffFile, lineNumber, }) => {
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
    return React.createElement(InternalDiffSplitWidgetLine, { index: index, diffFile: diffFile, lineNumber: lineNumber });
};
