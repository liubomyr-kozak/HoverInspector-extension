import {useRef} from "react";


const isFloat = (n) => {
    return Number(n) === n && n % 1 !== 0;
};

const ifNumberFloatCut = (number) => {
    return isFloat(number) ? number.toFixed(2) : number;
};


export const setPadding = (containerPadding, {top, bottom, right, left, height, width}, hoverNodeParams) => {
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

export const setMargin = (containerMargin, {top, bottom, right, left, height, width}, hoverNodeParams) => {
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

export const setParamsToNode = (
    {topRef, bottomRef, leftRef, rightRef},
    {top, bottom, right, left, height, width}
) => {

    leftRef.current.style.top = `${top}px`;
    leftRef.current.style.left = `${right}px`;
    leftRef.current.style.width = "1px";
    leftRef.current.style.height = `${height}px`;

    rightRef.current.style.top = `${top}px`;
    rightRef.current.style.left = `${left}px`;
    rightRef.current.style.width = "1px";
    rightRef.current.style.height = `${height}px`;

    topRef.current.style.top = `${top}px`;
    topRef.current.style.left = `${left}px`;
    topRef.current.style.width = `${width}px`;
    topRef.current.style.height = "1px";

    bottomRef.current.style.top = `${bottom}px`;
    bottomRef.current.style.left = `${left}px`;
    bottomRef.current.style.width = `${width}px`;
    bottomRef.current.style.height = "1px";
};

export const use4SideNodeRef = () => {
    const topRef = useRef(null);
    const bottomRef = useRef(null);
    const leftRef = useRef(null);
    const rightRef = useRef(null);

    return {topRef, bottomRef, leftRef, rightRef}
}

export const normalizeSideName = sideName => {
    return sideName.split('_')[0]
};

export const getSideValue = (sideName, selectedElData, hoveredElData) => {
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

export const calculateDistance = (hoveredElData, selectedElData) => {
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

export const dispatchDistanceLineAndLabel = ({topRef, bottomRef, leftRef, rightRef}, data) => {
    if (data.right) {
        const {side} = data.right;

        rightRef.current.style.display = `block`;
        rightRef.current.style.height = '0px';
        rightRef.current.style.width = `${Math.abs(side.value)}px`;
        rightRef.current.style.top = `${data.x}px`;
        rightRef.current.style.left = `${Math.abs(side.coord)}px`;

        rightRef.current.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`;
    } else {
        rightRef.current.style.display = `none`;
    }

    if (data.left) {
        const {side} = data.left;

        leftRef.current.style.display = `block`;
        leftRef.current.style.height = '0px';
        leftRef.current.style.width = `${Math.abs(side.value)}px`;
        leftRef.current.style.top = `${data.x}px`;
        leftRef.current.style.left = `${Math.abs(side.coord)}px`;

        leftRef.current.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`
    } else {
        leftRef.current.style.display = `none`;
    }

    if (data.top) {
        const {side} = data.top;
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
            topRef.current.style.display = `none`;
        } else {
            topRef.current.style.display = `block`;
            topRef.current.style.height = `${Math.abs(lineHeight)}px`;
            topRef.current.style.width = '0px';
            topRef.current.style.top = `${topCoordinate}px`;
            topRef.current.style.left = `${Math.abs(data.y)}px`;

            topRef.current.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`;
        }
    } else {
        topRef.current.style.display = `none`;
    }


    if (data.bottom) {
        const {side} = data.bottom;
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
            bottomRef.current.style.display = `none`;
        } else {
            bottomRef.current.style.display = `block`;
            bottomRef.current.style.height = `${lineHeight}px`;
            bottomRef.current.style.width = '0px';
            bottomRef.current.style.top = `${topCoordinate}px`;
            bottomRef.current.style.left = `${Math.abs(data.y)}px`;
            bottomRef.current.childNodes[0].innerHTML = `${ifNumberFloatCut(Math.abs(side.value))}px`;
        }
    } else {
        bottomRef.current.style.display = `none`;
    }
};

export const toggleLinesAndLabels = (distanceLineAndLabels, flag) => {
    distanceLineAndLabels.forEach(el => el.current.style.display = flag === 'hide' ? 'none' : 'block');
};