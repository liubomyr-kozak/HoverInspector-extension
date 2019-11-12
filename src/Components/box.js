import React, {useRef, useEffect} from 'react';
import {useStateValue} from "../appState";
//
// const boxTypes = {
//     selected: {},
//     hovered: {},
//     containerPadding: (() => {
//         const node = document.createElement('div');
//         node.className = 'zToolTooltipPadding';
//         return node
//     })(),
//     containerMargin: (() => {
//         const node = document.createElement('div');
//         node.className = 'zToolTooltipMargin';
//         return node
//     })()
// };
//
// const createBox = () => {
//     const reducer = (boxObject, vector) => {
//         boxObject[vector] = document.createElement('div');
//         boxObject['all'].push(boxObject[vector]);
//         return boxObject
//     };
//     return ['x', 'x1', 'y', 'y1'].reduce(reducer, {all: []})
// };
//
// const registerBox = (boxType, box) => {
//     boxTypes[boxType] = box;
//     boxTypes[boxType].isDisplay = false;
// };
//
// const hoverBoxSetParams = (params, hoverNodeParams) => {
//   markBoxAsHover(boxTypes.hovered.all);
//   setParamsToNode('hovered', params);
//
//   setPadding(params, hoverNodeParams);
//   setMargin(params, hoverNodeParams);
// };
//
// const setParamsToSelected = (params) => {
//     setParamsToNode('selected', params)
// };
//
//
const setPadding = (containerPadding, {top, bottom, right, left, height, width}, hoverNodeParams) => {
  if (hoverNodeParams) {
    containerPadding.style.top = `${top}px`;
    containerPadding.style.left = `${left}px`;
    containerPadding.style.width = `${width}px`;
    containerPadding.style.height = `${height}px`;

    containerPadding.style.borderTopWidth = `${hoverNodeParams['padding-top']}`;
    containerPadding.style.borderBottomWidth = `${hoverNodeParams['padding-bottom']}`;
    containerPadding.style.borderLeftWidth = `${hoverNodeParams['padding-left']}`;
    containerPadding.style.borderRightWidth = `${hoverNodeParams['padding-right']}`;
  }
};
//
const setMargin = (containerMargin, {top, bottom, right, left, height, width}, hoverNodeParams) => {
  if (hoverNodeParams) {
    const topBorder = parseInt(hoverNodeParams['margin-top']);
    const leftBorder = parseInt(hoverNodeParams['margin-left']);
    const rightBorder = parseInt(hoverNodeParams['margin-right']);
    const bottomBorder = parseInt(hoverNodeParams['margin-bottom']);

    containerMargin.style.top = `${top - topBorder}px`;
    containerMargin.style.left = `${left - leftBorder}px`;
    containerMargin.style.width = `${width + leftBorder + rightBorder + 1}px`;
    containerMargin.style.height = `${height + topBorder + bottomBorder + 1}px`;

    containerMargin.style.borderTopWidth = `${hoverNodeParams['margin-top']}`;
    containerMargin.style.borderBottomWidth = `${hoverNodeParams['margin-bottom']}`;
    containerMargin.style.borderLeftWidth = `${hoverNodeParams['margin-left']}`;
    containerMargin.style.borderRightWidth = `${hoverNodeParams['margin-right']}`;
  }
};

const setParamsToNode = (nodeType, {top, bottom, right, left, height, width}) => {
  nodeType.x.current.style.top = `${top}px`;
  nodeType.x.current.style.left = `${right}px`;
  nodeType.x.current.style.width = "1px";
  nodeType.x.current.style.height = `${height}px`;

  nodeType.x1.current.style.top = `${top}px`;
  nodeType.x1.current.style.left = `${left}px`;
  nodeType.x1.current.style.width = "1px";
  nodeType.x1.current.style.height = `${height}px`;

  nodeType.y.current.style.top = `${top}px`;
  nodeType.y.current.style.left = `${left}px`;
  nodeType.y.current.style.width = `${width}px`;
  nodeType.y.current.style.height = "1px";

  nodeType.y1.current.style.top = `${bottom}px`;
  nodeType.y1.current.style.left = `${left}px`;
  nodeType.y1.current.style.width = `${width}px`;
  nodeType.y1.current.style.height = "1px";
};

// const changeHoverBoxToSelect = () => {
//     const oldSelected = boxTypes.selected;
//     const oldHovered = boxTypes.hovered;
//
//     boxTypes.hovered = oldSelected;
//     boxTypes.selected = oldHovered;
//
//     markBoxAsSelected(boxTypes.selected.all);
// };

const markBoxAsHover = (boxArr) => {
  boxArr.forEach(el => el.current.className = 'zToolBoxBoxHover');
};
//
const markBoxAsSelected = (boxArr) => {
  boxArr.forEach(el => el.current.className = 'zToolBoxBoxSelected');
};
//
// const getBoxByType = boxType => {
//     return boxTypes[boxType];
// };
//
// const toggleAllBoxes = flag => {
//     boxTypes.selected.isDisplay = false;
//     boxTypes.hovered.isDisplay = false;
//
//     boxTypes.hovered.all.forEach(el => el.style.display = flag === 'hide' ? 'none' : 'block');
//     boxTypes.selected.all.forEach(el => el.style.display = flag === 'hide' ? 'none' : 'block');
// };
//
//
// registerBox('hovered', createBox());
// registerBox('selected', createBox());
//
// Zt.addToRender(boxTypes.hovered.all);
// Zt.addToRender(boxTypes.selected.all);
// Zt.addToRender(boxTypes.containerPadding);
// Zt.addToRender(boxTypes.containerMargin);
//
//
// Zt.stateChange((state) => {
//
//     if (state.action === 'hover') {
//         hoverBoxSetParams(
//             state.clientRectHoveredNode,
//             state.hoverNodeParams
//         );
//     }
//
//     if (state.action === 'select') {
//         changeHoverBoxToSelect();
//         setParamsToSelected(state.clientRectNode);
//         hoverBoxSetParams(
//             state.clientRectNode,
//             state.hoverNodeParams
//         );
//     }
//     if (state.action === 'scroll') {
//         setParamsToSelected(state.clientRectSelectedNode);
//         hoverBoxSetParams(
//             state.clientRectHoveredNode,
//             state.hoverNodeParams,
//         );
//     }
//
//     if (state.action === 'scrollSimple') {
//         hoverBoxSetParams(
//             state.clientRectHoveredNode,
//             state.hoverNodeParams
//         );
//     }
// });
//
//
// export const BoxModule = {
//     toggleAllBoxes
// };


const createVectorNode = (id) => {
  const vectorRef = useRef(null);
  return {
    ref: vectorRef,
    node: <div ref={vectorRef} className={id}/>
  };
};

const CoordinatesLines = () => {
  const x = createVectorNode('x');
  const x1 = createVectorNode('x1');
  const y = createVectorNode('y');
  const y1 = createVectorNode('y1');

  return {
    refs: {
      x: x.ref,
      x1: x1.ref,
      y: y.ref,
      y1: y1.ref,
    },
    render: () => {
      return (<>
        {x.node}
        {x1.node}
        {y.node}
        {y1.node}
      </>)
    }
  }
}

export const Box = () => {
  const [state] = useStateValue();
  const paddingRef = useRef();
  const marginRef = useRef();
  const hovered = CoordinatesLines();
  const selected = CoordinatesLines();
  useEffect(() => {
    if (state.type === "hover") {
      markBoxAsHover([
        hovered.refs.x,
        hovered.refs.x,
        hovered.refs.y,
        hovered.refs.y1
      ]);
      setParamsToNode(hovered.refs, state.clientRectHoveredNode,);

      setPadding(paddingRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
      setMargin(marginRef.current, state.clientRectHoveredNode, state.hoverNodeParams);
    }
  }, [state]);

  return (
    <>
      {selected.render()}
      {hovered.render()}
      <div ref={paddingRef} className="zToolTooltipPadding"/>
      <div ref={marginRef} className="zToolTooltipMargin"/>
    </>
  )
}
