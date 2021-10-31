const styleRules = [
  'padding-right', 'padding-left', 'padding-top', 'padding-bottom',
  'margin-right', 'margin-left', 'margin-top', 'margin-bottom',
  'height', 'width', 'font-size', 'color', 'background-color', 'font-family',
  'font'
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

const normalizePaddingMargin = (nodeStyle, rule) => {
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

  getStyleByNode = (value) => {
    const nodeEl = typeof value === 'string' ? this.get(value) : value;

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
    return nodeStyle;
  };
}


export default new DomNodeManager();