import { requestProcessing } from "./requestProcessing.ts";

export const chromeActionsSlice = (config) => {
  const configMiddleware = { ...config };

  for (let key in configMiddleware) {
    if ((configMiddleware as Object).hasOwnProperty(key)) {
      const localExecFn = config[key];

      configMiddleware[key] = (...args) => {
        return new Promise((resolve) => {
          const data = args ? args[0] : null;

          requestProcessing({ action: key, data }, resolve, localExecFn);
        });
      };
    }
  }

  configMiddleware["initMiddleware"] = () => {
    if (chrome.runtime) {
      chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (!(config as Object).hasOwnProperty(request?.action) || typeof config[request.action] !== "function") {
          // Another slice (or another messaging layer) handles this message
          return false;
        }

        Promise.resolve()
          .then(() => config[request.action](request, sender))
          .then(
            (response) => sendResponse(response),
            (error) => {
              console.error(`[background] ${request.action} failed:`, error);
              sendResponse({ success: false, error: String(error?.message || error) });
            },
          );

        return true;
      });
    }
  };

  return configMiddleware;
};

export type RequestData<T> = { action: string; data: T };

export const FormatSliceType = <T>(data: T) => data as unknown as RequestData<T>;
