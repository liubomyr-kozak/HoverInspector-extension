import { render, unmountComponentAtNode } from "react-dom";

class ExtensionManager {
  isExtInjected = null;
  appReactRef = null;
  extId = null;
  backgroundListenerList = {};
  backgroundProvider = null;

  init({ appReactRef, extId, backgroundProvider, backgroundListener, backgroundScript }) {
    if (!this.extId) {
      this.extId = extId;
    }

    this.isExtInjected = Boolean(document.getElementById(extId));

    if (this.isExtInjected) return;

    this.appReactRef = appReactRef;
    this.backgroundProvider = backgroundProvider;

    if (backgroundListener) {
      backgroundListener.forEach(this.addBackgroundListener);
    }
    if (backgroundScript) {
      backgroundScript.forEach(this.addBackgroundScript);
    }
  }

  render() {
    if (this.isExtInjected) return;

    const extNode = document.createElement('div');
    extNode.id = this.extId;

    setTimeout(() => {
      document.body.appendChild(extNode);
      render(this.appReactRef, extNode);
    }, 200);

    this.backgroundProvider.addListener(this.backgroundListener);
  }


  destroy = () => {
    const extensionNode = document.getElementById(this.extId);
    unmountComponentAtNode(extensionNode);
    document.body.removeChild(extensionNode);

    this.backgroundProvider.removeListener(this.backgroundListener);
  }

  addBackgroundListener = ({ type, action }) => {
    this.backgroundListenerList[type] = action;
    // window[type] = action
  }

  backgroundListener = (request) => {
    if (!this.backgroundListenerList[request.action]) return;
    this.backgroundListenerList[request.action]();
  }

  addBackgroundScript = (fn) => {
    fn(this.backgroundProvider);
  }
}


export default new ExtensionManager()