/**
 * The <body> inside the extension's shadow root. Pass it as `getPopupContainer` to antd overlays
 * (Select, Popover, Popconfirm, Dropdown) that must render inside the panel: in the page's document
 * they lose the extension's styles. Typed for antd, so no `@ts-ignore` is needed at the call site.
 */
export const shadowBody = (): HTMLElement => {
  const root = document.querySelector("hover-inspector")?.shadowRoot;
  // document.body only before the UI is mounted, when no overlay can be open yet
  return root?.querySelector<HTMLElement>("html > body") ?? document.body;
};
