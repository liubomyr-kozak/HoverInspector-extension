import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import hotkeys from 'hotkeys-js';

import {MainLayer} from "./app";
import {StateProvider} from './core/appState';
import {EventListenerProvider} from "./core/EventListenerProvider";

import './app.scss';

let connectionClosed = false;
const port = chrome.runtime.connect({name: "dimensions"});

const BootstrapApp = () => {
    const initialState = {
        isActive: true,
    };

    useEffect(() => {
        console.log('init');
        return () => {
            console.log('destroy');
        }
    }, [])
    const reducer = (state, action) => {
        switch (action.type) {
            case 'hover':
            case 'select':
            case 'scroll':
            case 'scrollWithoutSelected':
            case 'labelRendered':
                return {
                    ...state,
                    ...action
                };
            default:
                return state;
        }
    };

    return (
        <StateProvider initialState={initialState} reducer={reducer}>
            <EventListenerProvider/>
            <MainLayer/>
        </StateProvider>
    );
};

const rootEl = document.createElement('div');
rootEl.className = "zTool";
document.body.appendChild(rootEl);


port.onMessage.addListener(function (event) {
    if (connectionClosed)
        return;

    switch (event.actionType) {
        case 'init':
            ReactDOM.render(<BootstrapApp/>, rootEl);
            break;
        case 'destroy':
            ReactDOM.unmountComponentAtNode(rootEl);
            break;
        case 'notifyOnUpdated':
            ReactDOM.unmountComponentAtNode(rootEl);
            break;
    }
});

// side effect.. I execute version in another script;
window.extension.hoverInspector.version;

hotkeys('esc', function () {
    port.postMessage({
        actionType: 'destroy'
    })
});