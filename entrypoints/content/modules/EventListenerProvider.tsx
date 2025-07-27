import React, { useCallback, useLayoutEffect } from "react";
import { useDispatch } from "react-redux";

import PopupSettingModel from "@entrypoints/core/Models/PopupSettingModel";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager";
import {
  onUserEventHoverWatcher,
  onUserEventSelectWatcher,
} from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { userEventScrollConfirm } from "@entrypoints/content/store/app/app.slice";

let preNodeTarget: any = null;
let originalOutlines: Map<HTMLElement, string> = new Map();
const HEIGHT_LITE_CLASS_NAME = "zTool-height-lite-indicator";
const OUTLINE_CLASS_NAME = "zTool-element-outline";

function hasAppClass(node: any) {
  return (
    (typeof node.className === "string" && node.className.includes("zTool")) || node.localName === "hover-inspector"
  );
}

function addHeightLiteStyleToDom() {
  // Check if the style already exists
  if (document.getElementById(HEIGHT_LITE_CLASS_NAME)) {
    return; // Style already exists, no need to add it again
  }

  // Create the style element
  const styleElement = document.createElement("style");
  styleElement.id = HEIGHT_LITE_CLASS_NAME;

  // Define the CSS for height visualization
  const css = `
        .${HEIGHT_LITE_CLASS_NAME} {
            
        }
        .${HEIGHT_LITE_CLASS_NAME}::after {
            content: attr(data-height);
            position: sticky;
            top: 0;
            right: 0;
            background-color: rgba(0, 128, 255, 0.7);
            color: white;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 2px;
            pointer-events: none;
            z-index: 9999;
        }
    `;

  // Add the CSS to the style element
  styleElement.textContent = css;

  // Add the style element to the document head
  document.head.appendChild(styleElement);
}

function addOutlineStyleToDom() {
  // Check if the style already exists
  if (document.getElementById(OUTLINE_CLASS_NAME)) {
    return; // Style already exists, no need to add it again
  }

  // Create the style element with a unique name
  const styleElement = document.createElement("style");
  styleElement.id = OUTLINE_CLASS_NAME;

  // Define the CSS for element outlines
  const css = `
        .${OUTLINE_CLASS_NAME} {
            outline: 1px dashed rgba(255, 165, 0, 0.7) !important;
            outline-offset: 1px !important;
        }
    `;

  // Add the CSS to the style element
  styleElement.textContent = css;

  // Add the style element to the document head
  document.head.appendChild(styleElement);
}

function showOutlinesOnAllElements() {
  addHeightLiteStyleToDom();

  const elements = document.querySelectorAll("*");

  elements.forEach((element: any) => {
    if (hasAppClass(element)) {
      return;
    }

    if (originalOutlines.has(element)) {
      return;
    }
    originalOutlines.set(element, element.style.outline);

    element.classList.add(HEIGHT_LITE_CLASS_NAME);
    element.setAttribute("data-height", `${element.offsetHeight}px`);
  });
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

  // Show outlines on all elements if showAllBorders is enabled
  if (PopupSettingModel.showAllBorders) {
    debugger;
    showOutlinesOnAllElements();
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

  // If isSingleSelect is true, we only update candidateToSelectedElement
  // If isSingleSelect is false, we can have multiple selected elements (not implemented yet)
  if (PopupSettingModel.isSingleSelect) {
    DomNodeManager.update({ candidateToSelectedElement });

    return;
  } else {
    // For now, we'll use the same behavior as single select
    // In the future, this could be extended to support multiple selections
    DomNodeManager.update({ candidateToSelectedElement });
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

  const onMouseUp = useCallback((e: any) => onHandlerMouseUp(e), []);
  const onClick = useCallback((e: any) => onHandlerClick(e), []);
  const onScroll = useCallback((e: any) => dispatch(userEventScrollConfirm()), []);
  const onInputMove = useCallback((e: any) => onHandlerInputMove(e, dispatch), []);
  const onMouseDown = useCallback((e: any) => onHandlerMouseDown(e, dispatch), []);
  const onInput = useCallback((e: any) => onHandlerInput(e), []);
  const onChange = useCallback((e: any) => onHandlerChange(e), []);

  useLayoutEffect(() => {
    window.addEventListener("mousemove", onInputMove, { capture: true });
    window.addEventListener("mouseup", onMouseUp, { capture: true });
    window.addEventListener("mousedown", onMouseDown, { capture: true });
    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("scroll", onScroll, { capture: true });
    window.addEventListener("input", onInput, { capture: true });
    window.addEventListener("change", onChange, { capture: true });

    return () => {
      window.removeEventListener("mousemove", onInputMove, { capture: true });
      window.removeEventListener("mousedown", onMouseDown, { capture: true });
      window.removeEventListener("mouseup", onMouseUp, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("input", onInput, { capture: true });
      window.removeEventListener("change", onChange, { capture: true });
    };
  }, []);

  return null;
};

export default EventListenerProvider;
