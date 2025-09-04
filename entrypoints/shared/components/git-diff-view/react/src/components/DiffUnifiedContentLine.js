import { checkDiffLineIncludeChange } from "@git-diff-view/core";
import { diffAsideWidthName, addContentBGName, addLineNumberBGName, delContentBGName, delLineNumberBGName, expandContentBGName, plainContentBGName, plainLineNumberBGName, plainLineNumberColorName, expandLineNumberColorName, } from "../utils";
import * as React from "react";
import { memo } from "react";
import { SplitSide } from "..";
import { DiffUnifiedAddWidget } from "./DiffAddWidget";
import { DiffContent } from "./DiffContent";
import { useDiffViewContext } from "./DiffViewContext";
import { useDiffWidgetContext } from "./DiffWidgetContext";
import { useLineClickContext } from "./LineClickContext";
const DiffUnifiedOldLine = ({ index, diffLine, rawLine, plainLine, syntaxLine, lineNumber, diffFile, setWidget, enableWrap, enableAddWidget, enableHighlight, onAddWidgetClick, }) => {
    const { onLineClick } = useLineClickContext();
    const handleLineClick = (event) => {
        if (onLineClick && lineNumber) {
            onLineClick(lineNumber, SplitSide.old, event);
        }
    };
    return (React.createElement("tr", { "data-line": index, "data-state": "diff", className: "diff-line group", onClick: handleLineClick, style: { cursor: onLineClick ? 'pointer' : 'default' } },
        React.createElement("td", { className: "diff-line-num sticky left-0 z-[1] w-[1%] min-w-[100px] select-none whitespace-nowrap pl-[10px] pr-[10px] text-right align-top", style: {
                color: `var(${plainLineNumberColorName})`,
                backgroundColor: `var(${delLineNumberBGName})`,
                width: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
                maxWidth: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
                minWidth: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
            } },
            enableAddWidget && (React.createElement(DiffUnifiedAddWidget, { index: index - 1, lineNumber: lineNumber, diffFile: diffFile, side: SplitSide.old, onWidgetClick: onAddWidgetClick, onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber, side }) })),
            React.createElement("div", { className: "flex" },
                React.createElement("span", { "data-line-old-num": lineNumber, className: "inline-block w-[50%]" }, lineNumber),
                React.createElement("span", { className: "w-[10px] shrink-0" }),
                React.createElement("span", { className: "inline-block w-[50%]" }))),
        React.createElement("td", { className: "diff-line-content pr-[10px] align-top", style: { backgroundColor: `var(${delContentBGName})` } },
            React.createElement(DiffContent, { enableWrap: enableWrap, diffFile: diffFile, enableHighlight: enableHighlight, rawLine: rawLine, diffLine: diffLine, plainLine: plainLine, syntaxLine: syntaxLine }))));
};
const DiffUnifiedNewLine = ({ index, diffLine, rawLine, plainLine, syntaxLine, lineNumber, diffFile, setWidget, enableWrap, enableAddWidget, enableHighlight, onAddWidgetClick, }) => {
    const { onLineClick } = useLineClickContext();
    const handleLineClick = (event) => {
        if (onLineClick && lineNumber) {
            onLineClick(lineNumber, SplitSide.new, event);
        }
    };
    return (React.createElement("tr", { "data-line": index, "data-state": "diff", className: "diff-line group", onClick: handleLineClick, style: { cursor: onLineClick ? 'pointer' : 'default' } },
        React.createElement("td", { className: "diff-line-num sticky left-0 z-[1] w-[1%] min-w-[100px] select-none whitespace-nowrap pl-[10px] pr-[10px] text-right align-top", style: {
                color: `var(${plainLineNumberColorName})`,
                backgroundColor: `var(${addLineNumberBGName})`,
                width: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
                maxWidth: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
                minWidth: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
            } },
            enableAddWidget && (React.createElement(DiffUnifiedAddWidget, { index: index - 1, lineNumber: lineNumber, diffFile: diffFile, side: SplitSide.new, onWidgetClick: onAddWidgetClick, onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber, side }) })),
            React.createElement("div", { className: "flex" },
                React.createElement("span", { className: "inline-block w-[50%]" }),
                React.createElement("span", { className: "w-[10px] shrink-0" }),
                React.createElement("span", { "data-line-new-num": lineNumber, className: "inline-block w-[50%]" }, lineNumber))),
        React.createElement("td", { className: "diff-line-content pr-[10px] align-top", style: { backgroundColor: `var(${addContentBGName})` } },
            React.createElement(DiffContent, { enableWrap: enableWrap, diffFile: diffFile, enableHighlight: enableHighlight, rawLine: rawLine, diffLine: diffLine, plainLine: plainLine, syntaxLine: syntaxLine }))));
};
const _DiffUnifiedLine = memo(({ index, diffFile, lineNumber, enableWrap, enableAddWidget, enableHighlight, }) => {
    const unifiedLine = diffFile.getUnifiedLine(index);
    const { useDiffContext } = useDiffViewContext();
    const onAddWidgetClick = useDiffContext.getReadonlyState().onAddWidgetClick;
    const { useWidget } = useDiffWidgetContext();
    const { onLineClick } = useLineClickContext();
    const setWidget = useWidget.getReadonlyState().setWidget;
    const hasDiff = unifiedLine.diff;
    const hasChange = checkDiffLineIncludeChange(unifiedLine.diff);
    const rawLine = unifiedLine.value || "";
    const diffLine = unifiedLine.diff;
    const newLineNumber = unifiedLine.newLineNumber;
    const oldLinenumber = unifiedLine.oldLineNumber;
    const syntaxLine = newLineNumber
        ? diffFile.getNewSyntaxLine(newLineNumber)
        : oldLinenumber
            ? diffFile.getOldSyntaxLine(oldLinenumber)
            : undefined;
    const plainLine = newLineNumber
        ? diffFile.getNewPlainLine(newLineNumber)
        : oldLinenumber
            ? diffFile.getOldPlainLine(oldLinenumber)
            : undefined;
    if (hasChange) {
        if (unifiedLine.oldLineNumber) {
            return (React.createElement(DiffUnifiedOldLine, { index: lineNumber, enableWrap: enableWrap, diffFile: diffFile, rawLine: rawLine, diffLine: diffLine, setWidget: setWidget, plainLine: plainLine, syntaxLine: syntaxLine, enableHighlight: enableHighlight, enableAddWidget: enableAddWidget, lineNumber: unifiedLine.oldLineNumber, onAddWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); } }));
        }
        else {
            return (React.createElement(DiffUnifiedNewLine, { index: lineNumber, enableWrap: enableWrap, rawLine: rawLine, diffLine: diffLine, diffFile: diffFile, setWidget: setWidget, plainLine: plainLine, syntaxLine: syntaxLine, enableHighlight: enableHighlight, enableAddWidget: enableAddWidget, lineNumber: unifiedLine.newLineNumber, onAddWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); } }));
        }
    }
    else {
        const handleLineClick = (event) => {
            if (onLineClick && (unifiedLine.newLineNumber || unifiedLine.oldLineNumber)) {
                // For unified view without changes, prefer new line number, fallback to old line number
                const lineNum = unifiedLine.newLineNumber || unifiedLine.oldLineNumber;
                const side = unifiedLine.newLineNumber ? SplitSide.new : SplitSide.old;
                onLineClick(lineNum, side, event);
            }
        };
        return (React.createElement("tr", { "data-line": lineNumber, "data-state": unifiedLine.diff ? "diff" : "plain", className: "diff-line group", onClick: handleLineClick, style: { cursor: onLineClick ? 'pointer' : 'default' } },
            React.createElement("td", { className: "diff-line-num sticky left-0 z-[1] w-[1%] min-w-[100px] select-none whitespace-nowrap pl-[10px] pr-[10px] text-right align-top", style: {
                    color: `var(${hasDiff ? plainLineNumberColorName : expandLineNumberColorName})`,
                    width: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
                    maxWidth: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
                    minWidth: `calc(calc(var(${diffAsideWidthName}) + 5px) * 2)`,
                    backgroundColor: hasDiff ? `var(${plainLineNumberBGName})` : `var(${expandContentBGName})`,
                } },
                enableAddWidget && hasDiff && (React.createElement(DiffUnifiedAddWidget, { index: index, diffFile: diffFile, lineNumber: unifiedLine.newLineNumber, side: SplitSide.new, onWidgetClick: (...props) => { var _a; return (_a = onAddWidgetClick.current) === null || _a === void 0 ? void 0 : _a.call(onAddWidgetClick, ...props); }, onOpenAddWidget: (lineNumber, side) => setWidget({ lineNumber, side }) })),
                React.createElement("div", { className: "flex opacity-[0.5]" },
                    React.createElement("span", { "data-line-old-num": unifiedLine.oldLineNumber, className: "inline-block w-[50%]" }, unifiedLine.oldLineNumber),
                    React.createElement("span", { className: "w-[10px] shrink-0" }),
                    React.createElement("span", { "data-line-new-num": unifiedLine.newLineNumber, className: "inline-block w-[50%]" }, unifiedLine.newLineNumber))),
            React.createElement("td", { className: "diff-line-content pr-[10px] align-top", style: {
                    backgroundColor: hasDiff ? `var(${plainContentBGName})` : `var(${expandContentBGName})`,
                } },
                React.createElement(DiffContent, { enableWrap: enableWrap, diffFile: diffFile, enableHighlight: enableHighlight, rawLine: rawLine, diffLine: diffLine, plainLine: plainLine, syntaxLine: syntaxLine }))));
    }
});
_DiffUnifiedLine.displayName = "_DiffUnifiedLine";
export const DiffUnifiedContentLine = ({ index, diffFile, lineNumber, enableWrap, enableHighlight, enableAddWidget, }) => {
    const unifiedLine = diffFile.getUnifiedLine(index);
    if (unifiedLine === null || unifiedLine === void 0 ? void 0 : unifiedLine.isHidden)
        return null;
    return (React.createElement(_DiffUnifiedLine, { index: index, diffFile: diffFile, lineNumber: lineNumber, enableWrap: enableWrap, enableHighlight: enableHighlight, enableAddWidget: enableAddWidget }));
};
