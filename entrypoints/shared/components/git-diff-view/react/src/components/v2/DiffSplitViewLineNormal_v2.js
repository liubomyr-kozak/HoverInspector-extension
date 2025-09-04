import { DiffFileLineType } from "@git-diff-view/core";
import * as React from "react";
import { DiffSplitContentLine } from "./DiffSplitContentLineNormal_v2";
import { DiffSplitExtendLine } from "./DiffSplitExtendLineNormal_v2";
import { DiffSplitHunkLine } from "./DiffSplitHunkLineNormal_v2";
import { DiffSplitWidgetLine } from "./DiffSplitWidgetLineNormal_v2";
export const DiffSplitViewLine = ({ line, side, diffFile, }) => {
    switch (line.type) {
        case DiffFileLineType.hunk:
            return React.createElement(DiffSplitHunkLine, { side: side, index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        case DiffFileLineType.content:
            return React.createElement(DiffSplitContentLine, { side: side, index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        case DiffFileLineType.widget:
            return React.createElement(DiffSplitWidgetLine, { side: side, index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        case DiffFileLineType.extend:
            return React.createElement(DiffSplitExtendLine, { side: side, index: line.index, lineNumber: line.lineNumber, diffFile: diffFile });
        default:
            return null;
    }
};
