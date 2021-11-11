import { isProduction } from "../shared/helpers";

class ChromeBackgroundProvider {
  providerOnMessage;
  provider;

  constructor() {
    if (isProduction()) {
      this.provider = chrome.runtime;
      this.providerOnMessage = chrome.runtime.onMessage;
    }
  }

  addListener(fn) {
    this.providerOnMessage && this.providerOnMessage.addListener(fn)
  }

  removeListener(fn) {
    this.providerOnMessage && this.providerOnMessage.removeListener(fn)
  }

  postMessage(fn) {
    this.provider && this.provider.sendMessage(fn)
  }
}

export default new ChromeBackgroundProvider()