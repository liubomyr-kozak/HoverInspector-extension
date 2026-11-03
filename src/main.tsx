import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/src/app.tsx";
// Import CSS directly in main.tsx
import "@entrypoints/content/style.css";

// this need only for dev mode, this is not a common practice for production
class HoverInspector extends HTMLElement {
  constructor() {
    super();

    // Add the required attributes and styles to <hover-inspector> itself
    this.setAttribute("data-wxt-shadow-root", "");
    this.style.zIndex = "2147483646";
    this.style.overflow = "visible";
    this.style.position = "absolute";
    this.style.top = "0px";
    this.style.left = "0px";
    this.style.width = "0px";
    this.style.height = "0px";
    this.style.display = "block";

    // Create the Shadow DOM
    const shadow = this.attachShadow({ mode: "open" });

    // Create <html>
    const html = document.createElement("html");
    // html.style.position = "absolute";
    // html.style.top = "0px";
    // html.style.left = "0px";

    // <head>
    const head = document.createElement("head");

    // <body>
    const body = document.createElement("body");
    // Add Tailwind classes to body
    body.classList.add("bg-transparent");

    // Insert the elements
    html.appendChild(head);
    html.appendChild(body);

    // Create <style> for Tailwind and other styles
    const style = document.createElement("style");

    // Inject Tailwind base styles
    style.textContent = `
            @tailwind base;
            @tailwind components;
            @tailwind utilities;
        `;

    // Add everything to the shadow root
    shadow.appendChild(html);
    shadow.appendChild(style);

    // Create link elements for CSS files
    this.injectCssLink("/src/app-src.css", shadow);
    this.injectCssLink("/entrypoints/content/style.css", shadow);
    this.injectCssLink("/entrypoints/shared/components/ModalDraggable/index.css", shadow);
  }

  // Helper method to inject CSS links into shadow DOM
  injectCssLink(href, shadow) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    shadow.querySelector("html > head").appendChild(link);
  }
}

customElements.define("hover-inspector", HoverInspector);

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("hover-inspector");
  const wrapper = document.createElement("div");

  container!.shadowRoot!.children[0].children[1].append(wrapper);

  const root = createRoot(wrapper);

  root.render(<App shadowRoot={container!.shadowRoot!.children[0]} />);
});
