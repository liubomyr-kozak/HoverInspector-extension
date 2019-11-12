import Zt from '../core/Zt';

const boxTypes = {
    selected: {},
    hovered: {},
    containerPadding: (() => {
        const node = document.createElement('div');
        node.className = 'zToolTooltipPadding';
        return node
    })(),
    containerMargin: (() => {
        const node = document.createElement('div');
        node.className = 'zToolTooltipMargin';
        return node
    })()
};

const createBox = () => {
    const reducer = (boxObject, vector) => {
        boxObject[vector] = document.createElement('div');
        boxObject['all'].push(boxObject[vector]);
        return boxObject
    };
    return ['x', 'x1', 'y', 'y1'].reduce(reducer, {all: []})
};

const registerBox = (boxType, box) => {
    boxTypes[boxType] = box;
    boxTypes[boxType].isDisplay = false;
};

const hoverBoxSetParams = (params, hoverNodeParams) => {
    markBoxAsHover(boxTypes.hovered.all);
    setParamsToNode('hovered', params);

    setPadding(params, hoverNodeParams);
    setMargin(params, hoverNodeParams);
};

const setParamsToSelected = (params) => {
    setParamsToNode('selected', params)
};


const setPadding = ({top, bottom, right, left, height, width}, hoverNodeParams) => {
    if (hoverNodeParams) {
        boxTypes.containerPadding.style.top = `${top}px`;
        boxTypes.containerPadding.style.left = `${left}px`;
        boxTypes.containerPadding.style.width = `${width}px`;
        boxTypes.containerPadding.style.height = `${height}px`;

        boxTypes.containerPadding.style.borderTopWidth = `${hoverNodeParams['padding-top']}`;
        boxTypes.containerPadding.style.borderBottomWidth = `${hoverNodeParams['padding-bottom']}`;
        boxTypes.containerPadding.style.borderLeftWidth = `${hoverNodeParams['padding-left']}`;
        boxTypes.containerPadding.style.borderRightWidth = `${hoverNodeParams['padding-right']}`;
    }
};

const setMargin = ({top, bottom, right, left, height, width}, hoverNodeParams) => {
    if (hoverNodeParams) {
        const topBorder = parseInt(hoverNodeParams['margin-top']);
        const leftBorder = parseInt(hoverNodeParams['margin-left']);
        const rightBorder = parseInt(hoverNodeParams['margin-right']);
        const bottomBorder = parseInt(hoverNodeParams['margin-bottom']);

        boxTypes.containerMargin.style.top = `${top - topBorder}px`;
        boxTypes.containerMargin.style.left = `${left - leftBorder}px`;
        boxTypes.containerMargin.style.width = `${width + leftBorder + rightBorder + 1}px`;
        boxTypes.containerMargin.style.height = `${height + topBorder + bottomBorder + 1}px`;


        boxTypes.containerMargin.style.borderTopWidth = `${hoverNodeParams['margin-top']}`;
        boxTypes.containerMargin.style.borderBottomWidth = `${hoverNodeParams['margin-bottom']}`;
        boxTypes.containerMargin.style.borderLeftWidth = `${hoverNodeParams['margin-left']}`;
        boxTypes.containerMargin.style.borderRightWidth = `${hoverNodeParams['margin-right']}`;
    }
};

const setParamsToNode = (nodeType, {top, bottom, right, left, height, width}) => {
    boxTypes[nodeType].x.style.top = `${top}px`;
    boxTypes[nodeType].x.style.left = `${right}px`;
    boxTypes[nodeType].x.style.width = "1px";
    boxTypes[nodeType].x.style.height = `${height}px`;

    boxTypes[nodeType].x1.style.top = `${top}px`;
    boxTypes[nodeType].x1.style.left = `${left}px`;
    boxTypes[nodeType].x1.style.width = "1px";
    boxTypes[nodeType].x1.style.height = `${height}px`;

    boxTypes[nodeType].y.style.top = `${top}px`;
    boxTypes[nodeType].y.style.left = `${left}px`;
    boxTypes[nodeType].y.style.width = `${width}px`;
    boxTypes[nodeType].y.style.height = "1px";

    boxTypes[nodeType].y1.style.top = `${bottom}px`;
    boxTypes[nodeType].y1.style.left = `${left}px`;
    boxTypes[nodeType].y1.style.width = `${width}px`;
    boxTypes[nodeType].y1.style.height = "1px";
};

const changeHoverBoxToSelect = () => {
    const oldSelected = boxTypes.selected;
    const oldHovered = boxTypes.hovered;

    boxTypes.hovered = oldSelected;
    boxTypes.selected = oldHovered;

    markBoxAsSelected(boxTypes.selected.all);
};

const markBoxAsHover = (boxArr) => {
    boxArr.forEach(el => el.className = 'zToolBoxBoxHover');
};

const markBoxAsSelected = (boxArr) => {
    boxArr.forEach(el => el.className = 'zToolBoxBoxSelected');
};

const getBoxByType = boxType => {
    return boxTypes[boxType];
};

const toggleAllBoxes = flag => {
    boxTypes.selected.isDisplay = false;
    boxTypes.hovered.isDisplay = false;

    boxTypes.hovered.all.forEach(el => el.style.display = flag === 'hide' ? 'none' : 'block');
    boxTypes.selected.all.forEach(el => el.style.display = flag === 'hide' ? 'none' : 'block');
};


registerBox('hovered', createBox());
registerBox('selected', createBox());

Zt.addToRender(boxTypes.hovered.all);
Zt.addToRender(boxTypes.selected.all);
Zt.addToRender(boxTypes.containerPadding);
Zt.addToRender(boxTypes.containerMargin);


Zt.stateChange((state) => {

    if (state.action === 'hover') {
        hoverBoxSetParams(
            state.clientRectHoveredNode,
            state.hoverNodeParams
        );
    }

    if (state.action === 'select') {
        changeHoverBoxToSelect();
        setParamsToSelected(state.clientRectNode);
        hoverBoxSetParams(
            state.clientRectNode,
            state.hoverNodeParams
        );
    }
    if (state.action === 'scroll') {
        setParamsToSelected(state.clientRectSelectedNode);
        hoverBoxSetParams(
            state.clientRectHoveredNode,
            state.hoverNodeParams,
        );
    }

    if (state.action === 'scrollSimple') {
        hoverBoxSetParams(
            state.clientRectHoveredNode,
            state.hoverNodeParams
        );
    }
});


export const BoxModule = {
    toggleAllBoxes
};
