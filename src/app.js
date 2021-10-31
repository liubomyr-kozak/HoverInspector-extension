import React from "react";
import { Provider } from "react-redux";

import EventListenerProvider from "./modules/EventListenerProvider";
import { store } from "./store/createStore";
import SelectedBox from "./modules/SelectedBox";
import SettingsIconBox from "./modules/SettingsIconBox/SettingsIconBox";
import HoveredLinesArea from "./modules/HoveredLinesArea";
import DistanceAndLabel from "./modules/DistanceAndLabel";
import Popup from "./modules/Popup/Popup";
import HoveredBox from "./modules/HoveredBox";
import AppController from "./modules/AppController/AppController";

import './app.scss';

export const App = () => {
  return (
    <Provider store={store}>
      <AppController>
        <EventListenerProvider/>
        <SelectedBox/>
        <SettingsIconBox/>
        <HoveredLinesArea/>
        <DistanceAndLabel/>
        <Popup/>
        <HoveredBox/>
      </AppController>
    </Provider>
  );
};