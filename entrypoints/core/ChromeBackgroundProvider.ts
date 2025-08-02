import { isPostProd, isProduction } from "@entrypoints/shared/helpers";

class Provider {
  provider;

  constructor(provider) {
    this.provider = provider;
  }

  addListener(fn) {
    this.provider && this.provider.addListener(fn);
  }

  removeListener(fn) {
    this.provider && this.provider.removeListener(fn);
  }
}

class ProviderRuntime extends Provider {
  sendMessage(fn, callback) {
    this.provider && this.provider.sendMessage(fn, callback);
  }
}

class ProviderPort extends Provider {
  addListener(fn) {
    this.provider && this.provider.onMessage.addListener(fn);
  }

  removeListener(fn) {
    this.provider && this.provider.onMessage.removeListener(fn);
  }

  postMessage(fn, callback) {
    this.provider && this.provider.postMessage(fn, callback);
  }
}

class ProviderExtension extends Provider {
  sendMessage(fn, callback) {
    this.provider && this.provider.sendMessage(fn, callback);
  }
}

class ChromeBackgroundProvider {
  port;
  runtime;
  extension;

  constructor() {
    if (isProduction() || isPostProd()) {
      // if (!browserApi?.runtime?.id) return;

      //@ts-ignore
      this.port = browser?.runtime?.connect({ name: "hoverInspector" });
      //@ts-ignore
      this.runtime = browser?.runtime;
      //@ts-ignore
      this.extension = browser?.extension;
    }
  }

  // use(providerType){
  create(providerType: string) {
    if (providerType === "port") {
      return new ProviderPort(this.port);
    }

    if (providerType === "runtime") {
      return new ProviderRuntime(this.runtime);
    }

    if (providerType === "extension") {
      return new ProviderExtension(this.extension);
    }
  }
}

export default new ChromeBackgroundProvider();
