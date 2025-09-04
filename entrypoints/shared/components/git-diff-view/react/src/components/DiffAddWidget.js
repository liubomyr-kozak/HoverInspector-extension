import { addWidgetBGName, addWidgetColorName, diffFontSizeName } from "../utils";
import * as React from "react";
export const DiffSplitAddWidget = ({ side, className, lineNumber, onWidgetClick, onOpenAddWidget, }) => {
    return (React.createElement("div", { className: "diff-add-widget-wrapper invisible select-none transition-transform hover:scale-110 group-hover:visible" +
            (className ? " " + className : ""), style: {
            width: `calc(var(${diffFontSizeName}) * 1.4)`,
            height: `calc(var(${diffFontSizeName}) * 1.4)`,
        } },
        React.createElement("button", { className: "diff-add-widget z-[1] flex h-full w-full origin-center cursor-pointer items-center justify-center rounded-md text-[1.2em]", style: {
                color: `var(${addWidgetColorName})`,
                backgroundColor: `var(${addWidgetBGName})`,
            }, onClick: () => {
                onOpenAddWidget(lineNumber, side);
                onWidgetClick === null || onWidgetClick === void 0 ? void 0 : onWidgetClick(lineNumber, side);
            } }, "+")));
};
export const DiffUnifiedAddWidget = ({ lineNumber, side, onWidgetClick, onOpenAddWidget, }) => {
    return (React.createElement("div", { className: "diff-add-widget-wrapper invisible absolute left-[100%] top-[1px] translate-x-[-50%] select-none transition-transform hover:scale-110 group-hover:visible", style: {
            width: `calc(var(${diffFontSizeName}) * 1.4)`,
            height: `calc(var(${diffFontSizeName}) * 1.4)`,
        } },
        React.createElement("button", { className: "diff-add-widget z-[1] flex h-full w-full origin-center cursor-pointer items-center justify-center rounded-md text-[1.2em]", style: {
                color: `var(${addWidgetColorName})`,
                backgroundColor: `var(${addWidgetBGName})`,
            }, onClick: () => {
                onOpenAddWidget(lineNumber, side);
                onWidgetClick === null || onWidgetClick === void 0 ? void 0 : onWidgetClick(lineNumber, side);
            } }, "+")));
};
