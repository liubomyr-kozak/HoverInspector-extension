import { Provider } from "react-redux";
import React from "react";

import { store } from "@entrypoints/content/store/createStore.ts";

import { App } from "./app.tsx";

export const ExtensionRoot = ({ shadowRoot }) => {
  return (
    <Provider store={store}>
      <App shadowRoot={shadowRoot} />
    </Provider>
  );
};
