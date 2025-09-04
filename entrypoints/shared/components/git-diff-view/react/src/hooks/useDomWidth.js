import { useEffect, useState } from "react";
import { useDiffViewContext } from "../components/DiffViewContext";
export const useDomWidth = ({ selector, enable }) => {
    const [width, setWidth] = useState(0);
    const { useDiffContext } = useDiffViewContext();
    const { id, mounted } = useDiffContext.useShallowStableSelector((s) => ({ id: s.id, mounted: s.mounted }));
    useEffect(() => {
        if (enable) {
            const container = document.querySelector(`#diff-root${id}`);
            const wrapper = container === null || container === void 0 ? void 0 : container.querySelector(selector);
            if (!wrapper)
                return;
            const typedWrapper = wrapper;
            const cb = () => {
                var _a;
                const rect = wrapper === null || wrapper === void 0 ? void 0 : wrapper.getBoundingClientRect();
                setWidth((_a = rect === null || rect === void 0 ? void 0 : rect.width) !== null && _a !== void 0 ? _a : 0);
            };
            cb();
            const cleanCb = () => {
                var _a;
                typedWrapper.__observeCallback.delete(cb);
                if (typedWrapper.__observeCallback.size === 0) {
                    (_a = typedWrapper.__observeInstance) === null || _a === void 0 ? void 0 : _a.disconnect();
                    typedWrapper.removeAttribute("data-observe");
                    delete typedWrapper.__observeCallback;
                    delete typedWrapper.__observeInstance;
                }
            };
            if (typedWrapper.__observeCallback) {
                typedWrapper.__observeCallback.add(cb);
                return () => cleanCb();
            }
            typedWrapper.__observeCallback = new Set();
            typedWrapper.__observeCallback.add(cb);
            const observer = new ResizeObserver(() => typedWrapper.__observeCallback.forEach((cb) => cb()));
            typedWrapper.__observeInstance = observer;
            observer.observe(typedWrapper);
            typedWrapper.setAttribute("data-observe", "height");
            return () => cleanCb();
        }
    }, [selector, enable, id, mounted]);
    return width;
};
