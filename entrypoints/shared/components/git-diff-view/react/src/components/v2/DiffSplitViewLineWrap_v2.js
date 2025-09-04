import { DiffFileLineType } from "@git-diff-view/core";
import * as React from "react";
import { DiffSplitContentLine } from "./DiffSplitContentLineWrap_v2";
import { DiffSplitExtendLine } from "./DiffSplitExtendLineWrap_v2";
import { DiffSplitHunkLine } from "./DiffSplitHunkLineWrap_v2";
import { DiffSplitWidgetLine } from "./DiffSplitWidgetLineWrap_v2";
export const DiffSplitViewLine = ({ line, diffFile }) => {
    switch (line.type) {
        case DiffFileLineType.hunk:
            return React.createElement(DiffSplitHunkLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        case DiffFileLineType.content:
            return React.createElement(DiffSplitContentLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        case DiffFileLineType.widget:
            return React.createElement(DiffSplitWidgetLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        case DiffFileLineType.extend:
            return React.createElement(DiffSplitExtendLine, { index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        default:
            return null;
    }
};
