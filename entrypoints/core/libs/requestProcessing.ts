import { isDevelopment, isPostProd, isProduction } from "@entrypoints/shared/helpers.ts";

type RequestProcessing = (
  data: { action: string; data: any },
  callback: (res: any) => void,
  localExecFn?: (params: any) => Promise<any>,
  onError?: (error: Error) => void,
) => void;

export const requestProcessing: RequestProcessing = (data, callback, localExecFn, onError) => {
  const fail = (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    if (onError) onError(err);
    else console.error(`[${data.action}]`, err);
  };

  if (isProduction() || isPostProd()) {
    // додав для випадку коли використовується всторому коді, який не має доступу до chrome.runtime
    if (!chrome?.runtime?.id) {
      if (onError) onError(new Error("Extension context is not available"));
      return;
    }
    chrome.runtime.sendMessage(data, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError && onError) {
        onError(new Error(lastError.message));
        return;
      }
      callback(response);
    });
    return;
  }

  if (isDevelopment()) {
    Promise.resolve()
      // @ts-ignore
      .then(() => localExecFn(data))
      .then(callback, fail);
  }
};
