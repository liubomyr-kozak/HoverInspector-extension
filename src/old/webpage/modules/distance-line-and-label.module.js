import Zt from '../core/Zt';
import {DOMModule} from "./dom.module";


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


    switch (sideName) {
        case 'left_ | ->':
            return {
                coord: selectedElData.left,
                value: hoveredElData.left - selectedElData.left,
            };

        case 'left_ |R ->':
            return {
                coord: selectedElData.right,
                value: hoveredElData.left - selectedElData.right,
            };

        case 'left_ <- |':
            return {
                coord: hoveredElData.left,
                value: selectedElData.left - hoveredElData.left,
            };

        case 'right_ | ->':
            return {
                coord: selectedElData.right,
                value: hoveredElData.right - selectedElData.right,
            };

        case 'right_ <- |':
            return {
                coord: hoveredElData.right,
                value: hoveredElData.right - selectedElData.right,
            };

        case 'right_ <- |L':
            return {
                coord: hoveredElData.right,
                value: selectedElData.left - hoveredElData.right,
            };

        case 'top_ | b->':
            return {
                coord: selectedElData.top,
                value: hoveredElData.top - selectedElData.top,
            };

        case 'top_ <-t |T':
            return {
                coord: selectedElData.bottom,
                coord1: hoveredElData.top,
                value: hoveredElData.top - selectedElData.bottom,
            };

        case 'top_ <-t |':
            return {
                coord: hoveredElData.top,
                value: hoveredElData.top - selectedElData.top,
            };

        case 'bottom_ | b->':
            return {
                coord: selectedElData.bottom,
                coord1: hoveredElData.bottom,
                value: hoveredElData.bottom - selectedElData.bottom,
                values: {selectedElData, hoveredElData}
            };

        case 'bottom_ <-t |':
            return {
                coord: hoveredElData.bottom,
                coord1: selectedElData.bottom,
                value: selectedElData.bottom - hoveredElData.bottom,
                values: {selectedElData, hoveredElData}
            };

        case 'bottom_ <-b |B':
            return {
                coord: hoveredElData.bottom,
                coord1: selectedElData.top,
                value: selectedElData.top - hoveredElData.bottom,
                values: {selectedElData, hoveredElData}
            };

    }
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

    const centeredBySelectedNode_TopBottom =
        availableSideType.indexOf('left_ <- |') >= 0 &&
        availableSideType.indexOf("right_ | ->") >= 0;

    const centeredBySelectedNode_Side =
        availableSideType.indexOf('top_ <-t |') >= 0 &&
        (
            availableSideType.indexOf('bottom_ | b->') >= 0 ||
            availableSideType.indexOf('bottom_ <-t |') >= 0
        );


    // console.log('========================================');
    // console.log(availableSideType);
    // // console.log('centeredBySelectedNode_Side', centeredBySelectedNode_Side);
    // // console.log('centeredBySelectedNode_TopBottom', centeredBySelectedNode_TopBottom);
    // console.log('========================================');
    //

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
        distanceLineAndLabels.x.style.top = `${data.x}px`;
        distanceLineAndLabels.x.style.left = `${Math.abs(side.coord)}px`;

        distanceLineAndLabels.x.childNodes[0].innerHTML = `${Zt.helpers.ifNumberFloatCut(Math.abs(side.value))}px`;
    } else {
        distanceLineAndLabels.x.style.display = `none`;
    }

    if (data.left) {
        const {side, type} = data.left;

        distanceLineAndLabels.x1.style.display = `block`;
        distanceLineAndLabels.x1.style.height = '1px';
        distanceLineAndLabels.x1.style.width = `${Math.abs(side.value)}px`;
        distanceLineAndLabels.x1.style.top = `${data.x}px`;
        distanceLineAndLabels.x1.style.left = `${Math.abs(side.coord)}px`;

        distanceLineAndLabels.x1.childNodes[0].innerHTML = `${Zt.helpers.ifNumberFloatCut(Math.abs(side.value))}px`
    } else {
        distanceLineAndLabels.x1.style.display = `none`;
    }

    if (data.top) {
        const {side, type} = data.top;
        const isTopCoordinateOutVisibility = side.coord < 0;
        const windowHeight = _ => window.innerHeight;
        const clearValue = _ => Math.abs(side.value);
        const isTopLineIsHuge = _ => side.value > windowHeight();
        const diffByWindowHeightAndValue = _ => windowHeight() - Math.abs(side.coord);
        const diffByVisibleHeightAndValue = _ => clearValue() - Math.abs(side.coord);
        const topCoordinate = isTopCoordinateOutVisibility ? 0 : side.coord;

        let lineHeight = isTopLineIsHuge()
            ? isTopCoordinateOutVisibility
                ? windowHeight()
                : diffByWindowHeightAndValue()
            : isTopCoordinateOutVisibility
                ? diffByVisibleHeightAndValue()
                : clearValue();

        lineHeight = lineHeight > side.coord1 ? side.coord1 : lineHeight;
        const isLabelVisible = lineHeight < 0 && topCoordinate <= 0;

        if (isLabelVisible) {
            distanceLineAndLabels.y.style.display = `none`;
        } else {
            distanceLineAndLabels.y.style.display = `block`;
            distanceLineAndLabels.y.style.height = `${Math.abs(lineHeight)}px`;
            distanceLineAndLabels.y.style.width = '1px';
            distanceLineAndLabels.y.style.top = `${topCoordinate}px`;
            distanceLineAndLabels.y.style.left = `${Math.abs(data.y)}px`;

            distanceLineAndLabels.y.childNodes[0].innerHTML = `${Zt.helpers.ifNumberFloatCut(Math.abs(side.value))}px`;
        }
    } else {
        distanceLineAndLabels.y.style.display = `none`;
    }


    if (data.bottom) {
        const {side, type} = data.bottom;
        const isTopCoordinateOutVisibility = side.coord < 0;
        const topCoordinate = isTopCoordinateOutVisibility ? 0 : side.coord;
        const windowHeight = _ => window.innerHeight;
        const clearValue = _ => Math.abs(side.value);
        const isBottomLineIsHuge = _ => side.value > windowHeight();
        const diffByWindowHeightAndValue = _ => windowHeight() - Math.abs(side.coord);

        let lineHeight = isBottomLineIsHuge()
            ? isTopCoordinateOutVisibility
                ? windowHeight()
                : diffByWindowHeightAndValue()
            : clearValue();

        lineHeight = lineHeight > side.coord1 ? side.coord1 : lineHeight;
        const isLabelVisible = lineHeight < 0;

        if (isLabelVisible) {
            distanceLineAndLabels.y1.style.display = `none`;
        } else {
            distanceLineAndLabels.y1.style.display = `block`;
            distanceLineAndLabels.y1.style.height = `${lineHeight}px`;
            distanceLineAndLabels.y1.style.width = '1px';
            distanceLineAndLabels.y1.style.top = `${topCoordinate}px`;
            distanceLineAndLabels.y1.style.left = `${Math.abs(data.y)}px`;
            distanceLineAndLabels.y1.childNodes[0].innerHTML = `${Zt.helpers.ifNumberFloatCut(Math.abs(side.value))}px`;
        }
    } else {
        distanceLineAndLabels.y1.style.display = `none`;
    }
};


const toggleLinesAndLabels = (flag) => {
    distanceLineAndLabels.all.forEach(el => el.style.display = flag === 'hide' ? 'none' : 'block');
};

Zt.addToRender(distanceLineAndLabels.all);
Zt.stateChange((state) => {
    if (state.action === 'hover') {
        let distance = calculateDistance(
            DOMModule.getBoundingElRect('hovered'),
            DOMModule.getBoundingElRect('selected')
        );

        if (distance) {
            dispatchDistanceLineAndLabel(distance);
        }
    }

    if (state.action === 'select') {
        toggleLinesAndLabels('hide');
    }


    if (state.action === 'scroll') {
        if (!DOMModule.getBoundingElRect('hovered')) {
            return;
        }

        let distance = calculateDistance(
            DOMModule.getBoundingElRect('hovered'),
            DOMModule.getBoundingElRect('selected')
        );

        if (distance) {
            dispatchDistanceLineAndLabel(distance);
        }
    }
});


export const DistanceLineAndLabelModule = {
    toggleLinesAndLabels
};
