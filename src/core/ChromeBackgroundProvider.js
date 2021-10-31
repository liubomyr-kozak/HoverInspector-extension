import { isProduction } from "../shared/helpers";

class ChromeBackgroundProvider {
  provider;

  constructor() {
    if (isProduction()) {
      this.provider = chrome.runtime.onMessage
    }
  }

  addListener(fn) {
    this.provider && this.provider.addListener(fn)
  }

  removeListener(fn) {
    this.provider && this.provider.removeListener(fn)
  }

  postMessage(fn) {
    this.provider && this.provider.postMessage(fn)
  }
}

export default new ChromeBackgroundProvider()