//@ts-nocheck
import browserApi from "@entrypoints/core/services/api/BrowserApi.ts";

export const tabStatus = {
  TAB_LOAD_COMPLETE: "complete",
  TAB_LOAD_LOADING: "loading", // перезапуск сторінки
};
export const newTabUrl = "chrome://newtab/";

const isUrlBlocked = (urlPatterns, url) => {
  return urlPatterns.some((pattern) => {
    const regex = new RegExp(pattern.replace("*://", "").replace("/*", "").replace(/\./g, "\\."));
    return regex.test(url);
  });
};

export const skipTab = (tab, { allowLoading = false } = {}) => {
  const isNotTabIdExist = !tab.id;
  const isNotUrlExist = !tab.url;
  const isNewTab = tab.url === newTabUrl;
  const isTabLoading = !allowLoading && tab.status === tabStatus.TAB_LOAD_LOADING;

  const manifest = browserApi.runtime.getManifest();
  const excludeMatches = manifest?.content_scripts?.[0]?.exclude_matches || [];

  return isNotTabIdExist || isNotUrlExist || isNewTab || isTabLoading || isUrlBlocked(excludeMatches, tab.url);
};

export class Deferred {
  promise;
  resolve;
  reject;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
