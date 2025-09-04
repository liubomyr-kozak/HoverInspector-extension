import { useCallback, useRef } from "react";
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const useCallbackRef = (cb) => {
    const cbRef = useRef(cb);
    cbRef.current = cb;
    const stableCallback = useCallback((...args) => {
        var _a, _b;
        if (args.length) {
            return (_a = cbRef.current) === null || _a === void 0 ? void 0 : _a.call(cbRef, ...args);
        }
        else {
            return (_b = cbRef.current) === null || _b === void 0 ? void 0 : _b.call(cbRef);
        }
    }, []);
    return stableCallback;
};
