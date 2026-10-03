/**
 * The <body> inside the extension's shadow root: antd popups (Popconfirm, Popover...) must render there,
 * or they end up in the page's document without the extension's styles
 */
export const shadowBody = (): HTMLElement =>
  // @ts-ignore
  (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!;
