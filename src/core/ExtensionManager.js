import { render, unmountComponentAtNode } from "react-dom";

class ExtensionManager {
  isExtInjected = null;
  appReactRef = null;
  extId = null;
  backgroundListeners = null;
  backgroundProviders = null;

  init = ({ appReactRef, extId, backgroundProvider, backgroundListeners, backgroundScripts }) => {
    this.appReactRef = appReactRef;
    this.extId = extId;
    this.backgroundProvider = backgroundProvider.create('port');

    this.backgroundListeners = backgroundListeners.reduce((acc, { type, action }) => {
      acc[type] = action;
      return acc
    }, {});

    this.backgroundScripts = backgroundScripts;

    this.backgroundProvider.addListener(this.onBackgroundAction);
    this.backgroundScripts.forEach((fn) => {
      fn(this.backgroundProvider);
    })
  }

  render = () => {
    if (this.isExtInjected) return;

    const extNode = document.createElement('div');
    extNode.id = this.extId;

    this.isExtInjected = true;

    setTimeout(() => {
      document.body.appendChild(extNode);
      render(this.appReactRef, extNode);
    }, 200);
  }

  destroy = () => {
    const extensionNode = document.getElementById(this.extId);
    unmountComponentAtNode(extensionNode);
    document.body.removeChild(extensionNode);

    this.backgroundProvider.removeListener(this.onBackgroundAction);
  }

  onBackgroundAction = (request) => {
    console.log("backgroundListener -> request", request)
    if (!this.backgroundListeners[request.action]) return;
    debugger
    console.log("backgroundListener -> this.backgroundListenerList", this.backgroundListeners)
    this.backgroundListeners[request.action]();
  }
}


export default new ExtensionManager()