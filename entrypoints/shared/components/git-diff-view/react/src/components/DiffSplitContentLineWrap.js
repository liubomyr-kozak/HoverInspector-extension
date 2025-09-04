import { DiffLineType, checkDiffLineIncludeChange } from "@git-diff-view/core";
import { getContentBG, getLineNumberBG, plainLineNumberColorName, emptyBGName, borderColorName, expandLineNumberColorName, } from "../utils";
import * as React from "react";
import { SplitSide } from "..";
import { DiffSplitAddWidget } from "./DiffAddWidget";
import { DiffContent } from "./DiffContent";
import { useDiffViewContext } from "./DiffViewContext";
import { useDiffWidgetContext } from "./DiffWidgetContext";
const InternalDiffSplitLine = ({ index, diffFile, lineNumber, enableAddWidget, enableHighlight, }) => {
    var _a, _b;
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const oldSyntaxLine = diffFile.getOldSyntaxLine(oldLine === null || oldLine === void 0 ? void 0 : oldLine.lineNumber);
    const oldPlainLine = diffFile.getOldPlainLine(oldLine.lineNumber);
    const newSyntaxLine = diffFile.getNewSyntaxLine(newLine === null || newLine === void 0 ? void 0 : newLine.lineNumber);
    const newPlainLine = diffFile.getNewPlainLine(newLine.lineNumber);
    const hasDiff = !!(oldLine === null || oldLine === void 0 ? void 0 : oldLine.diff) || !!(newLine === null || newLine === void 0 ? void 0 : newLine.diff);
    const hasChange = checkDiffLineIncludeChange(oldLine === null || oldLine === void 0 ? void 0 : oldLine.diff) || checkDiffLineIncludeChange(newLine === null || newLine === void 0 ? void 0 : newLine.diff);
    const oldLineIsDelete = ((_a = oldLine === null || oldLine === void 0 ? void 0 : oldLine.diff) === null || _a === void 0 ? void 0 : _a.type) === DiffLineType.Delete;
    const newLineIsAdded = ((_b = newLine === null || newLine === void 0 ? void 0 : newLine.diff) === null || _b === void 0 ? void 0 : _b.type) === DiffLineType.Add;
    const { useDiffContext } = useDiffViewContext();
    const onAddWidgetClick = useDiffContext.getReadonlyState().onAddWidgetClick;
    const { useWidget } = useDiffWidgetContext();
    const setWidget = useWidget.getReadonlyState().setWidget;
    const hasOldLine = !!oldLine.lineNumber;
    const hasNewLine = !!newLine.lineNumber;
    const oldLineContentBG = getContentBG(false, oldLineIsDelete, hasDiff);
    const oldLineNumberBG = getLineNumberBG(false, oldLineIsDelete, hasDiff);
    const newLineContentBG = getContentBG(newLineIsAdded, false, hasDiff);
    const newLineNumberBG = getLineNumberBG(newLineIsAdded, false, hasDiff);
    return (React.createElement("tr", { "data-line": lineNumber, "data-state": hasDiff ? "diff" : "plain", className: "diff-line" },
        hasOldLine ? (React.createElement(React.Fragment, null,
            React.createElement("td", { className: "diff-line-old-num group relative w-[1%] min-w-[40px] select-none pl-[10px] pr-[10px] text-right align-top", "data-side": SplitSide[SplitSide.old], style: {
                    backgroundColor: oldLineNumberBG,
                    color: `var(${hasDiff ? plainLineNumberColorName : expandLineNumberColorName})`,
                } },
                hasDiff && enableAddWidget && (React.createElement(DiffSplitAddWidget, { index: index, lineNumber: oldLine.lineNumber, side: SplitSide.old, diffFile: diffFile, onWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); }, className: "absolute left-[100%] z-[1] translate-x-[-50%]", onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber: lineNumber, side: side }) })),
                React.createElement("span", { "data-line-num": oldLine.lineNumber, style: { opacity: hasChange ? undefined : 0.5 } }, oldLine.lineNumber)),
            React.createElement("td", { className: "diff-line-old-content group relative pr-[10px] align-top", "data-side": SplitSide[SplitSide.old], style: { backgroundColor: oldLineContentBG } },
                hasDiff && enableAddWidget && (React.createElement(DiffSplitAddWidget, { index: index, lineNumber: oldLine.lineNumber, side: SplitSide.old, diffFile: diffFile, onWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); }, className: "absolute right-[100%] z-[1] translate-x-[50%]", onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber: lineNumber, side: side }) })),
                React.createElement(DiffContent, { enableWrap: true, diffFile: diffFile, rawLine: oldLine.value, diffLine: oldLine.diff, plainLine: oldPlainLine, syntaxLine: oldSyntaxLine, enableHighlight: enableHighlight })))) : (React.createElement("td", { className: "diff-line-old-placeholder select-none", "data-side": SplitSide[SplitSide.old], style: { backgroundColor: `var(${emptyBGName})` }, colSpan: 2 },
            React.createElement("span", null, "\u2002"))),
        hasNewLine ? (React.createElement(React.Fragment, null,
            React.createElement("td", { className: "diff-line-new-num group relative w-[1%] min-w-[40px] select-none border-l-[1px] pl-[10px] pr-[10px] text-right align-top", "data-side": SplitSide[SplitSide.new], style: {
                    backgroundColor: newLineNumberBG,
                    color: `var(${hasDiff ? plainLineNumberColorName : expandLineNumberColorName})`,
                    borderLeftColor: `var(${borderColorName})`,
                    borderLeftStyle: "solid",
                } },
                hasDiff && enableAddWidget && (React.createElement(DiffSplitAddWidget, { index: index, lineNumber: newLine.lineNumber, side: SplitSide.new, diffFile: diffFile, onWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); }, className: "absolute left-[100%] z-[1] translate-x-[-50%]", onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber: lineNumber, side: side }) })),
                React.createElement("span", { "data-line-num": newLine.lineNumber, style: { opacity: hasChange ? undefined : 0.5 } }, newLine.lineNumber)),
            React.createElement("td", { className: "diff-line-new-content group relative pr-[10px] align-top", "data-side": SplitSide[SplitSide.new], style: { backgroundColor: newLineContentBG } },
                hasDiff && enableAddWidget && (React.createElement(DiffSplitAddWidget, { index: index, lineNumber: newLine.lineNumber, side: SplitSide.new, diffFile: diffFile, onWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); }, className: "absolute right-[100%] z-[1] translate-x-[50%]", onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber: lineNumber, side: side }) })),
                React.createElement(DiffContent, { enableWrap: true, diffFile: diffFile, rawLine: newLine.value || "", diffLine: newLine.diff, plainLine: newPlainLine, syntaxLine: newSyntaxLine, enableHighlight: enableHighlight })))) : (React.createElement("td", { className: "diff-line-new-placeholder select-none border-l-[1px]", style: {
                backgroundColor: `var(${emptyBGName})`,
                borderLeftColor: `var(${borderColorName})`,
                borderLeftStyle: "solid",
            }, "data-side": SplitSide[SplitSide.new], colSpan: 2 },
            React.createElement("span", null, "\u2002")))));
};
export const DiffSplitContentLine = ({ index, diffFile, lineNumber, enableAddWidget, enableHighlight, }) => {
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    if ((oldLine === null || oldLine === void 0 ? void 0 : oldLine.isHidden) && (newLine === null || newLine === void 0 ? void 0 : newLine.isHidden))
        return null;
    return (React.createElement(InternalDiffSplitLine, { index: index, diffFile: diffFile, lineNumber: lineNumber, enableAddWidget: enableAddWidget, enableHighlight: enableHighlight }));
};
