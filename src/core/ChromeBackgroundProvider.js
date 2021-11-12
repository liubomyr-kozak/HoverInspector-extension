import { isProduction } from "../shared/helpers";

class ChromeBackgroundProvider {
  providerOnMessage;
  providerPort;

  constructor() {
    if (isProduction()) {
      this.providerPort = chrome.runtime.connect({name: 'hoverInspector'});
      // this.providerOnMessage = chrome.runtime.onMessage;
    }
  }

  addListener(fn) {
    this.providerPort && this.providerPort.addListener(fn)
  }

  removeListener(fn) {
    this.providerPort && this.providerPort.removeListener(fn)
  }

  postMessage(fn) {
    this.providerPort && this.providerPort.postMessage(fn)
  }
}

export default new ChromeBackgroundProvider()