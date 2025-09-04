import { composeLen } from "@git-diff-view/core";
import { hunkLineNumberBGName, plainLineNumberColorName, diffAsideWidthName, hunkContentBGName, hunkContentColorName, } from "../utils";
import * as React from "react";
import { DiffModeEnum, SplitSide } from "..";
import { useSyncHeight } from "../hooks/useSyncHeight";
import { ExpandAll, ExpandDown, ExpandUp } from "./DiffExpand";
import { useDiffViewContext } from "./DiffViewContext";
const InternalDiffSplitHunkLineGitHub = ({ index, diffFile, side, lineNumber, }) => {
    var _a;
    const currentHunk = diffFile.getSplitHunkLine(index);
    const expandEnabled = diffFile.getExpandEnabled();
    useSyncHeight({
        selector: `tr[data-line="${lineNumber}-hunk"]`,
        side: SplitSide[SplitSide.old],
        enable: side === SplitSide.new,
    });
    const enableHunkAction = side === SplitSide.old;
    const couldExpand = expandEnabled && currentHunk && currentHunk.splitInfo;
    const isExpandAll = currentHunk &&
        currentHunk.splitInfo &&
        currentHunk.splitInfo.endHiddenIndex - currentHunk.splitInfo.startHiddenIndex < composeLen;
    const isFirstLine = currentHunk && currentHunk.isFirst;
    const isLastLine = currentHunk && currentHunk.isLast;
    return (React.createElement("tr", { "data-line": `${lineNumber}-hunk`, "data-state": "hunk", "data-side": SplitSide[side], className: "diff-line diff-line-hunk" }, enableHunkAction ? (React.createElement(React.Fragment, null,
        React.createElement("td", { className: "diff-line-hunk-action sticky left-0 w-[1%] min-w-[40px] select-none p-[1px]", style: {
                backgroundColor: `var(${hunkLineNumberBGName})`,
                color: `var(${plainLineNumberColorName})`,
                width: `var(${diffAsideWidthName})`,
                minWidth: `var(${diffAsideWidthName})`,
                maxWidth: `var(${diffAsideWidthName})`,
            } }, couldExpand ? (isFirstLine ? (React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[6px]", title: "Expand Up", "data-title": "Expand Up", onClick: () => diffFile.onSplitHunkExpand("up", index) },
            React.createElement(ExpandUp, { className: "fill-current" }))) : isLastLine ? (React.createElement("button", { className: "diff-widget-tooltip relative flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[6px]", title: "Expand Down", "data-title": "Expand Down", onClick: () => diffFile.onSplitHunkExpand("down", index) },
            React.createElement(ExpandDown, { className: "fill-current" }))) : isExpandAll ? (React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[6px]", title: "Expand All", "data-title": "Expand All", onClick: () => diffFile.onSplitHunkExpand("all", index) },
            React.createElement(ExpandAll, { className: "fill-current" }))) : (React.createElement(React.Fragment, null,
            React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[2px]", title: "Expand Down", "data-title": "Expand Down", onClick: () => diffFile.onSplitHunkExpand("down", index) },
                React.createElement(ExpandDown, { className: "fill-current" })),
            React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[2px]", title: "Expand Up", "data-title": "Expand Up", onClick: () => diffFile.onSplitHunkExpand("up", index) },
                React.createElement(ExpandUp, { className: "fill-current" }))))) : (React.createElement("div", { className: "min-h-[28px]" }, "\u2002"))),
        React.createElement("td", { className: "diff-line-hunk-content pr-[10px] align-middle", style: { backgroundColor: `var(${hunkContentBGName})` } },
            React.createElement("div", { className: "pl-[1.5em]", style: {
                    color: `var(${hunkContentColorName})`,
                } }, ((_a = currentHunk.splitInfo) === null || _a === void 0 ? void 0 : _a.plainText) || currentHunk.text)))) : (React.createElement("td", { className: "diff-line-hunk-placeholder select-none", colSpan: 2, style: { backgroundColor: `var(${hunkContentBGName})` } },
        React.createElement("div", { className: "min-h-[28px]" }, "\u2002")))));
};
const InternalDiffSplitHunkLineGitLab = ({ index, diffFile, side, lineNumber, }) => {
    var _a;
    const currentHunk = diffFile.getSplitHunkLine(index);
    const expandEnabled = diffFile.getExpandEnabled();
    useSyncHeight({
        selector: `tr[data-line="${lineNumber}-hunk"]`,
        side: SplitSide[side],
        enable: true,
    });
    const couldExpand = expandEnabled && currentHunk && currentHunk.splitInfo;
    const isExpandAll = currentHunk &&
        currentHunk.splitInfo &&
        currentHunk.splitInfo.endHiddenIndex - currentHunk.splitInfo.startHiddenIndex < composeLen;
    const isFirstLine = currentHunk && currentHunk.isFirst;
    const isLastLine = currentHunk && currentHunk.isLast;
    return (React.createElement("tr", { "data-line": `${lineNumber}-hunk`, "data-state": "hunk", "data-side": SplitSide[side], className: "diff-line diff-line-hunk" },
        React.createElement("td", { className: "diff-line-hunk-action sticky left-0 w-[1%] min-w-[40px] select-none p-[1px]", style: {
                backgroundColor: `var(${hunkLineNumberBGName})`,
                color: `var(${plainLineNumberColorName})`,
                width: `var(${diffAsideWidthName})`,
                minWidth: `var(${diffAsideWidthName})`,
                maxWidth: `var(${diffAsideWidthName})`,
            } }, couldExpand ? (isFirstLine ? (React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[6px]", title: "Expand Up", "data-title": "Expand Up", onClick: () => diffFile.onSplitHunkExpand("up", index) },
            React.createElement(ExpandUp, { className: "fill-current" }))) : isLastLine ? (React.createElement("button", { className: "diff-widget-tooltip relative flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[6px]", title: "Expand Down", "data-title": "Expand Down", onClick: () => diffFile.onSplitHunkExpand("down", index) },
            React.createElement(ExpandDown, { className: "fill-current" }))) : isExpandAll ? (React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[6px]", title: "Expand All", "data-title": "Expand All", onClick: () => diffFile.onSplitHunkExpand("all", index) },
            React.createElement(ExpandAll, { className: "fill-current" }))) : (React.createElement(React.Fragment, null,
            React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[2px]", title: "Expand Down", "data-title": "Expand Down", onClick: () => diffFile.onSplitHunkExpand("down", index) },
                React.createElement(ExpandDown, { className: "fill-current" })),
            React.createElement("button", { className: "diff-widget-tooltip flex w-full cursor-pointer items-center justify-center rounded-[2px] py-[2px]", title: "Expand Up", "data-title": "Expand Up", onClick: () => diffFile.onSplitHunkExpand("up", index) },
                React.createElement(ExpandUp, { className: "fill-current" }))))) : (React.createElement("div", { className: "min-h-[28px]" }, "\u2002"))),
        React.createElement("td", { className: "diff-line-hunk-content pr-[10px] align-middle", style: { backgroundColor: `var(${hunkContentBGName})` } },
            React.createElement("div", { className: "pl-[1.5em]", style: {
                    color: `var(${hunkContentColorName})`,
                } }, ((_a = currentHunk.splitInfo) === null || _a === void 0 ? void 0 : _a.plainText) || currentHunk.text))));
};
const InternalDiffSplitHunkLine = ({ index, diffFile, side, lineNumber, }) => {
    const { useDiffContext } = useDiffViewContext();
    const diffViewMode = useDiffContext.useShallowStableSelector((s) => s.mode);
    if (diffViewMode === DiffModeEnum.SplitGitHub ||
        diffViewMode === DiffModeEnum.Split ||
        diffViewMode === DiffModeEnum.Unified) {
        return React.createElement(InternalDiffSplitHunkLineGitHub, { index: index, diffFile: diffFile, side: side, lineNumber: lineNumber });
    }
    else {
        return React.createElement(InternalDiffSplitHunkLineGitLab, { index: index, diffFile: diffFile, side: side, lineNumber: lineNumber });
    }
};
export const DiffSplitHunkLine = ({ index, diffFile, side, lineNumber, }) => {
    const currentHunk = diffFile.getSplitHunkLine(index);
    const currentIsShow = currentHunk &&
        currentHunk.splitInfo &&
        currentHunk.splitInfo.startHiddenIndex < currentHunk.splitInfo.endHiddenIndex;
    const currentIsPureHunk = currentHunk && diffFile._getIsPureDiffRender() && !currentHunk.splitInfo;
    if (!currentIsShow && !currentIsPureHunk)
        return null;
    return React.createElement(InternalDiffSplitHunkLine, { index: index, diffFile: diffFile, side: side, lineNumber: lineNumber });
};
