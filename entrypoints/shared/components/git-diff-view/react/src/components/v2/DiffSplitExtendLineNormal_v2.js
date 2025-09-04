import { emptyBGName } from "../utils";
import * as React from "react";
import { useDomWidth } from "../../hooks/useDomWidth";
import { useSyncHeight } from "../../hooks/useSyncHeight";
import { SplitSide } from "../DiffView";
import { useDiffViewContext } from "../DiffViewContext";
const InternalDiffSplitExtendLine = ({ index, diffFile, oldLineExtend, newLineExtend, side, lineNumber, }) => {
    const { useDiffContext } = useDiffViewContext();
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const renderExtendLine = useDiffContext.useShallowStableSelector((s) => s.renderExtendLine);
    const currentExtend = side === SplitSide.old ? oldLineExtend : newLineExtend;
    const otherSide = side === SplitSide.old ? SplitSide.new : SplitSide.old;
    const currentLineNumber = side === SplitSide.old ? oldLine.lineNumber : newLine.lineNumber;
    const currentSideHasExtend = (currentExtend === null || currentExtend === void 0 ? void 0 : currentExtend.data) !== undefined && (currentExtend === null || currentExtend === void 0 ? void 0 : currentExtend.data) !== null;
    const hasExtend = ((oldLineExtend === null || oldLineExtend === void 0 ? void 0 : oldLineExtend.data) !== undefined && (oldLineExtend === null || oldLineExtend === void 0 ? void 0 : oldLineExtend.data) !== null) ||
        ((newLineExtend === null || newLineExtend === void 0 ? void 0 : newLineExtend.data) !== undefined && (newLineExtend === null || newLineExtend === void 0 ? void 0 : newLineExtend.data) !== null);
    useSyncHeight({
        wrapper: `div[data-state="extend"][data-line="${lineNumber}-extend"]`,
        selector: `div[data-line="${lineNumber}-extend-content"]`,
        side: SplitSide[currentSideHasExtend ? side : otherSide],
        enable: hasExtend && typeof renderExtendLine === "function",
    });
    const width = useDomWidth({
        selector: side === SplitSide.old ? ".old-diff-table-wrapper" : ".new-diff-table-wrapper",
        enable: currentSideHasExtend && typeof renderExtendLine === "function",
    });
    if (!renderExtendLine)
        return null;
    return (React.createElement("div", { "data-line": `${lineNumber}-extend`, "data-state": "extend", "data-side": SplitSide[side], className: "diff-line diff-line-extend" }, currentSideHasExtend ? (React.createElement("div", { className: `diff-line-extend-${SplitSide[side]}-content p-0` },
        React.createElement("div", { "data-line": `${lineNumber}-extend-content`, "data-side": SplitSide[side], className: "diff-line-extend-wrapper sticky left-0 z-[1]", style: { width } }, width > 0 &&
            hasExtend &&
            (renderExtendLine === null || renderExtendLine === void 0 ? void 0 : renderExtendLine({
                diffFile,
                side,
                lineNumber: currentLineNumber,
                data: currentExtend === null || currentExtend === void 0 ? void 0 : currentExtend.data,
                onUpdate: diffFile.notifyAll,
            }))))) : (React.createElement("div", { className: `diff-line-extend-${SplitSide[side]}-placeholder h-full select-none p-0`, style: { backgroundColor: `var(${emptyBGName})` } },
        React.createElement("div", { "data-line": `${lineNumber}-extend-content`, "data-side": SplitSide[side] })))));
};
export const DiffSplitExtendLine = ({ index, diffFile, side, lineNumber, }) => {
    const { useDiffContext } = useDiffViewContext();
    const oldLine = diffFile.getSplitLeftLine(index);
    const newLine = diffFile.getSplitRightLine(index);
    const { oldLineExtend, newLineExtend } = useDiffContext(React.useCallback((s) => {
        var _a, _b, _c, _d;
        return ({
            oldLineExtend: (_b = (_a = s.extendData) === null || _a === void 0 ? void 0 : _a.oldFile) === null || _b === void 0 ? void 0 : _b[oldLine === null || oldLine === void 0 ? void 0 : oldLine.lineNumber],
            newLineExtend: (_d = (_c = s.extendData) === null || _c === void 0 ? void 0 : _c.newFile) === null || _d === void 0 ? void 0 : _d[newLine === null || newLine === void 0 ? void 0 : newLine.lineNumber],
        });
    }, [oldLine === null || oldLine === void 0 ? void 0 : oldLine.lineNumber, newLine === null || newLine === void 0 ? void 0 : newLine.lineNumber]));
    const hasExtend = (oldLineExtend === null || oldLineExtend === void 0 ? void 0 : oldLineExtend.data) || (newLineExtend === null || newLineExtend === void 0 ? void 0 : newLineExtend.data);
    // if the expand action not enabled, the `isHidden` property will never change
    const enableExpand = diffFile.getExpandEnabled();
    const currentLine = side === SplitSide.old ? oldLine : newLine;
    const currentIsShow = hasExtend && (!currentLine.isHidden || !enableExpand);
    if (!currentIsShow)
        return null;
    return (React.createElement(InternalDiffSplitExtendLine, { side: side, index: index, diffFile: diffFile, lineNumber: lineNumber, oldLineExtend: oldLineExtend, newLineExtend: newLineExtend }));
};
