import React from 'react';
import hotkeys from 'hotkeys-js';
import ExtensionManager from "./core/ExtensionManager";
import ChromeBackgroundProvider from "./core/ChromeBackgroundProvider";

import { App } from "./app";
import ServiceReduxHandler from "./core/services/ServiceReduxHandler/ServiceReduxHandler";
import { revertLastUserAction } from "./store/app.action";

ExtensionManager.register({
  extId: "zTool",
  appReactRef: <App/>,
  backgroundProvider: ChromeBackgroundProvider
})

ExtensionManager.addBackgroundListener({
  type: 'destroy',
  action: ExtensionManager.destroy,
})

ExtensionManager.addBackgroundListener({
  type: 'init',
  action: ExtensionManager.render,
})

ExtensionManager.addBackgroundListener({
  type: 'notifyOnUpdated',
  action: ExtensionManager.destroy,
})

ExtensionManager.addBackgroundScript((provider) => {
  hotkeys('esc', function () {
    provider.postMessage({
      actionType: 'destroy'
    })
  });
})

ExtensionManager.addBackgroundScript(() => {
  hotkeys('space', function (e) {
    e.stopPropagation();
    e.preventDefault();
    ServiceReduxHandler.dispatch(revertLastUserAction())
  });
})

ExtensionManager.render()
