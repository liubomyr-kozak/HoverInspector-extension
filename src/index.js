import React from 'react';
import hotkeys from 'hotkeys-js';

import ExtensionManager from "./core/ExtensionManager";
import ChromeBackgroundProvider from "./core/ChromeBackgroundProvider";
import { App } from "./app";
import ServiceReduxHandler from "./core/services/ServiceReduxHandler/ServiceReduxHandler";
import { revertLastUserAction } from "./store/app.action";
import { isProduction } from "./shared/helpers";

window.isProduction = isProduction();

ExtensionManager.init({
  extId: "zTool",
  appReactRef: <App/>,
  backgroundProvider: ChromeBackgroundProvider,
  backgroundListener: [
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
  backgroundScript: [
    (provider) => {
      hotkeys('esc', function () {
        provider.postMessage({
          actionType: 'destroy'
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

ExtensionManager.render()
