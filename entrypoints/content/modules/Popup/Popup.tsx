import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";

import { cutPx, getLeftPosition, getTagMeta, isChildText, targetColorStringToHex } from "./helpers.tsx";
import { colorBoxStyle, flexChildRightStyle, targetSizeStyle, targetTitleStyle } from "./PopupStyle.tsx";
import { BoxLabelContainer, PopupWrapper } from "./Popup.styled.ts";
import cx from "classnames";
import { getNodeComputedStyle } from "@entrypoints/shared/frameAgent/remoteNode";
import { describeFrameContext } from "@entrypoints/content/frameAgentHost";
import { lastPointer } from "./pointer";

// Label on the left, value pushed to the right edge, never touching each other
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  minWidth: 0,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#495057',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#666', whiteSpace: 'nowrap', flexShrink: 0 };

const PopupContainer = ({ data, hoverElement }) => {
  const { height, width, tag, className, id, padding, margin, border, color, backgroundColor, font } = data;
  const fontSize = data["font-size"];
  const fontWeight = data["font-weight"];
  const lineHeight = data["line-height"];
  const fontFamily = (data["font-family"] || "").split(",")[0].replace(/["']/g, "").trim();

  const hasText = !!isChildText(hoverElement?.childNodes);
  // Not instanceof: elements inside same-origin iframes come from another realm
  const isSvg = hoverElement?.namespaceURI === "http://www.w3.org/2000/svg";
  // SVG text is painted with fill, so its CSS color says nothing
  const showTextColor = hasText && !!color && !isSvg;

  // SVG shapes are painted with fill/stroke rather than background/color
  let svgFill = "";
  let svgStroke = "";
  if (isSvg && hoverElement.localName !== "svg") {
    const svgStyle = getNodeComputedStyle(hoverElement);
    svgFill = svgStyle.fill && svgStyle.fill !== "none" ? svgStyle.fill : "";
    svgStroke = svgStyle.stroke && svgStyle.stroke !== "none" ? svgStyle.stroke : "";
  }

  // Images: the intrinsic size and alt text are what people usually check
  const isImage = hoverElement?.localName === "img";
  const imageNatural = isImage && hoverElement.naturalWidth ? `${hoverElement.naturalWidth} × ${hoverElement.naturalHeight}px` : "";
  const imageAlt = isImage ? hoverElement.getAttribute("alt") : null;

  const showSpacing = !!(padding || margin);
  const showColors = !!(backgroundColor || showTextColor || svgFill || svgStroke);
  const showTypography = hasText && !!font;
  const showImage = isImage && (!!imageNatural || imageAlt !== null);
  // Cross-origin frames: say where the element is, or that the frame itself is all we can show
  const frameContext = describeFrameContext(hoverElement);
  const hasBody = showSpacing || showColors || showTypography || !!border || showImage || !!frameContext;

  const renderColorInfo = (label, colorValue, showLabel = true) => {
    if (!colorValue) return null;
    
    const hexValue = targetColorStringToHex(colorValue);
    return (
      <div style={rowStyle}>
        {showLabel && <span style={labelStyle}>{label}:</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            ...colorBoxStyle(colorValue),
            borderRadius: '3px',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }} />
          <span style={{ 
            fontSize: '11px', 
            fontFamily: 'Monaco, "Cascadia Code", "SF Mono", Consolas, monospace',
            color: '#333',
            background: '#f8f9fa',
            padding: '2px 6px',
            borderRadius: '3px',
            border: '1px solid #e9ecef'
          }}>
            {hexValue}
          </span>
        </div>
      </div>
    );
  };

  const renderSpacingValue = (value, truncate = false) => {
    if (!value) return null;
    return (
      <span title={truncate ? value : undefined} style={{
        ...(truncate ? { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }),
        fontSize: '11px', 
        fontFamily: 'Monaco, "Cascadia Code", "SF Mono", Consolas, monospace',
        color: '#495057',
        background: '#f8f9fa',
        padding: '2px 6px',
        borderRadius: '3px',
        border: '1px solid #e9ecef'
      }}>
        {value}
      </span>
    );
  };

  const renderBorderSide = (sideLabel, borderData) => {
    if (!borderData) return null;
    if (borderData.style === 'none' || borderData.style === 'hidden' || parseFloat(borderData.width) === 0) {
      return (
        <div style={{ ...rowStyle, marginBottom: '4px' }}>
          <span style={labelStyle}>{sideLabel}:</span>
          <span style={{ fontSize: '11px', color: '#adb5bd' }}>none</span>
        </div>
      );
    }
    return (
      <div style={{ ...rowStyle, marginBottom: '4px' }}>
        <span style={labelStyle}>{sideLabel}:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#495057' }}>
            {borderData.width} {borderData.style}
          </span>
          <span style={{
            ...colorBoxStyle(borderData.color),
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            border: '1px solid rgba(0,0,0,0.1)'
          }} />
          <span style={{ 
            fontSize: '10px', 
            fontFamily: 'Monaco, "Cascadia Code", "SF Mono", Consolas, monospace',
            color: '#666'
          }}>
            {targetColorStringToHex(borderData.color)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <BoxLabelContainer className="BoxContainer">
      {/* Header with element info and dimensions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: '8px',
        ...(hasBody ? { marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e9ecef' } : {}),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
          {getTagMeta(tag, id, className)}
        </div>
        <div style={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          fontSize: '12px',
          fontWeight: '600',
          color: '#495057',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #dee2e6'
        }}>
          {cutPx(width)} × {cutPx(height)}px
        </div>
      </div>

      {frameContext && (
        <div
          style={{
            marginBottom: '12px',
            fontSize: '11px',
            lineHeight: 1.4,
            color: frameContext.limited ? '#8a4b00' : '#495057',
            background: frameContext.limited ? '#fff4e0' : '#f1f3f5',
            border: `1px solid ${frameContext.limited ? '#f5d2a0' : '#e9ecef'}`,
            borderRadius: '4px',
            padding: '4px 8px',
            overflowWrap: 'anywhere',
          }}
        >
          {frameContext.text}
        </div>
      )}

      {/* Spacing Section */}
      {showSpacing && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#495057', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Spacing
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
            {padding && (
              <div style={rowStyle}>
                <span style={labelStyle}>Padding:</span>
                {renderSpacingValue(padding)}
              </div>
            )}
            {margin && (
              <div style={rowStyle}>
                <span style={labelStyle}>Margin:</span>
                {renderSpacingValue(margin)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Colors Section */}
      {showColors && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#495057', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Colors
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
            {backgroundColor && renderColorInfo('Background', backgroundColor)}
            {showTextColor && renderColorInfo('Text', color)}
            {svgFill && renderColorInfo('Fill', svgFill)}
            {svgStroke && renderColorInfo('Stroke', svgStroke)}
          </div>
        </div>
      )}

      {/* Typography Section */}
      {showTypography && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#495057', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Typography
          </div>
          <div style={{ paddingLeft: '8px' }}>
            <div style={{ ...rowStyle, marginBottom: '4px' }}>
              <span style={labelStyle}>Size / Weight:</span>
              {renderSpacingValue(`${fontSize}${lineHeight && lineHeight !== "normal" ? ` / ${lineHeight}` : ""} · ${fontWeight}`)}
            </div>
            {fontFamily && (
              <div style={rowStyle}>
                <span style={labelStyle}>Family:</span>
                {renderSpacingValue(fontFamily, true)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Section */}
      {showImage && (
        <div style={{ marginBottom: '12px' }}>
          <div style={sectionTitleStyle}>Image</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
            {imageNatural && (
              <div style={rowStyle}>
                <span style={labelStyle}>Natural size:</span>
                {renderSpacingValue(imageNatural)}
              </div>
            )}
            {imageAlt !== null && (
              <div style={rowStyle}>
                <span style={labelStyle}>Alt:</span>
                {renderSpacingValue(imageAlt || '""', true)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Border Section */}
      {border && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#495057', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Border
          </div>
          <div style={{ paddingLeft: '8px' }}>
            {border.type === "single" ? (
              <div style={rowStyle}>
                <span style={labelStyle}>All sides:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#495057' }}>
                    {border.width} {border.style}
                  </span>
                  <span style={{
                    ...colorBoxStyle(border.color),
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }} />
                  <span style={{ 
                    fontSize: '10px', 
                    fontFamily: 'Monaco, "Cascadia Code", "SF Mono", Consolas, monospace',
                    color: '#666'
                  }}>
                    {targetColorStringToHex(border.color)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {renderBorderSide('Top', border.top)}
                {renderBorderSide('Right', border.right)}
                {renderBorderSide('Bottom', border.bottom)}
                {renderBorderSide('Left', border.left)}
              </div>
            )}
          </div>
        </div>
      )}
    </BoxLabelContainer>
  );
};

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
      {popup.data && <PopupContainer data={popup.data} hoverElement={hoverElement} />}
    </PopupWrapper>
  );
});

export default Popup;