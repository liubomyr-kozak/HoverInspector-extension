import {Provider} from "react-redux";
import React from "react";
import {StyleSheetManager} from "styled-components";
import {StyleProvider} from '@ant-design/cssinjs'

import {store} from "@entrypoints/content/store/createStore.ts";


import {App} from "./app.tsx";


export const ExtensionRoot = ({shadowRoot}) => {
    return (
        <Provider store={store}>
            <StyleSheetManager target={shadowRoot}>
                <StyleProvider container={shadowRoot}>
                    <App/>
                </StyleProvider>
            </StyleSheetManager>
        </Provider>
    );
};