import Zt from '../core/Zt';

const styleRules = [
    'padding-right', 'padding-left', 'padding-top', 'padding-bottom',
    'margin-right', 'margin-left', 'margin-top', 'margin-bottom',
    'height', 'width', 'font-size'
];

const getStyle = (oElm, strCssRule) => {
    var strValue = "";
    if (document.defaultView && document.defaultView.getComputedStyle) {
        strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
    }
    else if (oElm.currentStyle) {
        strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
            return p1.toUpperCase();
        });
        strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
};

const getStyleByNode = (nodeEl) => {
    return styleRules.reduce((options, ruleName) => {
            options[ruleName] = getStyle(nodeEl, ruleName);
            return options
        },
        {}
    )
};

const boundingElRect = {
    selected: null,
    hovered: null
};

const addBoundingElRect = (type, data) => {
    boundingElRect[type] = data;
};

const getBoundingElRect = type => {
    return boundingElRect[type] && boundingElRect[type].clientRect
};


const getTargetElByType = type => {
    return boundingElRect[type] && boundingElRect[type].target;
};

// Zt.addToRender(boxTypes.selected.all);


Zt.stateChange((state) => {
    if (state.action === 'hover') {
        addBoundingElRect('hovered', {
            target: state.hoverElement,
            clientRect: state.clientRectHoveredNode
        });
    }

    if (state.action === 'select') {
        addBoundingElRect('selected', {
            target: state.clickedElement,
            clientRect: state.clientRectNode
        });
    }

    if (state.action === 'scroll') {
        addBoundingElRect('selected', {
            target: state.selectedNode,
            clientRect: state.clientRectSelectedNode
        });

        addBoundingElRect('hovered', {
            target: state.hoveredNode,
            clientRect: state.clientRectHoveredNode
        });
    }
});

export const DOMModule = {
    getStyleByNode,
    addBoundingElRect,
    getTargetElByType,
    getBoundingElRect
};
