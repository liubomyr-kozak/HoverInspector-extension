import React, {useEffect} from 'react';
import {useStateValue} from "./appState";
import Zt from "./old/webpage/core/Zt";
import {DOMModule} from "./old/webpage/modules/dom.module";

let position = 'top';

function onInputMove(e) {
  const hoverElement = e.target;
  // in SVG className is Object

  if (typeof hoverElement.className === 'string'
    && hoverElement.className.indexOf('zToolOptionToggleIcon') >= 0) {
    position = position === 'bottom' ? 'top' : 'bottom';
  }

  if (typeof hoverElement.className === 'string'
    && hoverElement.className.indexOf('zTool') >= 0
    && hoverElement.className.indexOf('zToolInfoBoxContainer') <= 0
    && hoverElement.className.indexOf('zToolOptionToggleIcon') < 0) {
    return true;
  }

  const clientRectHoveredNode = hoverElement.getBoundingClientRect();
  const hoverNodeParams = DOMModule.getStyleByNode(hoverElement);

  return {
    type: 'hover',
    clientRectHoveredNode,
    position,
    hoverElement,
    hoverNodeParams
  }
}

function onScroll(e) {
  let selectedNode = DOMModule.getTargetElByType('selected');
  if (!selectedNode) {
    selectedNode = DOMModule.getTargetElByType('hovered');

    const clientRectHoveredNode = selectedNode.getBoundingClientRect();
    const selectedNodeParams = DOMModule.getStyleByNode(selectedNode);

    return {
      type: 'scrollSimple',
      position,
      clientRectHoveredNode,
      hoverNodeParams: selectedNodeParams,
    };
  }

  const clientRectSelectedNode = selectedNode.getBoundingClientRect();

  const hoveredNode = DOMModule.getTargetElByType('hovered');
  const clientRectHoveredNode = hoveredNode.getBoundingClientRect();

  const hoverNodeParams = DOMModule.getStyleByNode(hoveredNode);

  return {
    type: 'scroll',
    position,
    selectedNode,
    clientRectSelectedNode,
    hoveredNode,
    clientRectHoveredNode,
    hoverNodeParams
  }
}

function onMouseDown(e) {
  const clickedElement = e.target;

  // in SVG className is Object
  if (typeof clickedElement.className === 'string'
    && clickedElement.className.indexOf('zTool') >= 0) {


    return true;
  }
  const clientRectNode = clickedElement.getBoundingClientRect();
  const selectedNodeParams = DOMModule.getStyleByNode(clickedElement);

  return {
    type: 'select',
    event: e,
    clientRectNode,
    clickedElement,
    position,
    selectedNodeParams,
  }

  // Zt.port.postMessage({
  //     actionType: 'highlightNode',
  //     data: getQuerySelector(clickedElement)
  // });
}

export const EventListenerProvider = ({children}) => {
  const [state, dispatch] = useStateValue();

  const onInputMoveListener = (e) => dispatch(onInputMove(e));
  const onMouseDownListener = (e) => dispatch(onMouseDown(e));
  const onScrollListener = (e) => dispatch(onScroll(e));

  useEffect(() => {
    const all = document.body.getElementsByTagName('*');

    if (state.isActive) {
      window.addEventListener('mousemove', onInputMoveListener);
      window.addEventListener('mousedown', onMouseDownListener);
      window.addEventListener('scroll', onScrollListener);

      Array.from(all).forEach(el => el.addEventListener('click', Zt.helpers.preventOnClick));
    }

    if (!state.isActive) {
      window.removeEventListener('mousemove', onInputMoveListener);
      window.removeEventListener('mousedown', onMouseDownListener);
      window.removeEventListener('scroll', onScrollListener);

      Array.from(document.getElementsByClassName("zTool")).forEach(el => el.remove());
      Array.from(all).forEach(el => el.removeEventListener('click', Zt.helpers.preventOnClick));
    }
  }, [state.isActive])

  return (<>{children}</>)
}
