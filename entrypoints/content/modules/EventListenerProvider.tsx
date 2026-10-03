import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import PopupSettingModel from "@entrypoints/core/Models/PopupSettingModel";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager";
import {
  onUserEventHoverWatcher,
  onUserEventSelectWatcher,
} from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { userEventScrollConfirm } from "@entrypoints/content/store/app/app.slice";
import { mapRectFromWindow, watchSameOriginFrames } from "@entrypoints/shared/utils/frames";
import { setLastPointer } from "@entrypoints/content/modules/Popup/pointer";
import { setAllBordersVisible } from "@entrypoints/shared/utils/allBorders";
import { RemoteFrameNode } from "@entrypoints/shared/frameAgent/remoteNode";
import { startFrameAgentHost } from "@entrypoints/content/frameAgentHost";

let preNodeTarget: any = null;

function hasAppClass(node: any) {
  return (
    (typeof node.className === "string" && node.className.includes("hover-inspector")) || node.localName === "hover-inspector"
  );
}

const onHandlerInputMove = (e: any, dispatch: any) => {
  // if (!PopupSettingModel.isHandleDomInspector) return;

  const candidateToHoverElement = e.target;

  // Inside a same-origin iframe: the top window's pointer tracking doesn't see this move
  if (e.view && e.view !== window) {
    const point = mapRectFromWindow(e.view, { left: e.clientX, top: e.clientY, width: 0, height: 0 });
    setLastPointer(point.left, point.top);
  }

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

/** The pointer moved to another element inside a cross-origin frame (reported by its frame agent) */
const onRemoteHover = (node: RemoteFrameNode, pointer: { x: number; y: number } | null, dispatch: any) => {
  if (pointer) setLastPointer(pointer.x, pointer.y);
  preNodeTarget = node;
  DomNodeManager.update({ anyHoveredElement: node });
  DomNodeManager.update({ candidateToHoverElement: node });
  dispatch(onUserEventHoverWatcher.getPayload());
};

/** Mouse down inside a cross-origin frame; the agent already blocked the click if asked to */
const onRemoteSelect = (node: RemoteFrameNode, dispatch: any) => {
  DomNodeManager.update({ candidateToSelectedElement: node });
  if (PopupSettingModel.isSingleSelect) return;
  dispatch(onUserEventSelectWatcher.getPayload());
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
  const preventDefault = useSelector((state: any) => !!state.app?.preventDefault);
  const frameAgentHost = useRef<ReturnType<typeof startFrameAgentHost> | null>(null);

  useEffect(() => {
    if (!showAllBorders) return;
    // The outlines go into same-origin frames too (cross-origin ones: their frame agent, below)
    setAllBordersVisible(document, true);
    const stopWatchingFrames = watchSameOriginFrames((frameWindow) => {
      setAllBordersVisible(frameWindow.document, true);
      return () => setAllBordersVisible(frameWindow.document, false);
    });
    return () => {
      setAllBordersVisible(document, false);
      stopWatchingFrames();
    };
  }, [showAllBorders]);

  useEffect(() => {
    frameAgentHost.current?.setSettings({ preventDefault, showAllBorders });
  }, [preventDefault, showAllBorders]);

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

    // Cross-origin iframes: a frame agent inside reports hover/click/scroll (started lazily, on the
    // first such frame)
    const host = startFrameAgentHost(
      {
        onHover: (node, pointer) => onRemoteHover(node, pointer, dispatch),
        onSelect: (node) => onRemoteSelect(node, dispatch),
        onUpdate: () => dispatch(userEventScrollConfirm()),
      },
      { preventDefault: PopupSettingModel.preventDefault, showAllBorders: false },
    );
    frameAgentHost.current = host;

    const listenWithFrameAgents = (target: Window) => {
      const unlisten = listen(target);
      const unlistenAgents = host.listenWindow(target);
      return () => {
        unlisten();
        unlistenAgents();
      };
    };

    const unlistenTop = listenWithFrameAgents(window);
    // Same-origin iframes: their events never reach the top window, so hover/click/scroll are taken
    // from each frame's own window. Rects are mapped back to the top viewport by DomNodeManager.
    const stopWatchingFrames = watchSameOriginFrames(listenWithFrameAgents, host.noteCrossOriginFrame);

    return () => {
      unlistenTop();
      stopWatchingFrames();
      host.stop();
      frameAgentHost.current = null;
    };
  }, []);

  return null;
};

export default EventListenerProvider;
