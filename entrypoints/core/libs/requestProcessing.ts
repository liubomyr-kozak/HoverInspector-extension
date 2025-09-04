import { isDevelopment, isPostProd, isProduction } from "@entrypoints/shared/helpers.ts";

export const requestProcessing = (data, callback, localExecFn) => {
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
    const result = localExecFn(data);
    result.then((response) => {
      callback(response);
    });
  }
};
