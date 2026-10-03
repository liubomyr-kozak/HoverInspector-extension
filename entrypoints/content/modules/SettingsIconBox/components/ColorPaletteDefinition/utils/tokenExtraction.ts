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

/**
 * Several values fall into the same size bucket (16px and 19.92px are both "Large"): number the
 * tokens of a bucket from the smallest value up ("Large", "Large 2") so every token has its own name
 */
const withUniqueNames = <T extends { name: string }>(tokens: T[], sizeOf: (token: T) => number): T[] => {
  const byName = new Map<string, T[]>();
  tokens.forEach((token) => byName.set(token.name, [...(byName.get(token.name) || []), token]));
  const names = new Map<T, string>();
  byName.forEach((group, name) => {
    [...group]
      .sort((a, b) => sizeOf(a) - sizeOf(b))
      .forEach((token, index) => names.set(token, index === 0 ? name : `${name} ${index + 1}`));
  });
  return tokens.map((token) => ({ ...token, name: names.get(token) || token.name }));
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

  return withUniqueNames(
    Array.from(tokenMap.values()).map(({ token, elements }) => ({
      ...token,
      sourceElements: elements,
      frequency: elements.length
    })).sort((a, b) => b.frequency! - a.frequency!),
    (token) => parseFloat(token.fontSize) * 1000 + (parseFloat(String(token.fontWeight)) || 0),
  );
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
          const pixelValue = parseFloat(normalizedValue);
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

  return withUniqueNames(
    Array.from(spacingMap.values()).map(({ token, elements }) => ({
      ...token,
      sourceElements: elements,
      frequency: elements.length
    })).sort((a, b) => b.frequency! - a.frequency!),
    (token) => token.pixelValue,
  );
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

  return withUniqueNames(
    Array.from(borderMap.values()).map(({ token, elements }) => ({
      ...token,
      sourceElements: elements,
      frequency: elements.length
    })).sort((a, b) => b.frequency! - a.frequency!),
    (token) => parseFloat(token.value) || 0,
  );
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
        
        // Analyze shadow properties to determine size. The computed value starts with
        // the colour ("rgba(0, 0, 0, 0.1) 0px 2px 6px 0px"), so read the lengths of the
        // first shadow instead of splitting on spaces.
        const firstShadow = boxShadow.replace(/\([^)]*\)/g, '()').split(',')[0];
        const lengths = (firstShadow.match(/-?\d*\.?\d+px/g) || []).map((v) => parseFloat(v));
        const offsetY = Math.abs(lengths[1] || 0);
        const blurRadius = lengths[2] || 0;
        
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

  return withUniqueNames(
    Array.from(shadowMap.values()).map(({ token, elements }) => ({
      ...token,
      sourceElements: elements,
      frequency: elements.length
    })).sort((a, b) => b.frequency! - a.frequency!),
    (token) => {
      const lengths = (token.value.replace(/\([^)]*\)/g, '()').match(/-?\d*\.?\d+px/g) || []).map((v) => parseFloat(v));
      return Math.abs(lengths[1] || 0) * 1000 + (lengths[2] || 0);
    },
  );
};