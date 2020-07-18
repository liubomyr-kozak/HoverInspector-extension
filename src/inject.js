import React from 'react';
import ReactDOM from 'react-dom';
import './inject.scss';

import {MainLayer} from "./MainLayer";
import {StateProvider} from './core/appState';
import {EventListenerProvider} from "./core/EventListenerProvider";

const BootstrapApp = () => {
  const initialState = {
    isActive: true,
  };

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

ReactDOM.render(
  <BootstrapApp/>,
  rootEl
);
