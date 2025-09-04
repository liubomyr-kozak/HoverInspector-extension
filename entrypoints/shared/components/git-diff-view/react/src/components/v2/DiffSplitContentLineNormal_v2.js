import { DiffLineType, checkDiffLineIncludeChange } from "@git-diff-view/core";
import { getContentBG, getLineNumberBG, plainLineNumberColorName, emptyBGName, diffAsideWidthName, expandLineNumberColorName, } from "../utils";
import * as React from "react";
import { DiffSplitAddWidget } from "../DiffAddWidget";
import { DiffContent } from "../DiffContent";
import { SplitSide } from "../DiffView";
import { useDiffViewContext } from "../DiffViewContext";
import { useDiffWidgetContext } from "../DiffWidgetContext";
const InternalDiffSplitLine = ({ index, diffFile, lineNumber, side, }) => {
    var _a, _b;
    const getCurrentSyntaxLine = side === SplitSide.old ? diffFile.getOldSyntaxLine : diffFile.getNewSyntaxLine;
    const getCurrentPlainLine = side === SplitSide.old ? diffFile.getOldPlainLine : diffFile.getNewPlainLine;
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const currentLine = side === SplitSide.old ? oldLine : newLine;
    const hasDiff = !!(currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff);
    const hasContent = !!currentLine.lineNumber;
    const hasChange = checkDiffLineIncludeChange(currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff);
    const isAdded = ((_a = currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff) === null || _a === void 0 ? void 0 : _a.type) === DiffLineType.Add;
    const isDelete = ((_b = currentLine === null || currentLine === void 0 ? void 0 : currentLine.diff) === null || _b === void 0 ? void 0 : _b.type) === DiffLineType.Delete;
    const { useDiffContext } = useDiffViewContext();
    const { enableHighlight, enableAddWidget, onAddWidgetClick } = useDiffContext.useShallowStableSelector((s) => ({
        enableHighlight: s.enableHighlight,
        enableAddWidget: s.enableAddWidget,
        onAddWidgetClick: s.onAddWidgetClick,
    }));
    const { useWidget } = useDiffWidgetContext();
    const setWidget = useWidget.getReadonlyState().setWidget;
    const contentBG = getContentBG(isAdded, isDelete, hasDiff);
    const lineNumberBG = getLineNumberBG(isAdded, isDelete, hasDiff);
    const plainLine = getCurrentPlainLine(currentLine.lineNumber);
    const syntaxLine = getCurrentSyntaxLine(currentLine.lineNumber);
    return (React.createElement("div", { "data-line": lineNumber, "data-state": hasDiff || !hasContent ? "diff" : "plain", "data-side": SplitSide[side], className: "diff-line flex" + (hasContent ? " group" : "") }, hasContent ? (React.createElement(React.Fragment, null,
        React.createElement("div", { className: `diff-line-${SplitSide[side]}-num sticky left-0 z-[1] flex w-[1%] min-w-[40px] select-none items-center px-[10px] text-right`, style: {
                backgroundColor: lineNumberBG,
                color: `var(${hasDiff ? plainLineNumberColorName : expandLineNumberColorName})`,
                width: `var(${diffAsideWidthName})`,
                minWidth: `var(${diffAsideWidthName})`,
                maxWidth: `var(${diffAsideWidthName})`,
            } },
            hasDiff && enableAddWidget && (React.createElement(DiffSplitAddWidget, { index: index, lineNumber: currentLine.lineNumber, side: side, diffFile: diffFile, onWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); }, className: "absolute left-[100%] top-[50%] z-[1] translate-x-[-50%] translate-y-[-50%]", onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber: lineNumber, side: side }) })),
            React.createElement("span", { className: "w-full", "data-line-num": currentLine.lineNumber, style: { opacity: hasChange ? undefined : 0.5 } }, currentLine.lineNumber)),
        React.createElement("div", { className: `diff-line-${SplitSide[side]}-content flex w-full items-center pr-[10px]`, style: { backgroundColor: contentBG } },
            React.createElement(DiffContent, { enableWrap: false, diffFile: diffFile, rawLine: currentLine.value, diffLine: currentLine.diff, plainLine: plainLine, syntaxLine: syntaxLine, enableHighlight: enableHighlight })))) : (React.createElement("div", { className: `diff-line-${SplitSide[side]}-placeholder w-full select-none`, style: { backgroundColor: `var(${emptyBGName})` } }, "\u2002"))));
};
export const DiffSplitContentLine = ({ index, diffFile, lineNumber, side, }) => {
    const getCurrentLine = side === SplitSide.old ? diffFile.getSplitLeftLine : diffFile.getSplitRightLine;
    const currentLine = getCurrentLine(index);
    if (currentLine === null || currentLine === void 0 ? void 0 : currentLine.isHidden)
        return null;
    return React.createElement(InternalDiffSplitLine, { index: index, diffFile: diffFile, lineNumber: lineNumber, side: side });
};
