import React from 'react';
import {createRoot} from 'react-dom/client';

import {App} from "@/src/app.tsx";
// Import CSS directly in main.tsx
import '../entrypoints/content/app.css';
import '../entrypoints/content/style.scss';
import './app.css';

class HoverInspector extends HTMLElement {
    constructor() {
        super();

        // Додаємо потрібні атрибути й стилі самому <hover-inspector>
        this.setAttribute('data-wxt-shadow-root', '');
        this.style.zIndex = '2147483646';
        this.style.overflow = 'visible';
        this.style.position = 'relative';
        this.style.width = '0px';
        this.style.height = '0px';
        this.style.display = 'block';

        // Створюємо Shadow DOM
        const shadow = this.attachShadow({ mode: 'open' });

        // Створюємо <html>
        const html = document.createElement('html');
        html.style.position = 'absolute';
        html.style.top = '0px';
        html.style.left = '0px';

        // <head>
        const head = document.createElement('head');

        // <body>
        const body = document.createElement('body');
        // Add Tailwind classes to body
        body.classList.add('bg-transparent');

        // Вставляємо елементи
        html.appendChild(head);
        html.appendChild(body);

        // Створюємо <style> для Tailwind та інших стилів
        const style = document.createElement('style');
        
        // Inject Tailwind base styles
        style.textContent = `
            @tailwind base;
            @tailwind components;
            @tailwind utilities;
        `;

        // Додаємо все в shadow root
        shadow.appendChild(html);
        shadow.appendChild(style);
        
        // Create link elements for CSS files
        this.injectCssLink('/src/app.css', shadow);
        this.injectCssLink('/entrypoints/content/app.css', shadow);
        this.injectCssLink('/entrypoints/content/style.scss', shadow);
        this.injectCssLink('/entrypoints/shared/components/ModalDraggable/index.css', shadow);
    }
    
    // Helper method to inject CSS links into shadow DOM
    injectCssLink(href, shadow) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        shadow.querySelector('html > head').appendChild(link);
    }
}

customElements.define('hover-inspector', HoverInspector);

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('hover-inspector');
    const wrapper = document.createElement('div');

    container!.shadowRoot!.children[0].children[1].append(wrapper);

    const root = createRoot(wrapper);

    root.render(<App shadowRoot={container!.shadowRoot!.children[0]}/>);
});