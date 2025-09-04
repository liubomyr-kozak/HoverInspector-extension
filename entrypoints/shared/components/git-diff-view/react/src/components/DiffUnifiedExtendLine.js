import * as React from "react";
import { useCallback } from "react";
import { SplitSide } from "..";
import { useDomWidth } from "../hooks/useDomWidth";
import { useDiffViewContext } from "./DiffViewContext";
const InternalDiffUnifiedExtendLine = ({ index, diffFile, lineNumber, oldLineExtend, newLineExtend, }) => {
    const { useDiffContext } = useDiffViewContext();
    const renderExtendLine = useDiffContext.useShallowStableSelector((s) => s.renderExtendLine);
    const unifiedItem = diffFile.getUnifiedLine(index);
    const width = useDomWidth({
        selector: ".unified-diff-table-wrapper",
        enable: typeof renderExtendLine === "function",
    });
    if (!renderExtendLine)
        return null;
    return (React.createElement("tr", { "data-line": `${lineNumber}-extend`, "data-state": "extend", className: "diff-line diff-line-extend" },
        React.createElement("td", { className: "diff-line-extend-content p-0 align-top", colSpan: 2 },
            React.createElement("div", { className: "diff-line-extend-wrapper sticky left-0 z-[1]", style: { width } },
                width > 0 &&
                    (oldLineExtend === null || oldLineExtend === void 0 ? void 0 : oldLineExtend.data) !== undefined &&
                    (oldLineExtend === null || oldLineExtend === void 0 ? void 0 : oldLineExtend.data) !== null &&
                    (renderExtendLine === null || renderExtendLine === void 0 ? void 0 : renderExtendLine({
                        diffFile,
                        side: SplitSide.old,
                        lineNumber: unifiedItem.oldLineNumber,
                        data: oldLineExtend.data,
                        onUpdate: diffFile.notifyAll,
                    })),
                width > 0 &&
                    (newLineExtend === null || newLineExtend === void 0 ? void 0 : newLineExtend.data) !== undefined &&
                    (newLineExtend === null || newLineExtend === void 0 ? void 0 : newLineExtend.data) !== null &&
                    (renderExtendLine === null || renderExtendLine === void 0 ? void 0 : renderExtendLine({
                        diffFile,
                        side: SplitSide.new,
                        lineNumber: unifiedItem.newLineNumber,
                        data: newLineExtend.data,
                        onUpdate: diffFile.notifyAll,
                    }))))));
};
export const DiffUnifiedExtendLine = ({ index, diffFile, lineNumber, }) => {
    const { useDiffContext } = useDiffViewContext();
    const unifiedItem = diffFile.getUnifiedLine(index);
    const { oldLineExtend, newLineExtend } = useDiffContext(useCallback((s) => {
        var _a, _b, _c, _d;
        return ({
            oldLineExtend: (_b = (_a = s.extendData) === null || _a === void 0 ? void 0 : _a.oldFile) === null || _b === void 0 ? void 0 : _b[unifiedItem === null || unifiedItem === void 0 ? void 0 : unifiedItem.oldLineNumber],
            newLineExtend: (_d = (_c = s.extendData) === null || _c === void 0 ? void 0 : _c.newFile) === null || _d === void 0 ? void 0 : _d[unifiedItem === null || unifiedItem === void 0 ? void 0 : unifiedItem.newLineNumber],
        });
    }, [unifiedItem.oldLineNumber, unifiedItem.newLineNumber]));
    const hasExtend = (oldLineExtend === null || oldLineExtend === void 0 ? void 0 : oldLineExtend.data) || (newLineExtend === null || newLineExtend === void 0 ? void 0 : newLineExtend.data);
    if (!hasExtend || !unifiedItem || unifiedItem.isHidden)
        return null;
    return (React.createElement(InternalDiffUnifiedExtendLine, { index: index, diffFile: diffFile, lineNumber: lineNumber, oldLineExtend: oldLineExtend, newLineExtend: newLineExtend }));
};
