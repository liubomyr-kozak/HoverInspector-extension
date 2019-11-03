var ModuleZt = ModuleZt || {};

var body = document.querySelector('body');
var port = chrome.runtime.connect({name: "dimensions"});
var paused = true;
var connectionClosed = false;

port.onMessage.addListener(function (event) {
    if (connectionClosed)
        return;

    switch (event.type) {
        case 'distances':
            showDimensions(event.data);
            break;
        case 'destroy':
            destroy();
            break;
    }
});

// side effect.. I execute version in another script;
ModuleZt.version = window.extension.hoverInspector.version;
console.log(ModuleZt.version);

var isFloat = n => {
    return Number(n) === n && n % 1 !== 0;
};

var ifNumberFloatCut = number => {
    return isFloat(number) ? number.toFixed(2) : number;
};

if (!ModuleZt.hasOwnProperty('Init')) {
    ModuleZt.Init = (() => {

    })();

    ModuleZt.Box = (() => {

        const boxTypes = {
            selected: {},
            hovered: {}
        };

        const createBox = () => {
            const reducer = (boxObject, vector) => {
                boxObject[vector] = document.createElement('div');
                boxObject['all'].push(boxObject[vector]);
                return boxObject
            };
            return ['x', 'x1', 'y', 'y1'].reduce(reducer, {all: []})
        };

        const hoverBoxSetParams = (params) => {
            markBoxAsHover(boxTypes.hovered.all);
            setParamsToNode('hovered', params)
        };

        const setParamsToSelected = (params) => {
            setParamsToNode('selected', params)
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

        const registerBox = (boxType, box) => {
            boxTypes[boxType] = box;
            boxTypes[boxType].isDisplay = false;
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

        return {
            createBox,
            hoverBoxSetParams,
            setParamsToSelected,
            registerBox,
            getBoxByType,
            toggleAllBoxes,
            changeHoverBoxToSelect
        }
    })();

    ModuleZt.Distance = (() => {

        const getAbsoluteTopNumberMath = value => {
            // if coordinate is -100 that means top position not in view screen
            return value > 0 ? value : 0;
        };

        const getAbsoluteBottomNumberMath = value => {
            const viewPortBottomPosition = window.scrollY + window.innerHeight;

            return viewPortBottomPosition < value ? 0 : value;
        };

        const getLineHeightForBottom = selectedBottomPosition => {
            return window.innerHeight - selectedBottomPosition;
        };


        const createDistanceLine = () => {
            const reducer = (boxObject, vector) => {
                const lineNode = document.createElement('div');
                lineNode.className = `zToolDistanceLine_${vector}`;

                const textNode = document.createElement('span');
                textNode.className = 'zToolDistanceLineLabel';

                lineNode.appendChild(textNode);
                boxObject[vector] = lineNode;
                boxObject['all'].push(boxObject[vector]);
                return boxObject
            };
            return ['x', 'x1', 'y', 'y1'].reduce(reducer, {all: []})
        };

        const distanceLineAndLabels = createDistanceLine();

        const normalizeSideName = sideName => {
            return sideName.split('_')[0]
        };

        const getSideValue = (sideName, selectedElData, hoveredElData) => {
            let side;


            switch (sideName) {

                case 'left_ | ->':
                    side = {
                        coord: selectedElData.left,
                        coord1: hoveredElData.left,
                        value: hoveredElData.left - selectedElData.left,
                    };
                    break;
                case 'left_ |R ->':
                    side = {
                        coord: selectedElData.right,
                        coord1: hoveredElData.left,
                        value: hoveredElData.left - selectedElData.right,
                    };
                    break;
                case 'left_ <- |':
                    side = {
                        coord: hoveredElData.left,
                        coord1: selectedElData.left,
                        value: selectedElData.left - hoveredElData.left,
                    };
                    break;
                case 'right_ | ->':
                    side = {
                        coord: selectedElData.right,
                        coord1: hoveredElData.right,
                        value: hoveredElData.right - selectedElData.right,
                    };
                    break;
                case 'right_ <- |':
                    side = {
                        coord: hoveredElData.right,
                        coord1: selectedElData.right,
                        value: hoveredElData.right - selectedElData.right,
                    };
                    break;
                case 'right_ <- |L':
                    side = {
                        coord: hoveredElData.right,
                        coord1: selectedElData.left,
                        value: selectedElData.left - hoveredElData.right,
                    };
                    break;
                case 'top_ | b->':
                    side = {
                        coord: selectedElData.top,
                        coord1: hoveredElData.top,
                        value: hoveredElData.top - selectedElData.top,
                    };
                    break;
                case 'top_ <-t |T':
                    side = {
                        coord: selectedElData.bottom,
                        coord1: hoveredElData.top,
                        value: hoveredElData.top - selectedElData.bottom,
                    };
                    break;
                case 'top_ <-t |':
                    side = {
                        coord: hoveredElData.top,
                        coord1: selectedElData.top,
                        value: hoveredElData.top - selectedElData.top,
                    };
                    break;
                case 'bottom_ | b->':
                    side = {
                        coord: selectedElData.bottom,
                        coord1: selectedElData.top,
                        value: hoveredElData.bottom - selectedElData.bottom,
                    };
                    break;
                case 'bottom_ <-t |':
                    side = {
                        coord: hoveredElData.bottom,
                        coord1: hoveredElData.top,
                        value: selectedElData.bottom - hoveredElData.bottom,
                    };
                    break;
                case 'bottom_ <-b |B':
                    side = {
                        coord: hoveredElData.bottom,
                        coord1: selectedElData.top,
                        value: selectedElData.top - hoveredElData.bottom,
                    };
                    break;
            }

            return side;
        };

        const calculateDistance = (hoveredElData, selectedElData) => {
            if (!selectedElData) {
                return
            }

            const availableSideType = [];

            if (selectedElData.right < hoveredElData.left) {
                availableSideType.push(
                    'left_ |R ->'
                );
            } else if (selectedElData.left < hoveredElData.right) {
                availableSideType.push(
                    selectedElData.left < hoveredElData.left
                        ? 'left_ | ->'
                        : 'left_ <- |'
                );

            }
            if (selectedElData.left > hoveredElData.right) {
                availableSideType.push(
                    'right_ <- |L'
                );
            } else if (selectedElData.right > hoveredElData.left) {
                availableSideType.push(
                    selectedElData.right < hoveredElData.right
                        ? 'right_ | ->'
                        : 'right_ <- |'
                );
            }
            if (selectedElData.bottom < hoveredElData.top) {
                availableSideType.push(
                    'top_ <-t |T'
                );
            } else if (selectedElData.top < hoveredElData.bottom) {
                availableSideType.push(
                    selectedElData.top < hoveredElData.top
                        ? 'top_ | b->'
                        : 'top_ <-t |'
                );
            }
            if (selectedElData.top > hoveredElData.bottom) {
                availableSideType.push(
                    'bottom_ <-b |B'
                );
            } else if (selectedElData.bottom > hoveredElData.top) {
                availableSideType.push(
                    selectedElData.bottom < hoveredElData.bottom
                        ? 'bottom_ | b->'
                        : 'bottom_ <-t |'
                );
            }

            const centeredBySelectedNode_TopBottom = availableSideType.indexOf('left_outSelectedBox') >= 0 &&
                availableSideType.indexOf('right_outSelectedBox') >= 0;

            const centeredBySelectedNode_Side = availableSideType.indexOf('top_outSelectedBox') >= 0 &&
                availableSideType.indexOf('bottom_outSelectedBox') >= 0;


            // console.log('--------------------------------------------')
            // console.log('--------------------------------------------')
            // console.log('--------------------------------------------')
            // console.log('availableSideType', availableSideType);
            // console.log('centeredBySelectedNode_TopBottom', centeredBySelectedNode_TopBottom);
            // console.log('switchSideBottom', centeredBySelectedNode_Side);

            return availableSideType.reduce((obj, side) => {
                    if (side) {
                        obj[normalizeSideName(side)] = {
                            type: side,
                            side: getSideValue(side, selectedElData, hoveredElData)
                        }
                    }
                    return obj;
                },
                {
                    x: centeredBySelectedNode_Side
                        ? selectedElData.top + selectedElData.height / 2
                        : hoveredElData.top + hoveredElData.height / 2,
                    y: centeredBySelectedNode_TopBottom
                        ? selectedElData.left + selectedElData.width / 2
                        : hoveredElData.left + hoveredElData.width / 2
                }
            );
        };

        const dispatchDistanceLineAndLabel = data => {

            if (data.right) {
                const {side, type} = data.right;

                distanceLineAndLabels.x.style.display = `block`;
                distanceLineAndLabels.x.style.height = '1px';
                distanceLineAndLabels.x.style.width = `${Math.abs(side.value)}px`;
                distanceLineAndLabels.x.style.top = `${Math.abs(data.x)}px`;
                distanceLineAndLabels.x.style.left = `${Math.abs(side.coord)}px`;

                distanceLineAndLabels.x.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`;
            } else {
                distanceLineAndLabels.x.style.display = `none`;
            }

            if (data.left) {
                const {side, type} = data.left;

                distanceLineAndLabels.x1.style.display = `block`;
                distanceLineAndLabels.x1.style.height = '1px';
                distanceLineAndLabels.x1.style.width = `${Math.abs(side.value)}px`;
                distanceLineAndLabels.x1.style.top = `${Math.abs(data.x)}px`;
                distanceLineAndLabels.x1.style.left = `${Math.abs(side.coord)}px`;

                distanceLineAndLabels.x1.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`
            } else {
                distanceLineAndLabels.x1.style.display = `none`;
            }

            if (data.top) {
                const {side, type} = data.top;


                const topCoordinate = getAbsoluteTopNumberMath(side.coord);
                const lineHeight = topCoordinate === 0 ? (side.value - Math.abs(side.coord)) : Math.abs(side.value);


                distanceLineAndLabels.y.style.display = `block`;
                distanceLineAndLabels.y.style.height = `${lineHeight}px`;
                distanceLineAndLabels.y.style.width = '1px';
                distanceLineAndLabels.y.style.top = `${topCoordinate}px`;
                distanceLineAndLabels.y.style.left = `${Math.abs(data.y)}px`;

                distanceLineAndLabels.y.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`;
            } else {
                distanceLineAndLabels.y.style.display = `none`;
            }

            if (data.bottom) {
                const {side, type} = data.bottom;

                const topCoordinate = getAbsoluteBottomNumberMath(side.coord1);
                const lineHeight = topCoordinate === 0 ? getLineHeightForBottom(side.coord) : Math.abs(side.value);

                distanceLineAndLabels.y1.style.display = `block`;
                distanceLineAndLabels.y1.style.height = `${lineHeight}px`;
                distanceLineAndLabels.y1.style.width = '1px';
                distanceLineAndLabels.y1.style.top = `${Math.abs(side.coord)}px`;
                distanceLineAndLabels.y1.style.left = `${Math.abs(data.y)}px`;

                distanceLineAndLabels.y1.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`;
            } else {
                distanceLineAndLabels.y1.style.display = `none`;
            }
        };

        const getDistanceLineAndLabels = () => distanceLineAndLabels;


        const toggleLinesAndLabels = (flag) => {
            distanceLineAndLabels.all.forEach(el => el.style.display = flag === 'hide' ? 'none' : 'block');
        };

        return {
            calculateDistance,
            dispatchDistanceLineAndLabel,
            getDistanceLineAndLabels,
            toggleLinesAndLabels
        }
    })();

    ModuleZt.DOM = (() => {

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
            return boundingElRect[type].target
        };


        return {
            getStyle,
            getStyleByNode,
            addBoundingElRect,
            getBoundingElRect,
            getTargetElByType
        }
    })();

    ModuleZt.InfoBox = (() => {

        function crateInfoBoxes() {
            const optionSelection = document.createElement('div');
            optionSelection.className = 'zToolOptionSelection';
            optionSelection.innerHTML = `
            <span class="zToolOptionVersion">${ModuleZt.version}</span> 
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

        let boxes = crateInfoBoxes();

        function getInfoBoxes() {
            return boxes;
        }

        function updateInfoBoxDataByType(type, clientRect, cursorPosition, selectedNodeParams) {
            const infoBoxByType = type === 'hover' ? boxes.hoveredInfoBox : boxes.selectedInfoBox;

            const {top, bottom, right, left, height, width} = clientRect;
            const pr = selectedNodeParams;

            infoBoxByType.innerHTML = `
                &nbsp; ${type === 'hover' ? 'Hovered:' : 'Selected'} &nbsp;
                height:&nbsp;
                    <span class="zToolInfoBoxValueLabel">${ifNumberFloatCut(height)}px</span>
                &nbsp;  
                width:&nbsp;
                    <span class="zToolInfoBoxValueLabel">${ifNumberFloatCut(width)}px</span>
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

        return {
            getInfoBoxes,
            updateInfoBoxDataByType,
            toggleBox,
            toggleBoxes
        }
    })();

    ModuleZt.zToolExtension = (() => {
        function renderElements() {

            ModuleZt.InfoBox.getInfoBoxes().all.forEach(el => body.appendChild(el));

            const hoverLabel = ModuleZt.BoxLabels.createBoxLabel();
            const selectedLabel = ModuleZt.BoxLabels.createBoxLabel();
            ModuleZt.BoxLabels.registerLabel('hovered', hoverLabel);
            ModuleZt.BoxLabels.registerLabel('selected', selectedLabel);
            body.appendChild(hoverLabel);
            body.appendChild(selectedLabel);

            ModuleZt.Box.getBoxByType('hovered').all.forEach(el => body.appendChild(el));
            ModuleZt.Box.getBoxByType('selected').all.forEach(el => body.appendChild(el));
            ModuleZt.Distance.getDistanceLineAndLabels().all.forEach(el => body.appendChild(el));
        }

        function removeHoverBox() {
            ModuleZt.Box.getBoxByType('hovered').all.forEach(el => body.removeChild(el));
            ModuleZt.Box.getBoxByType('selected').all.forEach(el => body.removeChild(el));
        }

        return {
            renderElements,
            removeHoverBox
        }
    })();

    ModuleZt.BoxLabels = (() => {

        const labelNode = {};

        const createBoxLabel = () => {
            const label = document.createElement('div');
            label.className = 'zToolBoxLabel';

            return label;
        };


        const labelParams = (type, {top, bottom, right, left, height, width}) => {
            labelNode[type].innerHTML = `${ifNumberFloatCut(height)} x ${ifNumberFloatCut(width)}`;


            if (type == 'hovered') {
                labelNode[type].style.top = `${top}px`;
                labelNode[type].style.left = `${left}px`;
                labelNode[type].classList.add("zToolBoxLabel_hovered");
            }

            if (type == 'selected') {
                labelNode[type].style.top = `${bottom - 25}px`;
                labelNode[type].style.left = `${left}px`;
                labelNode[type].classList.add("zToolBoxLabel_selected");
            }

        };


        const registerLabel = (type, label) => {
            labelNode[type] = label;
        };

        const getLabel = () => labelNode;

        const toggleLabel = flag => {
            labelNode[type].style.display = flag === 'hide' ? 'none' : 'block';
        };

        return {
            createBoxLabel,
            labelParams,
            registerLabel,
            getLabel,
            toggleLabel
        }
    })();
}

// =====================================================================================================================
// =============================================== CORE STEPS [END] ====================================================
// =====================================================================================================================

// =====================================================================================================================
// INITIAL STEPS
// =====================================================================================================================


// =====================================================================================================================
// LET PLAY with BLACK JACK AND Extension
// =====================================================================================================================

function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
}

ModuleZt.position = 'top';

function onInputMove(e) {
    const hoverElement = e.target;

    // in SVG className is Object

    if (typeof hoverElement.className === 'string'
        && hoverElement.className.indexOf('zToolOptionToggleIcon') >= 0) {
        ModuleZt.position = ModuleZt.position === 'bottom' ? 'top' : 'bottom';
    }

    if (typeof hoverElement.className === 'string'
        && hoverElement.className.indexOf('zTool') >= 0
        && hoverElement.className.indexOf('zToolInfoBoxContainer') <= 0
        && hoverElement.className.indexOf('zToolOptionToggleIcon') < 0) {
        return true;
    }


    const clientRect = hoverElement.getBoundingClientRect();
    const hoverNodeParams = ModuleZt.DOM.getStyleByNode(hoverElement);


    // ModuleZt.Box.hoverBoxSetParams(clientRect);
    ModuleZt.BoxLabels.labelParams('hovered', clientRect);


    ModuleZt.InfoBox.toggleBox('hover');
    ModuleZt.InfoBox.updateInfoBoxDataByType('hover', clientRect, ModuleZt.position, hoverNodeParams);
    //
    ModuleZt.DOM.addBoundingElRect('hovered', {
        target: hoverElement,
        clientRect
    });

    let distance =
        ModuleZt.Distance.calculateDistance(
            ModuleZt.DOM.getBoundingElRect('hovered'),
            ModuleZt.DOM.getBoundingElRect('selected')
        );


    if (distance) {
        ModuleZt.Distance.dispatchDistanceLineAndLabel(distance);
    }
}

function onScroll(e) {
    const selectedNode = ModuleZt.DOM.getTargetElByType('selected');
    const clientRectSelectedNode = selectedNode.getBoundingClientRect();
    ModuleZt.Box.setParamsToSelected(clientRectSelectedNode);

    ModuleZt.DOM.addBoundingElRect('selected', {
        target: selectedNode,
        clientRect: clientRectSelectedNode
    });


    const hoveredNode = ModuleZt.DOM.getTargetElByType('hovered');
    const clientRectHoveredNode = hoveredNode.getBoundingClientRect();

    ModuleZt.Box.hoverBoxSetParams(clientRectHoveredNode);



    ModuleZt.DOM.addBoundingElRect('hovered', {
        target: hoveredNode,
        clientRect: clientRectHoveredNode
    });

    let distance =
        ModuleZt.Distance.calculateDistance(
            ModuleZt.DOM.getBoundingElRect('hovered'),
            ModuleZt.DOM.getBoundingElRect('selected')
        );

    if (distance) {
        ModuleZt.Distance.dispatchDistanceLineAndLabel(distance);
    }
}

function onMouseDown(e) {
    const clickedElement = e.target;

    // in SVG className is Object
    if (typeof clickedElement.className === 'string'
        && clickedElement.className.indexOf('zTool') >= 0) {
        return true;
    }

    ModuleZt.Distance.toggleLinesAndLabels('hide');

    const clientRect = clickedElement.getBoundingClientRect();

    // ModuleZt.BoxLabels.labelParams('selected', clientRect);


    const selectedNodeParams = ModuleZt.DOM.getStyleByNode(clickedElement);
    ModuleZt.InfoBox.toggleBox('select');
    ModuleZt.InfoBox.updateInfoBoxDataByType('select', clientRect, e.clientY, selectedNodeParams);

    ModuleZt.Box.changeHoverBoxToSelect();
    ModuleZt.DOM.addBoundingElRect('selected', {
        target: clickedElement,
        clientRect
    });
    ModuleZt.Box.hoverBoxSetParams(clientRect);
}

function addEventHandler() {
    window.addEventListener('mousemove', onInputMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll);
}

function showDimensions(dimensions) {
    if (paused)
        return;

    if (!dimensions)
        return;

    addEventHandler();

    ModuleZt.Box.toggleAllBoxes('show');
    ModuleZt.Box.toggleAllBoxes('show');
}

function initExtension() {
    ModuleZt.Box.registerBox('selected', ModuleZt.Box.createBox());
    ModuleZt.Box.registerBox('hovered', ModuleZt.Box.createBox());

    addEventHandler();
}

function destroy() {
    connectionClosed = true;
    ModuleZt.Box.toggleAllBoxes('hide');
    ModuleZt.InfoBox.toggleBoxes('hide');
    ModuleZt.Distance.toggleLinesAndLabels('hide');

    window.removeEventListener('mousemove', onInputMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('click', onClick);
    window.removeEventListener('scroll', onScroll);
}

initExtension();
ModuleZt.zToolExtension.renderElements();