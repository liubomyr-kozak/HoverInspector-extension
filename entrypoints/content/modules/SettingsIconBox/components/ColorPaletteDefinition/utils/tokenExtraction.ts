import { TypographyToken, SpacingToken, BorderRadiusToken, ShadowToken } from '../paletteTypes';

// Helper function to normalize CSS values
const normalizeCSSValue = (value: string): string => {
  if (!value || value === 'none' || value === 'normal') return value;
  
  // Convert px values to consistent format
  if (value.endsWith('px')) {
    return value;
  }
  
  // Convert rem/em to px (assuming 16px base)
  if (value.endsWith('rem')) {
    const num = parseFloat(value);
    return `${Math.round(num * 16)}px`;
  }
  
  if (value.endsWith('em')) {
    const num = parseFloat(value);
    return `${Math.round(num * 16)}px`;
  }
  
  return value;
};

// Extract typography tokens from page elements
export const extractTypographyTokens = (): TypographyToken[] => {
  const elements = Array.from(document.querySelectorAll('*')).filter(el => {
    const computedStyle = getComputedStyle(el);
    const hasText = el.textContent && el.textContent.trim().length > 0;
    const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
    return hasText && isVisible;
  });

  const tokenMap = new Map<string, { 
    token: Omit<TypographyToken, 'sourceElements' | 'frequency'>, 
    elements: Element[] 
  }>();

  elements.forEach(element => {
    const computedStyle = getComputedStyle(element);
    const fontSize = computedStyle.fontSize;
    const fontWeight = computedStyle.fontWeight;
    const lineHeight = computedStyle.lineHeight;
    const letterSpacing = computedStyle.letterSpacing;
    const fontFamily = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim();

    // Create a unique key for this typography combination
    const key = `${fontSize}-${fontWeight}-${lineHeight}-${letterSpacing}`;
    
    if (tokenMap.has(key)) {
      tokenMap.get(key)!.elements.push(element);
    } else {
      // Generate a descriptive name based on font size
      const pxSize = parseInt(fontSize);
      let name = 'Body Text';
      if (pxSize >= 32) name = 'Heading Extra Large';
      else if (pxSize >= 24) name = 'Heading Large';
      else if (pxSize >= 18) name = 'Heading Medium';
      else if (pxSize >= 14) name = 'Body Text';
      else name = 'Small Text';

      tokenMap.set(key, {
        token: {
          id: `t${tokenMap.size + 1}`,
          name,
          fontSize,
          fontWeight,
          lineHeight,
          letterSpacing: letterSpacing !== 'normal' ? letterSpacing : undefined,
          fontFamily: fontFamily !== 'Times' ? fontFamily : undefined,
        },
        elements: [element]
      });
    }
  });

  return Array.from(tokenMap.values()).map(({ token, elements }) => ({
    ...token,
    sourceElements: elements,
    frequency: elements.length
  })).sort((a, b) => b.frequency! - a.frequency!);
};

// Extract spacing tokens from page elements
export const extractSpacingTokens = (): SpacingToken[] => {
  const elements = Array.from(document.querySelectorAll('*')).filter(el => {
    const computedStyle = getComputedStyle(el);
    return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
  });

  const spacingMap = new Map<string, { 
    token: Omit<SpacingToken, 'sourceElements' | 'frequency'>, 
    elements: Element[] 
  }>();

  elements.forEach(element => {
    const computedStyle = getComputedStyle(element);
    const spacingValues = [
      computedStyle.marginTop,
      computedStyle.marginRight,
      computedStyle.marginBottom,
      computedStyle.marginLeft,
      computedStyle.paddingTop,
      computedStyle.paddingRight,
      computedStyle.paddingBottom,
      computedStyle.paddingLeft,
    ].filter(value => value && value !== '0px');

    spacingValues.forEach(value => {
      const normalizedValue = normalizeCSSValue(value);
      if (normalizedValue && normalizedValue !== '0px') {
        const key = normalizedValue;
        
        if (spacingMap.has(key)) {
          if (!spacingMap.get(key)!.elements.includes(element)) {
            spacingMap.get(key)!.elements.push(element);
          }
        } else {
          const pixelValue = parseInt(normalizedValue);
          let name = 'Medium';
          if (pixelValue <= 4) name = 'Extra Small';
          else if (pixelValue <= 8) name = 'Small';
          else if (pixelValue <= 16) name = 'Medium';
          else if (pixelValue <= 24) name = 'Large';
          else name = 'Extra Large';

          const usage = [];
          if (computedStyle.marginTop === value || computedStyle.marginBottom === value) usage.push('margin');
          if (computedStyle.paddingTop === value || computedStyle.paddingBottom === value) usage.push('padding');

          spacingMap.set(key, {
            token: {
              id: `s${spacingMap.size + 1}`,
              name,
              value: normalizedValue,
              pixelValue,
              usage: usage.length > 0 ? usage : ['spacing']
            },
            elements: [element]
          });
        }
      }
    });
  });

  return Array.from(spacingMap.values()).map(({ token, elements }) => ({
    ...token,
    sourceElements: elements,
    frequency: elements.length
  })).sort((a, b) => b.frequency! - a.frequency!);
};

// Extract border radius tokens from page elements
export const extractBorderRadiusTokens = (): BorderRadiusToken[] => {
  const elements = Array.from(document.querySelectorAll('*')).filter(el => {
    const computedStyle = getComputedStyle(el);
    return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
  });

  const borderMap = new Map<string, { 
    token: Omit<BorderRadiusToken, 'sourceElements' | 'frequency'>, 
    elements: Element[] 
  }>();

  elements.forEach(element => {
    const computedStyle = getComputedStyle(element);
    const borderRadius = computedStyle.borderRadius;
    
    if (borderRadius && borderRadius !== '0px') {
      const key = borderRadius;
      
      if (borderMap.has(key)) {
        borderMap.get(key)!.elements.push(element);
      } else {
        let name = 'Medium';
        const tagName = element.tagName.toLowerCase();
        
        if (borderRadius === '50%' || borderRadius.includes('50%')) {
          name = 'Round';
        } else {
          const pixelValue = parseInt(borderRadius);
          if (pixelValue <= 2) name = 'None';
          else if (pixelValue <= 4) name = 'Small';
          else if (pixelValue <= 8) name = 'Medium';
          else name = 'Large';
        }

        const usage = [];
        if (tagName === 'button') usage.push('buttons');
        else if (tagName === 'input') usage.push('inputs');
        else if (tagName === 'div') usage.push('containers');
        else usage.push('elements');

        borderMap.set(key, {
          token: {
            id: `br${borderMap.size + 1}`,
            name,
            value: borderRadius,
            usage
          },
          elements: [element]
        });
      }
    }
  });

  return Array.from(borderMap.values()).map(({ token, elements }) => ({
    ...token,
    sourceElements: elements,
    frequency: elements.length
  })).sort((a, b) => b.frequency! - a.frequency!);
};

// Extract shadow tokens from page elements
export const extractShadowTokens = (): ShadowToken[] => {
  const elements = Array.from(document.querySelectorAll('*')).filter(el => {
    const computedStyle = getComputedStyle(el);
    return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
  });

  const shadowMap = new Map<string, { 
    token: Omit<ShadowToken, 'sourceElements' | 'frequency'>, 
    elements: Element[] 
  }>();

  elements.forEach(element => {
    const computedStyle = getComputedStyle(element);
    const boxShadow = computedStyle.boxShadow;
    
    if (boxShadow && boxShadow !== 'none') {
      const key = boxShadow;
      
      if (shadowMap.has(key)) {
        shadowMap.get(key)!.elements.push(element);
      } else {
        let name = 'Medium';
        const tagName = element.tagName.toLowerCase();
        
        // Analyze shadow properties to determine size
        const shadowParts = boxShadow.split(' ');
        const offsetY = Math.abs(parseInt(shadowParts[1] || '0'));
        const blurRadius = parseInt(shadowParts[2] || '0');
        
        if (offsetY <= 1 && blurRadius <= 2) name = 'Small';
        else if (offsetY <= 4 && blurRadius <= 6) name = 'Medium';
        else if (offsetY <= 10 && blurRadius <= 15) name = 'Large';
        else name = 'Extra Large';

        const usage = [];
        if (tagName === 'button') usage.push('buttons');
        else if (tagName === 'div') usage.push('cards');
        else if (element.getAttribute('role') === 'dialog') usage.push('modals');
        else usage.push('elements');

        shadowMap.set(key, {
          token: {
            id: `sh${shadowMap.size + 1}`,
            name,
            value: boxShadow,
            usage
          },
          elements: [element]
        });
      }
    }
  });

  return Array.from(shadowMap.values()).map(({ token, elements }) => ({
    ...token,
    sourceElements: elements,
    frequency: elements.length
  })).sort((a, b) => b.frequency! - a.frequency!);
};