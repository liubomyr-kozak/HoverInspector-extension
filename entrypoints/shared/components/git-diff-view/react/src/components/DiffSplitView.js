import { memo, useEffect, useMemo, useRef } from "react";
import * as React from "react";
import { DiffSplitViewNormal } from "./DiffSplitViewNormal";
import { DiffSplitViewWrap } from "./DiffSplitViewWrap";
import { useDiffViewContext } from "./DiffViewContext";
import { DiffWidgetContext } from "./DiffWidgetContext";
import { createDiffWidgetStore } from "./tools";
export const DiffSplitView = memo(({ diffFile }) => {
    const { useDiffContext } = useDiffViewContext();
    const useDiffContextRef = useRef(useDiffContext);
    useDiffContextRef.current = useDiffContext;
    const { enableWrap, onCreateUseWidgetHook } = useDiffContext.useShallowStableSelector((s) => ({
        enableWrap: s.enableWrap,
        onCreateUseWidgetHook: s.onCreateUseWidgetHook,
    }));
    // performance optimization
    const useWidget = useMemo(() => createDiffWidgetStore(useDiffContextRef), []);
    const contextValue = useMemo(() => ({ useWidget }), [useWidget]);
    useEffect(() => {
        const { setWidget } = useWidget.getReadonlyState();
        setWidget({});
    }, [diffFile, useWidget]);
    useEffect(() => {
        onCreateUseWidgetHook === null || onCreateUseWidgetHook === void 0 ? void 0 : onCreateUseWidgetHook(useWidget);
    }, [useWidget, onCreateUseWidgetHook]);
    return (React.createElement(DiffWidgetContext.Provider, { value: contextValue }, enableWrap ? React.createElement(DiffSplitViewWrap, { diffFile: diffFile }) : React.createElement(DiffSplitViewNormal, { diffFile: diffFile })));
});
DiffSplitView.displayName = "DiffSplitView";
