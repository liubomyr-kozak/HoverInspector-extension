import Zt from '../core/Zt';
import {DOMModule} from "./dom.module";

function crateInfoBoxes() {
    const optionSelection = document.createElement('div');
    optionSelection.className = 'zToolOptionSelection';
    optionSelection.innerHTML = `
            <span class="zToolOptionVersion">${window.extension.hoverInspector.version}</span> 
            <span class="zToolOptionToggleIcon"></spanclass>`;

    const hoveredInfoBox = document.createElement('div');
    hoveredInfoBox.className = 'zToolInfoBox zToolInfoBoxHoveredLabel';
    // hoveredInfoBox.style.background = '#4ba5ff';
    hoveredInfoBox.style.background = '#3498DB';
    hoveredInfoBox.style.display = 'none';

    const selectedInfoBox = document.createElement('div');
    selectedInfoBox.className = 'zToolInfoBox zToolInfoBoxSelectedLabel';
    // selectedInfoBox.style.background = '#ff5e2f';
    selectedInfoBox.style.background = '#CD6155';
    selectedInfoBox.style.display = 'none';


    const zToolInfoBoxContainer = document.createElement('div');
    zToolInfoBoxContainer.className = 'zToolInfoBoxContainer';

    [hoveredInfoBox, selectedInfoBox, optionSelection].forEach(el =>
        zToolInfoBoxContainer.appendChild(el));


    return {
        selectedInfoBox,
        hoveredInfoBox,
        container: zToolInfoBoxContainer,
        all: [zToolInfoBoxContainer]
    }
}

const boxes = crateInfoBoxes();

function updateInfoBoxDataByType(type, clientRect, cursorPosition, selectedNodeParams) {
    const infoBoxByType = type === 'hover' ? boxes.hoveredInfoBox : boxes.selectedInfoBox;

    const {top, bottom, right, left, height, width} = clientRect;
    const pr = selectedNodeParams;

    infoBoxByType.innerHTML = `
                &nbsp; ${type === 'hover' ? 'Hovered:' : 'Selected'} &nbsp;
                height:&nbsp;
                    <span class="zToolInfoBoxValueLabel">${Zt.helpers.ifNumberFloatCut(height)}px</span>
                &nbsp;  
                width:&nbsp;
                    <span class="zToolInfoBoxValueLabel">${Zt.helpers.ifNumberFloatCut(width)}px</span>
                &nbsp;  
                margin:&nbsp;
                    <span class="zToolInfoBoxValueLabel">${pr['margin-top']} ${pr['margin-left']} ${pr['margin-bottom']} ${pr['margin-right']}</span>
                &nbsp;
                padding:&nbsp;
                    <span class="zToolInfoBoxValueLabel">${pr['padding-top']} ${pr['padding-left']} ${pr['padding-bottom']} ${pr['padding-right']}</span>
                &nbsp;
                font-size:&nbsp;
                    <span class="zToolInfoBoxValueLabel">${pr['font-size']}</span>
                &nbsp;
             `;


    if (cursorPosition === 'bottom') {
        boxes.container.style.top = 'initial';
        boxes.container.style.bottom = 0;
    } else {
        boxes.container.style.top = 0;
        boxes.container.style.bottom = 'initial';
    }
}

function toggleBox(flag) {
    const infoBoxByType = flag === 'hover' ? boxes.hoveredInfoBox : boxes.selectedInfoBox;
    infoBoxByType.style.display = flag === 'hide' ? 'none' : 'block';
}

function toggleBoxes(flag) {
    boxes.container.style.display = flag === 'hide' ? 'none' : 'block';
}

let isDisplay = false;
Zt.addToRender(boxes.all);
Zt.stateChange((state) => {

    if (!isDisplay) {
        return;
    }

    if (state.action === 'hover') {
        toggleBox('hover');
        updateInfoBoxDataByType('hover', state.clientRectHoveredNode, state.position, state.hoverNodeParams);
    }

    if (state.action === 'select') {
        toggleBox('select');
        updateInfoBoxDataByType('select', state.clientRectNode, state.event.clientY, state.selectedNodeParams);
    }
});

export const InfoTopBarModule = {
    toggleBoxes,
    changeDisplayInfoBoxPanel: (value) => {
        isDisplay = value
    },
    isVisible: () => isDisplay,
    getLastUpdate: () => {
        if (isDisplay) {

            const hoveredNode = DOMModule.getTargetElByType('hovered');
            if (hoveredNode) {
                const clientRectNode = DOMModule.getBoundingElRect('hovered');
                const hoverNodeParams = DOMModule.getStyleByNode(hoveredNode);
                toggleBox('hover');
                updateInfoBoxDataByType('hover', clientRectNode, 'top', hoverNodeParams);
            }

            const selectedNode = DOMModule.getTargetElByType('selected');
            if (selectedNode) {
                const clientRectNode = DOMModule.getBoundingElRect('selected');
                const selectedNodeParams = DOMModule.getStyleByNode(selectedNode);
                toggleBox('select');
                updateInfoBoxDataByType('select', clientRectNode, 'top', selectedNodeParams);
            }
        }
    }
};