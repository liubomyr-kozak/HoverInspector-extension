import { isDevelopment, isPostProd, isProduction } from "@entrypoints/shared/helpers.ts";

type RequestProcessing = (
  data: { action: string; data: any },
  callback: (res: any) => void,
  localExecFn?: (params: any) => Promise<any>,
) => void;

export const requestProcessing: RequestProcessing = (data, callback, localExecFn) => {
  if (isPostProd()) {
    // додав для випадку коли використовується всторому коді, який не має доступу до chrome.runtime
    if (!chrome?.runtime?.id) return;
    chrome.runtime.sendMessage(data, callback);
  }

  if (isProduction() || isPostProd()) {
    // додав для випадку коли використовується всторому коді, який не має доступу до chrome.runtime
    if (!chrome?.runtime?.id) return;
    chrome.runtime.sendMessage(data, callback);
  }

  if (isDevelopment()) {
    // @ts-ignore
    const result = localExecFn(data);
    result.then((response) => {
      callback(response);
    });
  }
};
