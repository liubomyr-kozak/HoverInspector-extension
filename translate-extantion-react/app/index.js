import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './app.scss';
import {isProduction} from './providers/helpers';

const wordberryEl = document.createElement('div');
wordberryEl.id = "wb-extension-wordberry";

    setTimeout(() => {
        if(!isProduction()){
            document.body.appendChild(wordberryEl);
            ReactDOM.render(
                <App/>,
                wordberryEl
            );
        }
}, 1000);