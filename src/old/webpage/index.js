import Zt from "./core/Zt";
import {App} from "./app";
import hotkeys from 'hotkeys-js';
import {InfoTopBarModule} from "./modules/info-top-bar.module";

let connectionClosed = false;
const port = chrome.runtime.connect({name: "dimensions"});
let paused = true;


var ModuleZt = ModuleZt || Zt.init(() => {
        Zt.initExtension();
        Zt.port = port;

        port.onMessage.addListener(function (event) {
            if (connectionClosed)
                return;

            switch (event.actionType) {
                case 'distances':
                    App.showDimensions(event.data, paused);
                    break;
                case 'destroy':
                    App.destroy(connectionClosed);
                    break;
            }
        });

        // side effect.. I execute version in another script;
        Zt.version = window.extension.hoverInspector.version;


        hotkeys('command+enter, ctrl+enter', function () {
            InfoTopBarModule.changeDisplayInfoBoxPanel(!InfoTopBarModule.isVisible());
            InfoTopBarModule.toggleBoxes(InfoTopBarModule.isVisible() ? 'show' : 'hide');
            InfoTopBarModule.getLastUpdate();
        });


        hotkeys('esc', function (event, handler) {
            port.postMessage({
                actionType: 'destroy'
            })
        });


        App.addEventHandler();
    },
);
