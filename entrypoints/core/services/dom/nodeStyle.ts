// @ts-nocheck
/**
 * The style summary the inspector shows for an element (tooltip, CSS output, box model). Kept free of
 * React and the DOM node registry so the frame agent (content script in cross-origin frames) can build
 * the same summary inside the frame and send it to the top frame.
 */

export const styleRulesList = [
    'padding-right', 'padding-left', 'padding-top', 'padding-bottom',
    'margin-right', 'margin-left', 'margin-top', 'margin-bottom',
    'height', 'width',
    'font-size', 'font-family', 'font', "font-weight", "line-height", "letter-spacing", "text-align",
    'color',
    "background", 'background-color', "background-image",
    'border-top-color', 'border-top-style', 'border-top-width', 'border-bottom-color', 'border-bottom-style', 'border-bottom-width', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right-color', 'border-right-style', 'border-right-width',
    'border-radius',
    'cursor',
    'outline-color',
    'text-decoration-color',
    "opacity",
    "transform",
    "transition",
    'box-shadow',
];


const pxToNumber = (px) => {
    return Number(String(px ?? '').replace('px', ''));
}

export const normalizePaddingMargin = (nodeStyle, rule) => {
    const right = pxToNumber(nodeStyle[`${rule}-right`]);
    const left = pxToNumber(nodeStyle[`${rule}-left`]);
    const top = pxToNumber(nodeStyle[`${rule}-top`]);
    const bottom = pxToNumber(nodeStyle[`${rule}-bottom`]);

    if (!right && !left && !top && !bottom) {
        return false
    }

    const sideEqual = right === left
    const topBottomEqual = top === bottom

    if (top === right && right === bottom && bottom === left) {
        return `${top}px`
    }

    if (sideEqual && topBottomEqual) {
        return `${top}px ${right}px`
    }

    if (sideEqual && top !== bottom) {
        return `${top}px ${right}px ${bottom}px`
    }

    return `${top}px ${right}px ${bottom}px ${left}px`
}

export const normalizeBorder = (nodeStyle) => {
    const rule = "border";
    const borderRight = `${rule}-right`;
    const borderLeft = `${rule}-left`;
    const borderTop = `${rule}-top`;
    const borderBottom = `${rule}-bottom`;

    const borderRightStyle = `${nodeStyle[`${borderRight}-style`]}`;
    const borderRightColor = nodeStyle[`${borderRight}-color`];
    const borderRightWidth = nodeStyle[`${borderRight}-width`];

    const borderLeftStyle = `${nodeStyle[`${borderLeft}-style`]}`;
    const borderLeftColor = nodeStyle[`${borderLeft}-color`];
    const borderLeftWidth = nodeStyle[`${borderLeft}-width`];

    const borderTopStyle = `${nodeStyle[`${borderTop}-style`]}`;
    const borderTopColor = nodeStyle[`${borderTop}-color`];
    const borderTopWidth = nodeStyle[`${borderTop}-width`];

    const borderBottomStyle = `${nodeStyle[`${borderBottom}-style`]}`;
    const borderBottomColor = nodeStyle[`${borderBottom}-color`];
    const borderBottomWidth = nodeStyle[`${borderBottom}-width`];

    const right = `${borderRightWidth} ${borderRightStyle} ${borderRightColor}`;
    const left = `${borderLeftWidth} ${borderLeftStyle} ${borderLeftColor}`;
    const top = `${borderTopWidth} ${borderTopStyle} ${borderTopColor}`;
    const bottom = `${borderBottomWidth} ${borderBottomStyle} ${borderBottomColor}`;

    if (borderLeftStyle === borderRightStyle &&
        borderTopStyle === borderBottomStyle &&
        borderLeftStyle === borderTopStyle &&
        borderLeftStyle === 'none'
    ) {
        return false
    }

    if (right === left &&
        top === bottom &&
        right === top &&
        right === 'undefined undefined undefined'
    ) {
        return false
    }

    if (!right && !left && !top && !bottom) {
        return false
    }

    if (right === left && top === left && right === top) {
        return {
            type: 'single',
            width: borderRightWidth,
            style: borderRightStyle,
            color: borderRightColor,
            right: {
                width: borderRightWidth,
                style: borderRightStyle,
                color: borderRightColor
            },
            left: {
                width: borderLeftWidth,
                style: borderLeftStyle,
                color: borderLeftColor
            },
            top: {
                width: borderTopWidth,
                style: borderTopStyle,
                color: borderTopColor
            },
            bottom: {
                width: borderBottomWidth,
                style: borderBottomStyle,
                color: borderBottomColor
            },
        }
    }

    return {
        type: 'multiple',
        right: {
            width: borderRightWidth,
            style: borderRightStyle,
            color: borderRightColor
        },
        left: {
            width: borderLeftWidth,
            style: borderLeftStyle,
            color: borderLeftColor
        },
        top: {
            width: borderTopWidth,
            style: borderTopStyle,
            color: borderTopColor
        },
        bottom: {
            width: borderBottomWidth,
            style: borderBottomStyle,
            color: borderBottomColor
        },
    }
}

export type StyleSummary = Record<string, any>;

/**
 * The summary for an element, from a computed-style lookup and its on-screen box. `width`/`height` are
 * the rendered border box (after transforms), not the computed CSS values.
 */
export const buildStyleSummary = (
    getValue: (prop: string) => string,
    rect: { width: number; height: number },
    meta: { className: string; id: string; tag: string },
    styleRules: string[] = styleRulesList,
): StyleSummary => {
    const nodeStyle = styleRules.reduce((options, ruleName) => {
        const value = getValue(ruleName);

        if (value === 'rgba(0, 0, 0, 0)') return options;

        if (ruleName === 'height' || ruleName === 'width') {
            options[ruleName] = `${rect[ruleName]}px`;
        } else {
            options[ruleName] = value;
        }
        return options
    }, {} as StyleSummary);

    nodeStyle.className = meta.className ? `.${meta.className.replace(/\s+/gi, '.')}` : '';
    nodeStyle.id = meta.id ? `#${meta.id}` : '';
    nodeStyle.tag = meta.tag;

    nodeStyle.padding = normalizePaddingMargin(nodeStyle, 'padding');
    nodeStyle.margin = normalizePaddingMargin(nodeStyle, 'margin');
    nodeStyle.border = normalizeBorder(nodeStyle);

    return nodeStyle;
};
