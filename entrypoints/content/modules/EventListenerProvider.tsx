import React, { useCallback, useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import PopupSettingModel from "@entrypoints/core/Models/PopupSettingModel";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager";
import {
  onUserEventHoverWatcher,
  onUserEventSelectWatcher,
} from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { userEventScrollConfirm } from "@entrypoints/content/store/app/app.slice";
import { watchSameOriginFrames } from "@entrypoints/shared/utils/frames";

let preNodeTarget: any = null;
const OUTLINE_STYLE_ID = "hover-inspector-element-outline";

function hasAppClass(node: any) {
  return (
    (typeof node.className === "string" && node.className.includes("hover-inspector")) || node.localName === "hover-inspector"
  );
}

/**
 * "Show All Borders": outlines every page element with a single stylesheet. Outlines take no
 * space, so the page layout stays the same, and removing the stylesheet restores the page exactly.
 */
function setAllBordersVisible(visible: boolean) {
  const existing = document.getElementById(OUTLINE_STYLE_ID);

  if (!visible) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const styleElement = document.createElement("style");
  styleElement.id = OUTLINE_STYLE_ID;
  styleElement.textContent = `
    body *:not(hover-inspector) {
      outline: 1px dashed rgba(255, 140, 0, 0.6) !important;
      outline-offset: -1px !important;
    }
  `;
  document.head.appendChild(styleElement);
}

const onHandlerInputMove = (e: any, dispatch: any) => {
  // if (!PopupSettingModel.isHandleDomInspector) return;

  const candidateToHoverElement = e.target;

  // in SVG className is Object
  const isHoveredNotTarget = preNodeTarget !== candidateToHoverElement;

  if (isHoveredNotTarget) {
    preNodeTarget = candidateToHoverElement;
  } else {
    return;
  }

  if (hasAppClass(candidateToHoverElement)) {
    return;
  }

  DomNodeManager.update({ anyHoveredElement: candidateToHoverElement });

  DomNodeManager.update({ candidateToHoverElement });

  // return dispatch({type: USER_EVENT_HOVER});
  return dispatch(onUserEventHoverWatcher.getPayload());
};

// // Функція повертає ще одну функцію (це важливо!)
// const onHandlerClick = (e: any) => () => {
// // e - подія кліку (click event), яка передана як параметр зовнішньої функції.
const onHandlerClick = (e: any) => {
  if (PopupSettingModel.preventDefault && !hasAppClass(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation && e.nativeEvent.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopImmediatePropagation && e.nativeEvent.stopImmediatePropagation();
    e.stopImmediatePropagation();
  }
};

const onHandlerMouseUp = (e: any) => {
  if (PopupSettingModel.preventDefault && !hasAppClass(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation && e.nativeEvent.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopImmediatePropagation && e.nativeEvent.stopImmediatePropagation();
    e.stopImmediatePropagation();
  }
};

const onHandlerMouseDown = (e: any, dispatch: any) => {
  if (PopupSettingModel.preventDefault && !hasAppClass(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation && e.nativeEvent.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopImmediatePropagation && e.nativeEvent.stopImmediatePropagation();
    e.stopImmediatePropagation();
  }

  const candidateToSelectedElement = e.target;

  // if (!PopupSettingModel.isHandleDomInspector) return

  // in SVG className is Object
  if (hasAppClass(e.target)) {
    return true;
  }

  // схоже що не потрібно перевіряти на клас.. так як додакто знаходиться в shadowRoot цього достатньо
  // candidateToSelectedElement завжди буде вказувати на shadowRoot
  if (candidateToSelectedElement?.localName === "hover-inspector") {
    return true;
  }

  DomNodeManager.update({ candidateToSelectedElement });

  // "Hover only" mode: the panel follows the hovered element and clicks don't select
  if (PopupSettingModel.isSingleSelect) {
    return;
  }

  return dispatch(onUserEventSelectWatcher.getPayload());
};

// Handler for input events (typing in text fields)
const onHandlerInput = (e: any) => {
  if (hasAppClass(e.target)) {
    return;
  }
};

// Handler for change events (selecting options from dropdowns)
const onHandlerChange = (e: any) => {
  if (hasAppClass(e.target)) {
    return;
  }
};

const EventListenerProvider: React.FC = () => {
  const dispatch = useDispatch();
  const showAllBorders = useSelector((state: any) => !!state.app?.showAllBorders);

  useEffect(() => {
    setAllBordersVisible(showAllBorders);
    return () => setAllBordersVisible(false);
  }, [showAllBorders]);

  const onMouseUp = useCallback((e: any) => onHandlerMouseUp(e), []);
  const onClick = useCallback((e: any) => onHandlerClick(e), []);
  const onScroll = useCallback((e: any) => dispatch(userEventScrollConfirm()), []);
  const onInputMove = useCallback((e: any) => onHandlerInputMove(e, dispatch), []);
  const onMouseDown = useCallback((e: any) => onHandlerMouseDown(e, dispatch), []);
  const onInput = useCallback((e: any) => onHandlerInput(e), []);
  const onChange = useCallback((e: any) => onHandlerChange(e), []);

  useLayoutEffect(() => {
    const listeners: Array<[string, (e: any) => void]> = [
      ["mousemove", onInputMove],
      ["mouseup", onMouseUp],
      ["mousedown", onMouseDown],
      ["click", onClick],
      ["scroll", onScroll],
      ["input", onInput],
      ["change", onChange],
    ];
    const listen = (target: Window) => {
      listeners.forEach(([type, listener]) => target.addEventListener(type, listener, { capture: true }));
      return () => listeners.forEach(([type, listener]) => target.removeEventListener(type, listener, { capture: true }));
    };

    const unlistenTop = listen(window);
    // Same-origin iframes: their events never reach the top window, so hover/click/scroll are taken
    // from each frame's own window. Rects are mapped back to the top viewport by DomNodeManager.
    const stopWatchingFrames = watchSameOriginFrames(listen);

    return () => {
      unlistenTop();
      stopWatchingFrames();
    };
  }, []);

  return null;
};

export default EventListenerProvider;
