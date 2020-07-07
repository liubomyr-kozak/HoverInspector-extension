import React from 'react';
import ReactDOM from 'react-dom';
import './inject.scss';

import {Box} from "./Components/box";
import {StateProvider} from './appState';
import {EventListenerProvider} from "./EventListenerProvider";

const BootstrapApp = () => {
  const initialState = {
    isActive: true,
  };

  const reducer = (state, action) => {

    console.log(action);

    switch (action.type) {
      case 'changeActive':
        return {
          ...state,
          ...action
        };
      case 'hover':
        return {
          ...state,
          ...action
        };
      case 'select':
        return {
          ...state,
          ...action
        };
      case 'scroll':
        return {
          ...state,
          ...action
        };
      case 'scrollSimple':
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
      <Box/>
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
