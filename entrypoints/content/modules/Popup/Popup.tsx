import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";

import { cutPx, getLeftPosition } from "./helpers.tsx";
import { PopupWrapper } from "./Popup.styled.ts";
import cx from "classnames";
import { describeFrameContext } from "@entrypoints/content/frameAgentHost";
import { useHoverCardConfig } from "@entrypoints/shared/hoverCard/store";
import { HoverCardView } from "./HoverCardView";
import { lastPointer } from "./pointer";

const ARROW_HEIGHT = 8;
const CURSOR_OFFSET = 16;


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
  if (!clientRectHoveredNode)
    return {
      css: { top: 0, left: 0 },
      visibleIn: { top: false, bottom: false },
      isVisible: false,
      data: null,
    };

  const { width } = hoverNodeParams || {};
  const { top = 0, bottom = 0, left = 0 } = clientRectHoveredNode || {};

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
    left: 0,
  };

  // Визначаємо бажану позицію — спочатку знизу, якщо не влазить — зверху
  const popupBottomPosition = bottom + ARROW_HEIGHT + marginBottom;
  const popupTopPosition = top - popupHeight - marginTop - ARROW_HEIGHT;

  // Чи вміщається попап знизу?
  const canShowBottom = popupBottomPosition + popupHeight <= clientWindow.bottom;
  // Чи вміщається зверху?
  const canShowTop = popupTopPosition >= clientWindow.top;

  // Видимість у кожній позиції
  let visibleIn = { top: canShowTop, bottom: canShowBottom };

  // Визначаємо top
  let topPositionProposal;
  if (canShowBottom) {
    topPositionProposal = popupBottomPosition;
  } else if (canShowTop) {
    topPositionProposal = popupTopPosition;
  } else {
    // Fits neither above nor below (a section taller than the viewport): follow the pointer instead of
    // pinning the tooltip to the top-left corner, where the inspector panel usually sits
    visibleIn = { top: false, bottom: false };
    if (lastPointer.x >= 0) {
      let cursorLeft = lastPointer.x + CURSOR_OFFSET;
      let cursorTop = lastPointer.y + CURSOR_OFFSET;
      if (cursorLeft + popupWidth > clientWindow.right - 10) cursorLeft = lastPointer.x - CURSOR_OFFSET - popupWidth;
      if (cursorTop + popupHeight > clientWindow.bottom - 10) cursorTop = lastPointer.y - CURSOR_OFFSET - popupHeight;
      return {
        css: {
          top: Math.max(10, Math.min(cursorTop, clientWindow.bottom - popupHeight - 10)),
          left: Math.max(10, Math.min(cursorLeft, clientWindow.right - popupWidth - 10)),
        },
        visibleIn,
        isVisible: true,
        data: null,
      };
    }
    topPositionProposal = 10;
  }

  // console.group()
  // console.groupEnd()

  // Визначаємо left
  // Align with the element itself: centred blocks (margin: auto) have huge left margins that
  // pushed the card to the far left, under the docked panel
  let leftProposal = left;

  // Якщо права межа попапа (leftProposal + ширина попапа) виходить за межу viewport (clientWindow.right)
  // То переміщаємо попап вліво так, щоб він повністю помістився у вікно,
  // але не ближче ніж на 10px до правого краю.
  // Math.max(10, ...) гарантує, що попап не піде далі 10px від лівого краю viewport.
  if (leftProposal + popupWidth > clientWindow.right) {
    leftProposal = Math.max(10, clientWindow.right - popupWidth - 10);
  }

  if (leftProposal < 0) leftProposal = 10;

  // Step around the open tool panel instead of sliding underneath it
  const panelRect = document
    .querySelector("hover-inspector")
    ?.shadowRoot?.querySelector(".rnd-container")
    ?.getBoundingClientRect();
  if (panelRect && panelRect.width > 0) {
    const overlapsVertically = topPositionProposal < panelRect.bottom && topPositionProposal + popupHeight > panelRect.top;
    const overlapsHorizontally = leftProposal < panelRect.right && leftProposal + popupWidth > panelRect.left;
    if (overlapsVertically && overlapsHorizontally) {
      if (panelRect.right + 8 + popupWidth <= clientWindow.right - 10) leftProposal = panelRect.right + 8;
      else if (panelRect.left - 8 - popupWidth >= 10) leftProposal = panelRect.left - 8 - popupWidth;
    }
  }

  // Обраховуємо фінальний left через getLeftPosition, якщо він є
  let finalLeft =
    typeof getLeftPosition === "function"
      ? getLeftPosition({
          popup: {
            top: topPositionProposal,
            height: popupHeight,
            left: leftProposal,
            hasTopPosition: !canShowBottom && canShowTop,
            hasBottomPosition: canShowBottom,
          },
          hovered: { paddingLeft, marginLeft, paddingRight, width },
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
    data: null,
  };
};

const Popup = React.memo(() => {
  const listenChangeUserAction = useSelector((state) => (state as any).app.userAction);
  const popupRef = useRef<any>(null);
  const lockRerender = useRef(false);
  // Hover/scroll that arrived while the popup was being measured; replayed on unlock so the last one wins
  const pendingUpdate = useRef<string | null>(null);
  const [popup, setPopup] = useState({
    isVisible: false,
    visibleIn: {} as any,
    data: null,
    css: { top: 0, left: 0 },
  });

  const updatePopup = useCallback((activeElementType) => {
    if (lockRerender.current) {
      pendingUpdate.current = activeElementType;
      return;
    }

    const hoverNodeParams = DomNodeManager.getStyleByNode(activeElementType);

    if (!hoverNodeParams || !Object.keys(hoverNodeParams).length) return;

    const data = {
      ...hoverNodeParams,
      backgroundColor: hoverNodeParams["background-color"],
    };

    setPopup((prev) => ({
      ...prev,
      data: data as any,
    }));

    lockRerender.current = true;

    // Затримка 0, щоб оновився DOM (рівень next tick)
    setTimeout(() => {
      const position = getPopupPosition(hoverNodeParams, popupRef);


      setPopup((prev) => ({
        ...prev,
        ...position,
        data: data as any,
      }));

      // Розблокуємо ререндер через ще одну "подію"
      setTimeout(() => {
        lockRerender.current = false;

        if (pendingUpdate.current) {
          const next = pendingUpdate.current;
          pendingUpdate.current = null;
          updatePopupRef.current(next);
        }
      }, 0);
    }, 0);
  }, []);
  const updatePopupRef = useRef(updatePopup);
  updatePopupRef.current = updatePopup;

  useEffect(() => {
    updatePopup("hoverElement");

    const hoverNodeParams = DomNodeManager.getStyleByNode("hoverElement");

    if (!hoverNodeParams || !Object.keys(hoverNodeParams).length) {
      setPopup((prev) => ({
        ...prev,
        isVisible: false,
        data: null,
      }));
    }
  }, [listenChangeUserAction]);

  // A different set of rows changes the card's size: measure and place it again
  const cardConfig = useHoverCardConfig();
  const firstConfig = useRef(true);
  useEffect(() => {
    if (firstConfig.current) {
      firstConfig.current = false;
      return;
    }
    updatePopup("hoverElement");
  }, [cardConfig]);

  const hoverElement = DomNodeManager.get("hoverElement");

  return (
    <PopupWrapper
      ref={popupRef}
      top={String(popup.css?.top ?? 0)}
      left={String(popup.css?.left ?? 0)}
      visible={popup.isVisible}
      className={cx({
        top: popup.visibleIn?.bottom,
        bottom: !popup.visibleIn?.bottom && popup.visibleIn?.top,
      })}
    >
      {popup.data && (
        <HoverCardView
          node={hoverElement}
          summary={popup.data}
          config={cardConfig}
          frameContext={describeFrameContext(hoverElement)}
        />
      )}
    </PopupWrapper>
  );
});

export default Popup;