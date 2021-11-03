const styleRulesList = [
  'padding-right', 'padding-left', 'padding-top', 'padding-bottom',
  'margin-right', 'margin-left', 'margin-top', 'margin-bottom',
  'height', 'width',
  'font-size', 'font-family', 'font',
  'color',
  'background-color',
  'border-top-color', 'border-top-style', 'border-top-width',
  'border-bottom-color', 'border-bottom-style', 'border-bottom-width',
  'border-left-color', 'border-left-style', 'border-left-width',
  'border-right-color', 'border-right-style', 'border-right-width',
];


const pxToNumber = (px) => {
  return Number(px.replace('px', ''));
}

const getStyle = (oElm, strCssRule) => {
  var strValue = "";
  if (document.defaultView && document.defaultView.getComputedStyle) {
    strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
  } else if (oElm.currentStyle) {
    strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
      return p1.toUpperCase();
    });
    strValue = oElm.currentStyle[strCssRule];
  }
  return strValue;
};

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

  if (sideEqual === topBottomEqual && right === bottom && top === left) {
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

class DomNodeManager {
  nodes = {};

  update = (nodes) => {
    Object
      .keys(nodes)
      .map((key) => {
        this.nodes[key] = nodes[key];
      })
  }

  get = (key) => {
    return this.nodes[key];
  }

  remove = (key) => {
    delete this.nodes[key];
  }

  getBoundingClientRec(value) {
    const nodeEl = typeof value === 'string' ? this.get(value) : value;

    return nodeEl && nodeEl.getBoundingClientRect();
  }

  getStyleByNode = (value, styleRules = styleRulesList) => {
    const nodeEl = typeof value === 'string' ? this.get(value) : value;
    if (!nodeEl) return {}

    let nodeStyle = styleRules.reduce((options, ruleName) => {
        const value = getStyle(nodeEl, ruleName);

        if (value === 'rgba(0, 0, 0, 0)') return options;

        if (ruleName === 'height' || ruleName === 'width') {
          options[ruleName] = `${nodeEl.getBoundingClientRect()[ruleName]}px`;
        } else {
          options[ruleName] = value;
        }
        return options
      },
      {}
    )

    const className = nodeEl.className && typeof nodeEl.className === "string" ? nodeEl.className : '';
    const id = nodeEl.id || '';

    nodeStyle.className = className ? `.${className.replace(/\s+/gi, '.')}` : '';
    nodeStyle.id = id ? `#${id}` : '';
    nodeStyle.tag = nodeEl.localName;

    nodeStyle.padding = normalizePaddingMargin(nodeStyle, 'padding');
    nodeStyle.margin = normalizePaddingMargin(nodeStyle, 'margin');
    nodeStyle.border = normalizeBorder(nodeStyle);
    return nodeStyle;
  };
}


export default new DomNodeManager();