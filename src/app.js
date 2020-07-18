import {BoxModule} from "./modules/box.module";
import {DOMModule} from "./modules/dom.module";

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

    // BoxLabelsModule.labelParams('hovered', clientRect);
    DOMModule.addBoundingElRect('hovered', {
        target: hoverElement,
        clientRect: clientRectHoveredNode
    });

    Zt.emitStateChange({
        action: 'hover',
        clientRectHoveredNode,
        position,
        hoverElement,
        hoverNodeParams
    });
}

function onScroll(e) {
    let selectedNode = DOMModule.getTargetElByType('selected');
    if (!selectedNode) {
        selectedNode = DOMModule.getTargetElByType('hovered');

        const clientRectHoveredNode = selectedNode.getBoundingClientRect();
        const selectedNodeParams = DOMModule.getStyleByNode(selectedNode);
        Zt.emitStateChange({
            action: 'scrollSimple',
            position,
            clientRectHoveredNode,
            hoverNodeParams: selectedNodeParams,
        });

        return;
    }

    const clientRectSelectedNode = selectedNode.getBoundingClientRect();

    const hoveredNode = DOMModule.getTargetElByType('hovered');
    const clientRectHoveredNode = hoveredNode.getBoundingClientRect();

    const hoverNodeParams = DOMModule.getStyleByNode(hoveredNode);

    Zt.emitStateChange({
        action: 'scroll',
        position,
        selectedNode,
        clientRectSelectedNode,
        hoveredNode,
        clientRectHoveredNode,
        hoverNodeParams
    });
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

    Zt.emitStateChange({
        action: 'select',
        event: e,
        clientRectNode,
        clickedElement,
        position,
        selectedNodeParams,
    });


    // Zt.port.postMessage({
    //     actionType: 'highlightNode',
    //     data: getQuerySelector(clickedElement)
    // });
}

function showDimensions(dimensions, paused) {
    addEventHandler();

    BoxModule.toggleAllBoxes('show');
    BoxModule.toggleAllBoxes('show');
}

function addEventHandler() {
    window.addEventListener('mousemove', onInputMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('scroll', onScroll);

    const all = document.body.getElementsByTagName('*');
    Array.from(all).forEach(el => el.addEventListener('click', Zt.helpers.preventOnClick));
}

function destroy(connectionClosed) {
    const all = document.body.getElementsByTagName('*');

    window.removeEventListener('mousemove', onInputMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('scroll', onScroll);

    Array.from(document.getElementsByClassName("zTool")).forEach(el => el.remove());
    Array.from(all).forEach(el => el.removeEventListener('click', Zt.helpers.preventOnClick));
}

export const App = {
    addEventHandler,
    destroy,
    showDimensions
};
