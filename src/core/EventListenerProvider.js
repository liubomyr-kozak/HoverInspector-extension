import React, {useEffect} from 'react';
import {useStateValue} from "./appState";
import {DOMModule} from "./dom.js";

let preNodeTarget = null
let countRepeat = 0

function onInputMove(e) {
  const hoverElement = e.target;
  // in SVG className is Object

  if(preNodeTarget !== hoverElement){
    preNodeTarget = hoverElement;
    countRepeat = 0;
  } else if (countRepeat < 1) { // I need get height of hovered element, this is very fast dirty hack
      countRepeat++;
  } else {
    return {}
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
    hoverElement,
    hoverNodeParams
  }
}

function onScroll(e) {
  let selectedNode = DOMModule.getTargetElByType('selected');

  if (!selectedNode) {
    selectedNode = DOMModule.getTargetElByType('hovered');

    const clientRectSelectedNode = selectedNode.getBoundingClientRect();
    const hoveredNode = DOMModule.getTargetElByType('hovered');
    const selectedNodeParams = DOMModule.getStyleByNode(selectedNode);
    const clientRectHoveredNode = hoveredNode.getBoundingClientRect();


    return {
      type: 'scrollWithoutSelected',
      clientRectSelectedNode,
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
  const clientRectSelectedNode = clickedElement.getBoundingClientRect();
  const selectedNodeParams = DOMModule.getStyleByNode(clickedElement);

  return {
    type: 'select',
    event: e,
    clientRectSelectedNode,
    clickedElement,
    selectedNodeParams,
  }
}

const preventOnClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
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

      Array.from(all).forEach(el => el.addEventListener('click', preventOnClick));
    }

    if (!state.isActive) {
      window.removeEventListener('mousemove', onInputMoveListener);
      window.removeEventListener('mousedown', onMouseDownListener);
      window.removeEventListener('scroll', onScrollListener);

      Array.from(document.getElementsByClassName("zTool")).forEach(el => el.remove());
      Array.from(all).forEach(el => el.removeEventListener('click', preventOnClick));
    }
  }, [state.isActive])

  return (<>{children}</>)
}
