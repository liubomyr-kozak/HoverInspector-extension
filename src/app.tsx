import React from "react";
import { Provider } from "react-redux";

import { store } from "@entrypoints/content/store/createStore.ts";
import { App as ContentApp } from "@entrypoints/content/app.tsx";

import "../entrypoints/content/style.scss";
import "./app-src.css";

export const App = ({ shadowRoot }) => {
  return (
    <Provider store={store}>
      <ContentApp shadowRoot={shadowRoot} />
    </Provider>
  );
};
