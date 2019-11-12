import Zt from '../core/Zt';

const labelNode = {};

const createBoxLabel = () => {
    const label = document.createElement('div');
    label.className = 'zToolBoxLabel';

    label.ZtOptions = {};
    return label;
};


const labelParams = (type, {top, bottom, right, left, height, width}) => {
    labelNode[type].innerHTML = `${Zt.helpers.ifNumberFloatCut(height)} x ${Zt.helpers.ifNumberFloatCut(width)}`;

    const isLabelWillCanVisible = (
        (top + 30) >= 0 &&
        // left >= 0 &&
        (bottom + 30) <= (window.innerHeight || document.documentElement.clientHeight) //&& /*or $(window).height() */
        // right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
    let positionClassName = isLabelWillCanVisible ? "zToolBoxLabel_arrow_top" : "zToolBoxLabel_arrow_bottom";

    if (top <= 30) {
        positionClassName = 'zToolBoxLabel_arrow_top';
    }

    if (!labelNode[type].classList.contains(positionClassName)) {
        let removingClassName = isLabelWillCanVisible ? "zToolBoxLabel_arrow_bottom" : "zToolBoxLabel_arrow_top";

        if (top <= 30) {
            removingClassName = 'zToolBoxLabel_arrow_bottom';
        }

        labelNode[type].classList.remove(removingClassName);
        labelNode[type].classList.add(positionClassName);
    }

    // console.log('isLabelWillCanVisible', isLabelWillCanVisible);
    // console.log('top', top);
    // console.log('bottom', bottom);

    const topWithArrowHeight = top - 10;
    // console.log(topWithArrowHeight);

    const isTopViewNotInBox = (
            topWithArrowHeight < 0
            && (Math.abs(topWithArrowHeight) <= height)
        )
        && height < window.innerHeight;

    if (isLabelWillCanVisible || isTopViewNotInBox) {
        // console.log('IF:: isLabelWillCanVisible || isTopViewNotInBox');

        let diffValue = 10;
        labelNode[type].style.top = `${top + height + diffValue}px`;
    } else {

        // console.log('ELSE:: isLabelWillCanVisible || isTopViewNotInBox');

        let diffValue = 35;

        if (top <= 10) {
            // console.log('---if')
            // const topPosition = topWithArrowHeight < 15 ? 15 : topWithArrowHeight;
            // labelNode[type].style.top = `${topPosition}px`;


            labelNode[type].style.top = `${topWithArrowHeight + 20}px`;


        } else {
            // console.log('---else')
            labelNode[type].style.top = `${top - diffValue}px`;
        }
    }

    labelNode[type].style.left = `${left}px`;

    if (type === 'hovered') {
        labelNode[type].style.left = `${left}px`;
        labelNode[type].classList.add("zToolBoxLabel_hovered");
    }

    // if (type === 'selected') {
    //     labelNode[type].style.left = `${left}px`;
    //     labelNode[type].classList.add("zToolBoxLabel_selected");
    // }

};


const toggleLabel = flag => {
    labelNode[type].style.display = flag === 'hide' ? 'none' : 'block';
};


const hoverLabel = createBoxLabel();
// const selectedLabel = createBoxLabel();
labelNode['hovered'] = hoverLabel;
// labelNode['selected'] = selectedLabel;


Zt.addToRender([hoverLabel]);
// Zt.addToRender([hoverLabel, selectedLabel]);
Zt.stateChange((state) => {
    if (state.action === 'hover') {
        labelParams('hovered', state.clientRectHoveredNode);
    }

    if (state.action === 'scroll') {
        labelParams('hovered', state.clientRectHoveredNode);
    }

    if (state.action === 'scrollSimple') {
        labelParams('hovered', state.clientRectHoveredNode);
    }
});

export const BoxLabelsModule = {};
