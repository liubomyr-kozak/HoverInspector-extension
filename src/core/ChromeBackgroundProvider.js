import { isProduction } from "../shared/helpers";

class Provider {
  provider
  constructor(provider) {
    this.provider = provider;
  }

  addListener(fn) {
    this.provider && this.provider.addListener(fn)
  }

  removeListener(fn) {
    this.provider && this.provider.removeListener(fn)
  }
}

class ProviderRuntime extends Provider {
  sendMessage(fn, callback) {
    this.provider && this.provider.sendMessage(fn, callback)
  }
}

class ProviderPort extends Provider {
  addListener(fn) {
    this.provider && this.provider.onMessage.addListener(fn)
  }

  removeListener(fn) {
    this.provider && this.provider.onMessage.removeListener(fn)
  }

  postMessage(fn, callback) {
    this.provider && this.provider.postMessage(fn, callback)
  }
}

class ProviderExtension extends Provider {
  sendMessage(fn, callback) {
    this.provider && this.provider.sendMessage(fn, callback)
  }
}


class ChromeBackgroundProvider {
  port;
  runtime;
  extension;

  constructor() {
    if (isProduction()) {
      this.port = chrome.runtime.connect({ name: 'hoverInspector' });
      this.runtime = chrome.runtime;
      this.extension = chrome.extension
    }
  }

  // use(providerType){
  create(providerType) {
    if (providerType === 'port') {
      return new ProviderPort(this.port)
    }

    if (providerType === 'runtime') {
      return new ProviderRuntime(this.runtime)
    }

    if (providerType === 'extension') {
      return new ProviderExtension(this.extension)
    }
  }
}

export default new ChromeBackgroundProvider()