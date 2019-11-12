import Zt from './core/Zt';
import {BoxModule} from "./modules/box.module";
import {InfoTopBarModule} from "./modules/info-top-bar.module";
import {DistanceLineAndLabelModule} from "./modules/distance-line-and-label.module";
import {DOMModule} from "./modules/dom.module";
import {BoxLabelsModule} from "./modules/box-labels.module";

let position = 'top';


// function getQuerySelector(elem) {
//     var element = elem;
//     var str = "";
//
//     function loop(element) {
//         // stop here = element has ID
//         if (element.getAttribute("id")) {
//             str = str.replace(/^/, " #" + element.getAttribute("id"));
//             str = str.replace(/\s/, "");
//             str = str.replace(/\s/g, " > ");
//             return str;
//         }
//         // stop here = element is body
//         if (document.body === element) {
//             str = str.replace(/^/, " body");
//             str = str.replace(/\s/, "");
//             str = str.replace(/\s/g, " > ");
//             return str;
//         }
//
//         // concat all classes in "queryselector" style
//         if (element.getAttribute("class")) {
//             var elemClasses = ".";
//             elemClasses += element.getAttribute("class");
//             elemClasses = elemClasses.replace(/\s/g, ".");
//             elemClasses = elemClasses.replace(/^/g, " ");
//             var classNth = "";
//
//             // check if element class is the unique child
//             var childrens = element.parentNode.children;
//
//             if (childrens.length < 2) {
//                 return;
//             }
//             var similarClasses = [];
//
//             for (var i = 0; i < childrens.length; i++) {
//                 if (element.getAttribute("class") ==
//                     childrens[i].getAttribute("class")) {
//                     similarClasses.push(childrens[i]);
//                 }
//             }
//             if (similarClasses.length > 1) {
//                 for (var j = 0; j < similarClasses.length; j++) {
//                     if (element === similarClasses[j]) {
//                         j++;
//                         classNth = ":nth-of-type(" + j + ")";
//                         break;
//                     }
//                 }
//             }
//             str = str.replace(/^/, elemClasses + classNth);
//         } else {
//             // get nodeType
//             var name = element.nodeName;
//             name = name.toLowerCase();
//             var nodeNth = "";
//
//             var childrens = element.parentNode.children;
//
//             if (childrens.length > 2) {
//                 var similarNodes = [];
//
//                 for (var i = 0; i < childrens.length; i++) {
//                     if (element.nodeName == childrens[i].nodeName) {
//                         similarNodes.push(childrens[i]);
//                     }
//                 }
//                 if (similarNodes.length > 1) {
//                     for (var j = 0; j < similarNodes.length; j++) {
//                         if (element === similarNodes[j]) {
//                             j++;
//                             nodeNth = ":nth-of-type(" + j + ")";
//                             break;
//                         }
//                     }
//                 }
//             }
//             str = str.replace(/^/, " " + name + nodeNth);
//         }
//
//         if (element.parentNode) {
//             loop(element.parentNode);
//         } else {
//             str = str.replace(/\s/g, " > ");
//             str = str.replace(/\s/, "");
//             return str;
//         }
//
//     }
//
//     loop(element);
//
//     return str;
//
//
// }

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
    if (paused)
        return;

    if (!dimensions)
        return;

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
