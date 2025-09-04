var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DiffFile, _cacheMap, SplitSide } from "@git-diff-view/core";
import { diffFontSizeName, DiffModeEnum } from "../utils";
import { memo, useEffect, useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import * as React from "react";
import { useIsMounted } from "../hooks/useIsMounted";
import { useUnmount } from "../hooks/useUnmount";
import { DiffSplitView } from "./DiffSplitView";
import { DiffUnifiedView } from "./DiffUnifiedView";
import { DiffViewContext } from "./DiffViewContext";
import { LineClickContext } from "./LineClickContext";
import { createDiffConfigStore } from "./tools";
_cacheMap.name = "@git-diff-view/react";
export { SplitSide, DiffModeEnum };
const InternalDiffView = (props) => {
    const { diffFile, className, style, wrapperRef, diffViewMode, diffViewWrap, diffViewFontSize, diffViewHighlight, renderWidgetLine, renderExtendLine, extendData, diffViewAddWidget, onAddWidgetClick, onLineClick, onCreateUseWidgetHook, isMounted, } = props;
    const diffFileId = useMemo(() => diffFile.getId(), [diffFile]);
    // performance optimization
    const useDiffContext = useMemo(() => createDiffConfigStore(props, diffFileId), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    useEffect(() => {
        const { id, setId, mode, setMode, mounted, setMounted, enableAddWidget, setEnableAddWidget, enableHighlight, setEnableHighlight, enableWrap, setEnableWrap, setExtendData, fontSize, setFontSize, onAddWidgetClick: _onAddWidgetClick, setOnAddWidgetClick, renderExtendLine: _renderExtendLine, setRenderExtendLine, renderWidgetLine: _renderWidgetLine, setRenderWidgetLine, onCreateUseWidgetHook: _onCreateUseWidgetHook, setOnCreateUseWidgetHook, } = useDiffContext.getReadonlyState();
        if (diffFileId && diffFileId !== id) {
            setId(diffFileId);
        }
        if (diffViewMode && diffViewMode !== mode) {
            setMode(diffViewMode);
        }
        if (mounted !== isMounted) {
            setMounted(isMounted);
        }
        if (diffViewAddWidget !== enableAddWidget) {
            setEnableAddWidget(diffViewAddWidget);
        }
        if (diffViewHighlight !== enableHighlight) {
            setEnableHighlight(diffViewHighlight);
        }
        if (diffViewWrap !== enableWrap) {
            setEnableWrap(diffViewWrap);
        }
        if (extendData) {
            setExtendData(extendData);
        }
        if (diffViewFontSize && diffViewFontSize !== fontSize) {
            setFontSize(diffViewFontSize);
        }
        if (onAddWidgetClick !== _onAddWidgetClick.current) {
            setOnAddWidgetClick({ current: onAddWidgetClick });
        }
        if (onCreateUseWidgetHook !== _onCreateUseWidgetHook) {
            setOnCreateUseWidgetHook(onCreateUseWidgetHook);
        }
        if (renderExtendLine !== _renderExtendLine) {
            setRenderExtendLine(renderExtendLine);
        }
        if (renderWidgetLine !== _renderWidgetLine) {
            setRenderWidgetLine(renderWidgetLine);
        }
    }, [
        useDiffContext,
        diffViewFontSize,
        diffViewHighlight,
        diffViewMode,
        diffViewWrap,
        diffViewAddWidget,
        diffFileId,
        isMounted,
        renderWidgetLine,
        renderExtendLine,
        extendData,
        onAddWidgetClick,
        onLineClick,
        onCreateUseWidgetHook,
    ]);
    const value = useMemo(() => ({ useDiffContext }), [useDiffContext]);
    const lineClickValue = useMemo(() => ({ onLineClick }), [onLineClick]);
    return (React.createElement(DiffViewContext.Provider, { value: value },
        React.createElement(LineClickContext.Provider, { value: lineClickValue },
            React.createElement("div", { className: "diff-tailwindcss-wrapper h-full", "data-component": "git-diff-view", "data-theme": diffFile._getTheme() || "light", "data-highlighter": diffFile._getHighlighterName(), ref: wrapperRef },
                React.createElement("div", { className: "diff-style-root h-full", style: {
                        // @ts-ignore
                        [diffFontSizeName]: diffViewFontSize + "px",
                    } },
                    React.createElement("div", { id: isMounted ? `diff-root${diffFileId}` : undefined, className: "h-full diff-view-wrapper" + (className ? ` ${className}` : ""), style: style }, diffViewMode & DiffModeEnum.Split ? (React.createElement(DiffSplitView, { diffFile: diffFile })) : (React.createElement(DiffUnifiedView, { diffFile: diffFile }))))))));
};
const MemoedInternalDiffView = memo(InternalDiffView);
const DiffViewWithRef = (props, ref) => {
    var _a, _b;
    const { registerHighlighter, data, diffViewTheme, diffFile: _diffFile } = props, restProps = __rest(props, ["registerHighlighter", "data", "diffViewTheme", "diffFile"]);
    const diffFile = useMemo(() => {
        var _a, _b, _c, _d, _e, _f;
        if (_diffFile) {
            // missing data for plain file render
            // TODO next release update ?
            // will cause more complex for diffFile flow control, keep current
            const diffFile = DiffFile.createInstance({});
            diffFile._mergeFullBundle(_diffFile._getFullBundle());
            return diffFile;
        }
        else if (data) {
            return new DiffFile(((_a = data === null || data === void 0 ? void 0 : data.oldFile) === null || _a === void 0 ? void 0 : _a.fileName) || "", ((_b = data === null || data === void 0 ? void 0 : data.oldFile) === null || _b === void 0 ? void 0 : _b.content) || "", ((_c = data === null || data === void 0 ? void 0 : data.newFile) === null || _c === void 0 ? void 0 : _c.fileName) || "", ((_d = data === null || data === void 0 ? void 0 : data.newFile) === null || _d === void 0 ? void 0 : _d.content) || "", (data === null || data === void 0 ? void 0 : data.hunks) || [], ((_e = data === null || data === void 0 ? void 0 : data.oldFile) === null || _e === void 0 ? void 0 : _e.fileLang) || "", ((_f = data === null || data === void 0 ? void 0 : data.newFile) === null || _f === void 0 ? void 0 : _f.fileLang) || "");
        }
        return null;
    }, [data, _diffFile]);
    const diffFileRef = useRef(diffFile);
    const wrapperRef = useRef();
    if (diffFileRef.current && diffFileRef.current !== diffFile) {
        (_b = (_a = diffFileRef.current).clear) === null || _b === void 0 ? void 0 : _b.call(_a);
        diffFileRef.current = diffFile;
    }
    const isMounted = useIsMounted();
    useEffect(() => {
        if (_diffFile && diffFile) {
            _diffFile._addClonedInstance(diffFile);
            return () => {
                _diffFile._delClonedInstance(diffFile);
            };
        }
    }, [diffFile, _diffFile]);
    useEffect(() => {
        if (!diffFile)
            return;
        diffFile.initTheme(diffViewTheme);
        diffFile.initRaw();
        diffFile.buildSplitDiffLines();
        diffFile.buildUnifiedDiffLines();
    }, [diffFile, diffViewTheme]);
    useEffect(() => {
        if (!diffFile)
            return;
        if (props.diffViewHighlight) {
            diffFile.initSyntax({ registerHighlighter });
        }
        diffFile.notifyAll();
    }, [diffFile, props.diffViewHighlight, registerHighlighter, diffViewTheme]);
    useEffect(() => {
        if (!diffFile)
            return;
        const init = () => {
            var _a, _b;
            (_a = wrapperRef.current) === null || _a === void 0 ? void 0 : _a.setAttribute("data-theme", diffFile._getTheme() || "light");
            (_b = wrapperRef.current) === null || _b === void 0 ? void 0 : _b.setAttribute("data-highlighter", diffFile._getHighlighterName());
        };
        init();
        const cb = diffFile.subscribe(init);
        return cb;
    }, [diffFile]);
    // fix react strict mode error
    useUnmount(() => { var _a; return (_a = diffFile === null || diffFile === void 0 ? void 0 : diffFile.clear) === null || _a === void 0 ? void 0 : _a.call(diffFile); }, [diffFile]);
    useImperativeHandle(ref, () => ({ getDiffFileInstance: () => diffFile }), [diffFile]);
    if (!diffFile)
        return null;
    return (React.createElement(MemoedInternalDiffView, Object.assign({ key: diffFile.getId() }, restProps, { diffFile: diffFile, isMounted: isMounted, wrapperRef: wrapperRef, diffViewTheme: diffViewTheme, diffViewMode: restProps.diffViewMode || DiffModeEnum.SplitGitHub, diffViewFontSize: restProps.diffViewFontSize || 14 })));
};
function ReactDiffView(props) {
    return React.createElement(DiffViewWithRef, Object.assign({}, props));
}
const InnerDiffView = forwardRef(DiffViewWithRef);
InnerDiffView.displayName = "DiffView";
export const DiffView = InnerDiffView;
