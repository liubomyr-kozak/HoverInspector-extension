import React, {Component, createRef, useLayoutEffect, useRef, useState,useEffect, useCallback} from "react";
import {connect, shallowEqual, useSelector} from "react-redux";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";

import {cutPx, getLeftPosition, getTagMeta, isChildText, targetColorStringToHex} from "./helpers.tsx";
import {colorBoxStyle, flexChildRightStyle, targetSizeStyle, targetTitleStyle} from "./PopupStyle.tsx";
import {BoxLabelContainer, PopupWrapper} from "./Popup.styled.ts";
import cx from "classnames";


const PopupContainer = ({data, hoverElement}) => {
    const {height, width, tag, className, id, padding, margin, border, color, backgroundColor, font} = data;

    return (
        <BoxLabelContainer className="BoxContainer">
            <div className="flex">
                {getTagMeta(tag, id, className)}
                <span style={targetSizeStyle}>{cutPx(width)} x {cutPx(height)}</span>
            </div>

            {padding && <div className="flex">
              <div style={targetTitleStyle}>Padding:</div>
              <div style={flexChildRightStyle}>{padding}</div>
            </div>}
            {margin && <div className="flex">
              <div style={targetTitleStyle}>Margin:</div>
              <div style={flexChildRightStyle}>{margin}</div>
            </div>}

            {backgroundColor && <div className="flex">
              <div style={targetTitleStyle}>Background:</div>
              <div style={flexChildRightStyle}>
                <span style={colorBoxStyle(backgroundColor)}/>
                  {targetColorStringToHex(backgroundColor)}
              </div>
            </div>}

            {isChildText(hoverElement.childNodes) && <>
                {font && <div className="flex">
                  <div style={targetTitleStyle}>Font Size:</div>
                  <div style={flexChildRightStyle}>{font}</div>
                </div>}
                {color && <div className="flex">
                  <div style={targetTitleStyle}>Color:</div>
                  <div style={flexChildRightStyle}>
                    <span style={colorBoxStyle(color)}/>
                      {targetColorStringToHex(color)}
                  </div>
                </div>}
            </>}

            {border && border.type === 'single' && <div className="flex">
              <div style={targetTitleStyle}>Border:</div>
              <div style={flexChildRightStyle}>
                  {border.width}
                  {' '}
                  {border.style}
                  {' '}
                <span style={colorBoxStyle(border.color)}/>
                  {targetColorStringToHex(border.color)}
              </div>
            </div>}

            {border && border.type === 'multiple' && <>
              <div className="flex">
                <div style={targetTitleStyle}>Border-Right:</div>
                <div style={flexChildRightStyle}>
                    {border.right.width}
                    {' '}
                    {border.right.style}
                    {' '}
                  <span style={colorBoxStyle(border.right.color)}/>
                    {targetColorStringToHex(border.right.color)}
                </div>
              </div>
              <div className="flex">
                <div style={targetTitleStyle}>Border-Left:</div>
                <div style={flexChildRightStyle}>
                    {border.left.width}
                    {' '}
                    {border.left.style}
                    {' '}
                  <span style={colorBoxStyle(border.left.color)}/>
                    {targetColorStringToHex(border.left.color)}
                </div>
              </div>
              <div className="flex">

                <div style={targetTitleStyle}>Border-Top:</div>
                <div style={flexChildRightStyle}>
                    {border.top.width}
                    {' '}
                    {border.top.style}
                    {' '}
                  <span style={colorBoxStyle(border.top.color)}/>
                    {targetColorStringToHex(border.top.color)}
                </div>
              </div>
              <div className="flex">
                <div style={targetTitleStyle}>Border-Bottom:</div>
                <div style={flexChildRightStyle}>
                    {border.bottom.width}
                    {' '}
                    {border.bottom.style}
                    {' '}
                  <span style={colorBoxStyle(border.bottom.color)}/>
                    {targetColorStringToHex(border.bottom.color)}
                </div>
              </div>
            </>}
        </BoxLabelContainer>
    )
}

const ARROW_HEIGHT = 8;


// // Додаю виправлення без зміни стилю функції
// const getPopupPosition = (hoverNodeParams, popupRef) => {
//     const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");
//     if (!clientRectHoveredNode) return {isVisible: false}; // 1. Перевірка
//
//     const {width} = hoverNodeParams || {};
//     const {top = 0, bottom = 0, left = 0} = clientRectHoveredNode || {};
//
//     const marginBottom = cutPx(hoverNodeParams?.["margin-bottom"]);
//     const marginTop = cutPx(hoverNodeParams?.["margin-top"]);
//     const marginLeft = cutPx(hoverNodeParams?.["margin-left"]);
//     const paddingLeft = cutPx(hoverNodeParams?.["padding-left"]);
//     const paddingRight = cutPx(hoverNodeParams?.["padding-right"]);
//
//     const popupHeight = popupRef.current ? popupRef.current.offsetHeight : 0;
//     const popupWidth = popupRef.current ? popupRef.current.offsetWidth : 0;
//
//     const clientWindow = {
//         bottom: window.innerHeight || document.documentElement.clientHeight,
//         right: window.innerWidth || document.documentElement.clientWidth,
//         top: 0,
//         left: 0
//     };
//
//     const popupTopPosition = top - popupHeight - marginTop - ARROW_HEIGHT;
//     const popupBottomPosition = bottom + ARROW_HEIGHT + marginBottom;
//
//     let result = {
//         css: {top: 0, left: 0},
//         visibleIn: {top: false, bottom: false},
//         isVisible: true,
//         data: null
//     };
//
//     // 2. Виправлена перевірка на топ/боттом
//     result.visibleIn.top = popupTopPosition >= 0;
//     result.visibleIn.bottom = (popupBottomPosition + popupHeight) <= clientWindow.bottom;
//
//     // 3. Визначення топу
//     const topPositionProposal = result.visibleIn.bottom
//         ? popupBottomPosition
//         : result.visibleIn.top
//             ? popupTopPosition
//             : 10;
//
//     let leftProposal = left - marginLeft;
//
//     // 4. Виправлення left (правий край viewport)
//     if (leftProposal + popupWidth > clientWindow.right) {
//         leftProposal = Math.max(10, clientWindow.right - popupWidth - 10);
//     }
//     if (leftProposal < 0) leftProposal = 10;
//
//     result.css.top = topPositionProposal;
//     result.css.left = getLeftPosition({
//         popup: {
//             top: topPositionProposal,
//             height: popupHeight,
//             left: leftProposal,
//             hasTopPosition: !result.visibleIn.bottom && result.visibleIn.top,
//             hasBottomPosition: result.visibleIn.bottom
//         },
//         hovered: {paddingLeft, marginLeft, paddingRight, width},
//     });
//
//     // 5. Якщо вилізає знизу або справа, фолбек
//     if (
//         result.css.left + popupWidth > clientWindow.right ||
//         result.css.top + popupHeight > clientWindow.bottom
//     ) {
//         result.css.left = 10;
//         result.css.top = 10;
//         result.visibleIn.bottom = false;
//         result.visibleIn.top = false;
//     }
//
//     return result;
// };

const getPopupPosition = (hoverNodeParams, popupRef) => {
    // Отримуємо координати елемента, над яким наводимо
    const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");
    if (!clientRectHoveredNode) return {
        css: {top: 0, left: 0},
        visibleIn: {top: false, bottom: false},
        isVisible: false,
        data: null
    };

    const {width} = hoverNodeParams || {};
    const {top = 0, bottom = 0, left = 0} = clientRectHoveredNode || {};

    // Парсимо відступи і падінги
    const marginBottom = cutPx(hoverNodeParams?.["margin-bottom"]);
    const marginTop = cutPx(hoverNodeParams?.["margin-top"]);
    const marginLeft = cutPx(hoverNodeParams?.["margin-left"]);
    const paddingLeft = cutPx(hoverNodeParams?.["padding-left"]);
    const paddingRight = cutPx(hoverNodeParams?.["padding-right"]);

    // Визначаємо розміри попапа
    const popupHeight = popupRef.current ? popupRef.current.offsetHeight : 0;
    const popupWidth = popupRef.current ? popupRef.current.offsetWidth : 0;

    // Межі вікна
    const clientWindow = {
        bottom: window.innerHeight || document.documentElement.clientHeight,
        right: window.innerWidth || document.documentElement.clientWidth,
        top: 0,
        left: 0
    };

    // Визначаємо бажану позицію — спочатку знизу, якщо не влазить — зверху
    const popupBottomPosition = bottom + ARROW_HEIGHT + marginBottom;
    const popupTopPosition = top - popupHeight - marginTop - ARROW_HEIGHT;

    // Чи вміщається попап знизу?
    const canShowBottom = popupBottomPosition + popupHeight <= clientWindow.bottom;
    // Чи вміщається зверху?
    const canShowTop = popupTopPosition >= clientWindow.top;

    // Видимість у кожній позиції
    let visibleIn = {top: canShowTop, bottom: canShowBottom};

    // Визначаємо top
    let topPositionProposal;
    if (canShowBottom) {
        topPositionProposal = popupBottomPosition;
    } else if (canShowTop) {
        topPositionProposal = popupTopPosition;
    } else {
        // fallback — коли не влазить ні зверху, ні знизу
        topPositionProposal = 10;
        visibleIn = {top: false, bottom: false};
    }


    // console.group()
    // console.log("🌟🌟🌟 ::getPopupPosition -> marginLeft", marginLeft);
    // console.log("😎😎😎 ::getPopupPosition -> paddingLeft", paddingLeft);
    // console.groupEnd()

    // Визначаємо left
    let leftProposal = left - marginLeft;

    // Якщо права межа попапа (leftProposal + ширина попапа) виходить за межу viewport (clientWindow.right)
    // То переміщаємо попап вліво так, щоб він повністю помістився у вікно,
    // але не ближче ніж на 10px до правого краю.
    // Math.max(10, ...) гарантує, що попап не піде далі 10px від лівого краю viewport.
    if (leftProposal + popupWidth > clientWindow.right) {
        leftProposal = Math.max(10, clientWindow.right - popupWidth - 10);
    }

    if (leftProposal < 0) leftProposal = 10;

    // Обраховуємо фінальний left через getLeftPosition, якщо він є
    let finalLeft = typeof getLeftPosition === 'function'
        ? getLeftPosition({
            popup: {
                top: topPositionProposal,
                height: popupHeight,
                left: leftProposal,
                hasTopPosition: !canShowBottom && canShowTop,
                hasBottomPosition: canShowBottom
            },
            hovered: {paddingLeft, marginLeft, paddingRight, width},
        })
        : leftProposal;

    // Додаткова перевірка, щоб не вилізти за межі вікна
    let finalTop = topPositionProposal;
    if (finalLeft + popupWidth > clientWindow.right) {
        // Якщо вилізає справа — пересуваємо лівіше
        finalLeft = Math.max(10, clientWindow.right - popupWidth - 10);
    }
    if (finalLeft <= 0) finalLeft = 10;
    if (finalTop + popupHeight > clientWindow.bottom) finalTop = clientWindow.bottom - popupHeight - 10;
    if (finalTop <= 0) finalTop = 10;

    //
    // console.log({
    //     bottom,
    //     ARROW_HEIGHT,
    //     marginBottom,
    //     popupHeight,
    //     popupBottomPosition,
    //     "popupBottomPosition + popupHeight": popupBottomPosition + popupHeight,
    //     "window.innerHeight": clientWindow.bottom,
    //     canShowBottom
    // });
    //
    // console.log({
    //     popupBottomPosition,
    //     popupHeight,
    //     sum: popupBottomPosition + popupHeight,
    //     windowHeight: window.innerHeight,
    //     canShowBottom
    // });

    // Повертаємо результат у потрібному форматі
    return {
        css: {
            top: finalTop,
            left: finalLeft,
        },
        visibleIn,
        isVisible: true,
        data: null
    };
};


const Popup = React.memo(() => {
    const listenChangeUserAction = useSelector((state) => (state as any).app.userAction);
    const popupRef = useRef<any>(null);
    const lockRerender = useRef(false);
    const [popup, setPopup] = useState({
        isVisible: false,
        visibleIn: {} as any,
        data: null,
        css: {top: 0, left: 0}
    });

    const updatePopup = useCallback((activeElementType) => {
        if (lockRerender.current) return;

        const hoverNodeParams = DomNodeManager.getStyleByNode(activeElementType)

        if (!hoverNodeParams || !Object.keys(hoverNodeParams).length) return;

        const data = {
            ...hoverNodeParams,
            backgroundColor: hoverNodeParams["background-color"]
        };

        setPopup((prev) => ({
            ...prev,
            data: data as any
        }));

        lockRerender.current = true;

        // Затримка 0, щоб оновився DOM (рівень next tick)
        setTimeout(() => {
            const position = getPopupPosition(hoverNodeParams, popupRef);

            // console.log("🚀🚀🚀 :: -> position", position);

            setPopup((prev) => ({
                ...prev,
                ...position,
                data: data as any
            }));

            // Розблокуємо ререндер через ще одну "подію"
            setTimeout(() => {
                lockRerender.current = false;
            }, 0);
        }, 0);
    }, []);

    useEffect(() => {
        updatePopup("hoverElement");

        const hoverNodeParams = DomNodeManager.getStyleByNode("hoverElement")

        if (!hoverNodeParams || !Object.keys(hoverNodeParams).length) {
            setPopup((prev) => ({
                ...prev,
                isVisible: false,
                data: null
            }));
        }
    }, [listenChangeUserAction]);

    const hoverElement = DomNodeManager.get("hoverElement");

    return (
        <PopupWrapper
            ref={popupRef}
            top={String(popup.css?.top ?? 0)}
            left={String(popup.css?.left ?? 0)}
            visible={popup.isVisible}
            className={
                cx({
                    "top": popup.visibleIn?.bottom,
                    "bottom": !popup.visibleIn?.bottom && popup.visibleIn?.top,
                })
            }
        >
            {popup.data && (
                <PopupContainer data={popup.data} hoverElement={hoverElement}/>
            )}
        </PopupWrapper>
    );
});

export default Popup;