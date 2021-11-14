import hotkeys from "hotkeys-js";
import React from "react";

import ExtensionManager from "./core/ExtensionManager";
import ChromeBackgroundProvider from "./core/ChromeBackgroundProvider";
import ServiceReduxHandler from "./core/services/ServiceReduxHandler/ServiceReduxHandler";

import { revertLastUserAction } from "./store/app.action";
import { App } from "./app";

ExtensionManager.init({
  extId: "zTool",
  appReactRef: <App/>,
  backgroundProvider: ChromeBackgroundProvider,
  backgroundListeners: [
    {
      type: 'destroy',
      action: ExtensionManager.destroy,
    },
    {
      type: 'init',
      action: ExtensionManager.render,
    },
    {
      type: 'notifyOnUpdated',
      action: ExtensionManager.destroy,
    }
  ],
  backgroundScripts: [
    (provider) => {
      hotkeys('esc', function () {
        provider.postMessage({
          action: 'destroy'
        })
      })
    },
    () => {
      hotkeys('space', function (e) {
        e.stopPropagation();
        e.preventDefault();
        ServiceReduxHandler.dispatch(revertLastUserAction())
      });
    }
  ]
})



//
// ExtensionManager.addBackgroundListener({
//   type: 'destroy',
//   action: ExtensionManager.destroy,
// })
//
// ExtensionManager.addBackgroundListener({
//   type: 'init',
//   action: ExtensionManager.render,
// })
//
// ExtensionManager.addBackgroundListener({
//   type: 'notifyOnUpdated',
//   action: ExtensionManager.destroy,
// })
//
// ExtensionManager.addBackgroundScript((provider) => {
//   hotkeys('esc', function () {
//     provider.postMessage({
//       actionType: 'destroy'
//     })
//   });
// })
//
// ExtensionManager.addBackgroundScript(() => {
//   hotkeys('space', function (e) {
//     e.stopPropagation();
//     e.preventDefault();
//     ServiceReduxHandler.dispatch(revertLastUserAction())
//   });
// })