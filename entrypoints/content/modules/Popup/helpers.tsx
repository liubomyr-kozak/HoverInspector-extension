import { classNameStyle, idStyle, tagStyle } from "./PopupStyle.tsx";
import React from "react";

export const cutPx = (styleValue): number => {
  return Number(Number(styleValue.replace("px", "") || 0).toFixed(2));
};

export const getTagMeta = (tag, id, className) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: '8px', minWidth: 0 }}>
      <span style={{
        ...tagStyle,
        fontSize: '10px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #8a38ae, #9b59b6)',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        flexShrink: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>{tag}</span>
      {id && (
        <span style={{
          ...idStyle,
          fontSize: '11px',
          fontWeight: '600',
          background: '#e3f2fd',
          color: '#1d4ed8', // 5.6:1 on the chip (#1976d2 was 4.0:1)
          padding: '1px 5px',
          borderRadius: '3px',
          border: '1px solid #bbdefb',
          minWidth: 0,
          maxWidth: '140px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }} title={id.startsWith('#') ? id : `#${id}`}>{id.startsWith('#') ? id : `#${id}`}</span>
      )}
      {className && (
        <span style={{
          ...classNameStyle,
          fontSize: '11px',
          fontWeight: '600',
          background: '#fff3e0',
          color: '#c2410c', // 4.7:1 on the chip (#ef6c00 was 2.8:1)
          padding: '1px 5px',
          borderRadius: '3px',
          border: '1px solid #ffcc02',
          minWidth: 0,
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }} title={className.startsWith('.') ? className : `.${className}`}>{className.startsWith('.') ? className : `.${className}`}</span>
      )}
    </div>
  );
};

const arrowWidth = 15;

export function isChildText(childNode) {
  if (!childNode) return;
  return !!Array.prototype.slice.call(childNode).find((el) => el.nodeType === 3);
}

// export function componentToHex(c) {
//     const hex = c.toString(16);
//     return hex.length == 1 ? "0" + hex : hex;
// }

function componentToHex(c) {
  if (typeof c !== "number" || isNaN(c)) return "00";
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// export const targetColorStringToHex = (value) => {
//     if (!value) return '';
//
//     const color = value
//         .replace('rgb(', '')
//         .replace(')', '')
//         .split(',')
//         .map(v => Number(v))
//
//     if (color[3]) return value;
//     return rgbToHex(color[0], color[1], color[2]);
// }

export function targetColorStringToHex(value) {
  // 1. Якщо value порожнє — повертаємо порожній рядок
  if (!value) return "";

  // 2. Якщо це вже HEX (короткий або повний)
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())) {
    return value;
  }

  // 3. Якщо це rgb або rgba
  const rgbMatch = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    // Альфа-канал можна врахувати, якщо треба
    // const a = rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1;
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // 4. Якщо це hsl або hsla — треба конвертувати у rgb, а потім у hex
  const hslMatch = value.match(/hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[,\s/]+([\d.]+))?\s*\)/i);
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;
    // Переводимо hsl у rgb:
    const a = hslMatch[4] !== undefined ? Number(hslMatch[4]) : 1;
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h / 360 + 1 / 3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1 / 3);
    }
    return (
      "#" +
      componentToHex(Math.round(r * 255)) +
      componentToHex(Math.round(g * 255)) +
      componentToHex(Math.round(b * 255))
    );
  }

  // 5. color(srgb ...) і color(display-p3 ...)
  const colorMatch = value.match(/color\((srgb|display-p3)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
  if (colorMatch) {
    const r = Math.round(Number(colorMatch[2]) * 255);
    const g = Math.round(Number(colorMatch[3]) * 255);
    const b = Math.round(Number(colorMatch[4]) * 255);
    // альфа-канал — colorMatch[5], якщо потрібно
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // 6. Імена кольорів або щось інше — можна скористатись браузером
  // Працює тільки у браузері:
  if (typeof window !== "undefined" && window.document) {
    const d = document.createElement("div");
    d.style.color = value;
    // браузер перетворює відоме ім'я на rgb(...), якщо це колір
    document.body.appendChild(d);
    const computed = getComputedStyle(d).color;
    document.body.removeChild(d);
    // Далі рекурсивно парсимо отриманий рядок
    if (computed && computed !== value) {
      return targetColorStringToHex(computed);
    }
  }

  // 7. Якщо нічого не спрацювало — повертаємо як є
  return value;
}

export const getLeftPosition = (popupAndHovered) => {
  if (!popupAndHovered.popup.hasTopPosition && !popupAndHovered.popup.hasBottomPosition) {
    return popupAndHovered.popup.left;
  }

  const hoverInspectorEl = document.querySelector("hover-inspector");

  if (!hoverInspectorEl && !hoverInspectorEl!.shadowRoot) return;

  const topLabelNode = hoverInspectorEl!.shadowRoot!.querySelector(".hover-inspector-distance-line.hover-inspector-top") as any;
  const bottomLabelNode = hoverInspectorEl!.shadowRoot!.querySelector(".hover-inspector-distance-line.hover-inspector-bottom") as any;

  const labelTopContainer = topLabelNode?.offsetTop;
  const labelTop = topLabelNode?.children?.[0].offsetTop;
  const labelBottomContainer = bottomLabelNode?.offsetTop;
  const labelBottom = bottomLabelNode?.children?.[0]?.offsetTop;

  const coveredLabelTopPx = popupAndHovered.popup.hasBottomPosition
    ? labelBottom + labelBottomContainer
    : labelTop + labelTopContainer;

  const isPopupCoverLabel =
    popupAndHovered.popup.top <= coveredLabelTopPx &&
    popupAndHovered.popup.top + popupAndHovered.popup.height > coveredLabelTopPx;

  if (!isPopupCoverLabel) return popupAndHovered.popup.left;


  return (
    popupAndHovered.popup.left +
    cutPx(popupAndHovered.hovered.width) +
    popupAndHovered.hovered.marginLeft +
    popupAndHovered.hovered.paddingLeft +
    popupAndHovered.hovered.paddingRight -
    arrowWidth
  );
};
