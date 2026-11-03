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


// // Fix applied without changing the style of the function
// const getPopupPosition = (hoverNodeParams, popupRef) => {
//     const clientRectHoveredNode = DomNodeManager.getBoundingClientRec("hoverElement");
//     if (!clientRectHoveredNode) return {isVisible: false}; // 1. Check
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
//     // 2. Fixed top/bottom check
//     result.visibleIn.top = popupTopPosition >= 0;
//     result.visibleIn.bottom = (popupBottomPosition + popupHeight) <= clientWindow.bottom;
//
//     // 3. Work out top
//     const topPositionProposal = result.visibleIn.bottom
//         ? popupBottomPosition
//         : result.visibleIn.top
//             ? popupTopPosition
//             : 10;
//
//     let leftProposal = left - marginLeft;
//
//     // 4. Fix left (right edge of the viewport)
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
//     // 5. Fallback if it overflows at the bottom or right
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
  // Coordinates of the hovered element
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

  // Parse margins and paddings
  const marginBottom = cutPx(hoverNodeParams?.["margin-bottom"]);
  const marginTop = cutPx(hoverNodeParams?.["margin-top"]);
  const marginLeft = cutPx(hoverNodeParams?.["margin-left"]);
  const paddingLeft = cutPx(hoverNodeParams?.["padding-left"]);
  const paddingRight = cutPx(hoverNodeParams?.["padding-right"]);

  // Popup size
  const popupHeight = popupRef.current ? popupRef.current.offsetHeight : 0;
  const popupWidth = popupRef.current ? popupRef.current.offsetWidth : 0;

  // Window bounds
  const clientWindow = {
    bottom: window.innerHeight || document.documentElement.clientHeight,
    right: window.innerWidth || document.documentElement.clientWidth,
    top: 0,
    left: 0,
  };

  // Preferred position: below first, above if it doesn't fit
  const popupBottomPosition = bottom + ARROW_HEIGHT + marginBottom;
  const popupTopPosition = top - popupHeight - marginTop - ARROW_HEIGHT;

  // Does the popup fit below?
  const canShowBottom = popupBottomPosition + popupHeight <= clientWindow.bottom;
  // Does it fit above?
  const canShowTop = popupTopPosition >= clientWindow.top;

  // Visibility in each position
  let visibleIn = { top: canShowTop, bottom: canShowBottom };

  // Work out top
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

  // Work out left
  // Align with the element itself: centred blocks (margin: auto) have huge left margins that
  // pushed the card to the far left, under the docked panel
  let leftProposal = left;

  // If the popup's right edge (leftProposal + popup width) goes past the viewport (clientWindow.right),
  // move the popup left so that it fits in the window,
  // but no closer than 10px to the right edge.
  // Math.max(10, ...) keeps the popup at least 10px from the left edge of the viewport.
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

  // Final left from getLeftPosition, if it is available
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

  // Extra check so the popup stays inside the window
  let finalTop = topPositionProposal;
  if (finalLeft + popupWidth > clientWindow.right) {
    // Overflows on the right: move it left
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

  // Return the result in the expected shape
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

    // Zero delay so the DOM updates (next tick)
    setTimeout(() => {
      const position = getPopupPosition(hoverNodeParams, popupRef);


      setPopup((prev) => ({
        ...prev,
        ...position,
        data: data as any,
      }));

      // Unblock the re-render with one more "event"
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