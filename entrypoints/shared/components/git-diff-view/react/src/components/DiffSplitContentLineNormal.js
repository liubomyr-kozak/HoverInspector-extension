import { DiffLineType, checkDiffLineIncludeChange } from "@git-diff-view/core";
import { getContentBG, getLineNumberBG, plainLineNumberColorName, diffAsideWidthName, emptyBGName, expandLineNumberColorName, } from "../utils";
import * as React from "react";
import { SplitSide } from "..";
import { DiffSplitAddWidget } from "./DiffAddWidget";
import { DiffContent } from "./DiffContent";
import { useDiffViewContext } from "./DiffViewContext";
import { useDiffWidgetContext } from "./DiffWidgetContext";
import { useLineClickContext } from "./LineClickContext";
const InternalDiffSplitLine = ({ index, diffFile, lineNumber, side, enableAddWidget, enableHighlight, }) => {
    var _a, _b;
    const getCurrentSyntaxLine = side === SplitSide.old ? diffFile.getOldSyntaxLine : diffFile.getNewSyntaxLine;
    const getCurrentPlainLine = side === SplitSide.old ? diffFile.getOldPlainLine : diffFile.getNewPlainLine;
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const currentLine = side === SplitSide.old ? oldLine : newLine;
    const hasDiff = !!(currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff);
    const hasContent = !!(currentLine === null || currentLine === void 0 ? void 0 : currentLine.lineNumber);
    const hasChange = checkDiffLineIncludeChange(currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff);
    const isAdded = ((_a = currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff) === null || _a === void 0 ? void 0 : _a.type) === DiffLineType.Add;
    const isDelete = ((_b = currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff) === null || _b === void 0 ? void 0 : _b.type) === DiffLineType.Delete;
    const { useDiffContext } = useDiffViewContext();
    const onAddWidgetClick = useDiffContext.getReadonlyState().onAddWidgetClick;
    const { useWidget } = useDiffWidgetContext();
    const { onLineClick } = useLineClickContext();
    const setWidget = useWidget.getReadonlyState().setWidget;
    const contentBG = getContentBG(isAdded, isDelete, hasDiff);
    const lineNumberBG = getLineNumberBG(isAdded, isDelete, hasDiff);
    const syntaxLine = getCurrentSyntaxLine(currentLine.lineNumber);
    const plainLine = getCurrentPlainLine(currentLine.lineNumber);
    const handleLineClick = (event) => {
        if (hasContent && onLineClick && (currentLine === null || currentLine === void 0 ? void 0 : currentLine.lineNumber)) {
            onLineClick(currentLine.lineNumber, side, event);
        }
    };
    return (React.createElement("tr", { "data-line": lineNumber, "data-state": hasDiff || !hasContent ? "diff" : "plain", "data-side": SplitSide[side], className: "diff-line" + (hasContent ? " group" : ""), onClick: handleLineClick, style: { cursor: hasContent && onLineClick ? "pointer" : "default" } }, hasContent ? (React.createElement(React.Fragment, null,
        React.createElement("td", { className: `diff-line-${SplitSide[side]}-num sticky left-0 z-[1] w-[1%] min-w-[40px] select-none pl-[10px] pr-[10px] text-right align-top`, style: {
                backgroundColor: lineNumberBG,
                color: `var(${hasDiff ? plainLineNumberColorName : expandLineNumberColorName})`,
                width: `var(${diffAsideWidthName})`,
                minWidth: `var(${diffAsideWidthName})`,
                maxWidth: `var(${diffAsideWidthName})`,
            } },
            hasDiff && enableAddWidget && (React.createElement(DiffSplitAddWidget, { index: index, lineNumber: currentLine.lineNumber, side: side, diffFile: diffFile, onWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); }, className: "absolute left-[100%] z-[1] translate-x-[-50%]", onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber: lineNumber, side: side }) })),
            React.createElement("span", { "data-line-num": currentLine.lineNumber, style: { opacity: hasChange ? undefined : 0.5 } }, currentLine.lineNumber)),
        React.createElement("td", { className: `diff-line-${SplitSide[side]}-content pr-[10px] align-top`, style: { backgroundColor: contentBG } },
            React.createElement(DiffContent, { enableWrap: false, diffFile: diffFile, rawLine: (currentLine === null || currentLine === void 0 ? void 0 : currentLine.value) || "", diffLine: currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff, plainLine: plainLine, syntaxLine: syntaxLine, enableHighlight: enableHighlight })))) : (React.createElement("td", { className: `diff-line-${SplitSide[side]}-placeholder select-none`, style: { backgroundColor: `var(${emptyBGName})` }, colSpan: 2 },
        React.createElement("span", null, "\u2002")))));
};
export const DiffSplitContentLine = ({ index, diffFile, lineNumber, side, enableAddWidget, enableHighlight, }) => {
    const getCurrentLine = side === SplitSide.old ? diffFile.getSplitLeftLine : diffFile.getSplitRightLine;
    const currentLine = getCurrentLine(index);
    if (currentLine === null || currentLine === void 0 ? void 0 : currentLine.isHidden)
        return null;
    return (React.createElement(InternalDiffSplitLine, { index: index, diffFile: diffFile, lineNumber: lineNumber, side: side, enableAddWidget: enableAddWidget, enableHighlight: enableHighlight }));
};
