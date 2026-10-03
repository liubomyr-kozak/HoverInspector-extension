/**
 * Utility functions for color analysis
 * 
 * This module provides functions for analyzing colors, calculating contrast ratios,
 * and converting colors between different formats (RGB, HEX, HSL, HSV).
 */

export type RGBA = { r: number; g: number; b: number; a: number };

const RGB_FUNCTION_RE =
  /^rgba?\(\s*(-?[\d.]+)(?:\s*,\s*|\s+)(-?[\d.]+)(?:\s*,\s*|\s+)(-?[\d.]+)(?:\s*(?:,|\/)\s*([\d.]+%?))?\s*\)$/i;

const clampByte = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

const colorCache = new Map<string, RGBA | null>();
let parseContext: CanvasRenderingContext2D | null | undefined;

const getParseContext = (): CanvasRenderingContext2D | null => {
  if (parseContext === undefined) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      parseContext = canvas.getContext("2d", { willReadFrequently: true });
    } catch {
      parseContext = null;
    }
  }
  return parseContext;
};

/**
 * Parses any CSS color the browser understands (rgb, hex, named, hsl, lab, oklch,
 * color(display-p3 ...), ...) into sRGB bytes by painting it on a 1x1 canvas.
 */
const parseWithCanvas = (color: string): RGBA | null => {
  const ctx = getParseContext();
  if (!ctx) return null;

  // An invalid value leaves fillStyle untouched: detect that with two sentinels
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  const first = ctx.fillStyle;
  ctx.fillStyle = "#fff";
  ctx.fillStyle = color;
  if (first !== ctx.fillStyle) return null;

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, alpha] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: Math.round((alpha / 255) * 1000) / 1000 };
};

/**
 * Converts a CSS color to RGB format
 * @param color The CSS color to convert
 * @returns An object with r, g, b, and a properties, or null if the color can't be parsed
 */
export const colorToRgb = (color: string): RGBA | null => {
  if (!color) return null;
  const key = color.trim();

  if (colorCache.has(key)) return colorCache.get(key)!;

  let result: RGBA | null = null;
  // Fast path for the rgb()/rgba() strings getComputedStyle returns for sRGB colours
  const match = key.match(RGB_FUNCTION_RE);
  if (match) {
    const alphaRaw = match[4];
    const a = alphaRaw === undefined ? 1 : alphaRaw.endsWith("%") ? parseFloat(alphaRaw) / 100 : parseFloat(alphaRaw);
    result = { r: clampByte(+match[1]), g: clampByte(+match[2]), b: clampByte(+match[3]), a: Math.min(1, Math.max(0, a)) };
  } else if (key.toLowerCase() === "transparent") {
    result = { r: 0, g: 0, b: 0, a: 0 };
  } else {
    result = parseWithCanvas(key);
  }

  if (colorCache.size > 2000) colorCache.clear();
  colorCache.set(key, result);
  return result;
};

/**
 * Alpha-composites `top` over `bottom` (bottom is treated as opaque)
 */
export const compositeColors = (top: RGBA, bottom: RGBA): RGBA => {
  const a = top.a;
  return {
    r: Math.round(top.r * a + bottom.r * (1 - a)),
    g: Math.round(top.g * a + bottom.g * (1 - a)),
    b: Math.round(top.b * a + bottom.b * (1 - a)),
    a: 1,
  };
};

const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };

const toCssRgb = ({ r, g, b, a }: RGBA) => (a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`);

/**
 * Background colour actually visible behind an element: walks up the ancestors and
 * composites (semi-)transparent backgrounds until an opaque one is found (white if none).
 * Background images are not taken into account.
 */
export const getEffectiveBackgroundColor = (element: Element): string => {
  const layers: RGBA[] = [];
  let current: Element | null = element;

  while (current) {
    const rgba = colorToRgb(window.getComputedStyle(current).backgroundColor);
    if (rgba && rgba.a > 0) {
      layers.push(rgba);
      if (rgba.a >= 1) break;
    }
    current = current.parentElement;
  }

  // Composite from the bottom-most layer upwards, starting on the white canvas
  const result = layers.reduceRight<RGBA>((below, layer) => compositeColors(layer, below), WHITE);
  return toCssRgb(result);
};

/**
 * Calculates the relative luminance of a color
 * @param rgb The RGB values of the color
 * @returns The relative luminance value between 0 and 1
 */
export const calculateLuminance = (rgb: { r: number, g: number, b: number }): number => {
  // Convert RGB to sRGB
  const sRGB = {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255
  };
  
  // Calculate the luminance
  const r = sRGB.r <= 0.03928 ? sRGB.r / 12.92 : Math.pow((sRGB.r + 0.055) / 1.055, 2.4);
  const g = sRGB.g <= 0.03928 ? sRGB.g / 12.92 : Math.pow((sRGB.g + 0.055) / 1.055, 2.4);
  const b = sRGB.b <= 0.03928 ? sRGB.b / 12.92 : Math.pow((sRGB.b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calculates the contrast ratio between two colors
 * @param color1 The first color
 * @param color2 The second color
 * @returns The contrast ratio between the two colors
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const parsed1 = colorToRgb(color1);
  const parsed2 = colorToRgb(color2);

  if (!parsed1 || !parsed2) return 1;

  // color2 is the background: a translucent background sits on white, and a
  // translucent foreground is blended with the background it is drawn on
  const rgb2 = parsed2.a < 1 ? compositeColors(parsed2, WHITE) : parsed2;
  const rgb1 = parsed1.a < 1 ? compositeColors(parsed1, rgb2) : parsed1;

  const luminance1 = calculateLuminance(rgb1);
  const luminance2 = calculateLuminance(rgb2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Determines if a color is light or dark
 * @param color The color to check
 * @returns True if the color is light, false if it's dark
 */
export const isLightColor = (color: string): boolean => {
  const rgb = colorToRgb(color);
  if (!rgb) return true;
  
  const luminance = calculateLuminance(rgb);
  return luminance > 0.5;
};

/**
 * Evaluates the readability of text with a given color on a given background
 * @param textColor The text color
 * @param backgroundColor The background color
 * @returns An object with information about the readability
 */
export const evaluateReadability = (textColor: string, backgroundColor: string): {
  contrastRatio: number;
  isReadable: boolean;
  wcagLevel: 'AAA' | 'AA' | 'Fail';
  recommendation?: string;
} => {
  const contrastRatio = calculateContrastRatio(textColor, backgroundColor);
  
  // WCAG 2.0 levels
  const isLargeText = false; // Assuming normal text size
  const wcagAA = isLargeText ? 3 : 4.5;
  const wcagAAA = isLargeText ? 4.5 : 7;
  
  let wcagLevel: 'AAA' | 'AA' | 'Fail' = 'Fail';
  if (contrastRatio >= wcagAAA) {
    wcagLevel = 'AAA';
  } else if (contrastRatio >= wcagAA) {
    wcagLevel = 'AA';
  }
  
  const isReadable = contrastRatio >= wcagAA;
  
  let recommendation = '';
  if (!isReadable) {
    const textRgb = colorToRgb(textColor);
    const bgRgb = colorToRgb(backgroundColor);
    
    if (textRgb && bgRgb) {
      const textLuminance = calculateLuminance(textRgb);
      const bgLuminance = calculateLuminance(bgRgb);
      
      if (textLuminance > bgLuminance) {
        recommendation = 'Consider using a darker text color or a lighter background color.';
      } else {
        recommendation = 'Consider using a lighter text color or a darker background color.';
      }
    }
  }
  
  return {
    contrastRatio,
    isReadable,
    wcagLevel,
    ...(recommendation ? { recommendation } : {})
  };
};

/**
 * Converts an RGB color to HEX format
 * @param rgb The RGB values of the color
 * @returns The color in HEX format (e.g., #FF5733)
 */
export const rgbToHex = (rgb: { r: number, g: number, b: number, a?: number }): string => {
  const { r, g, b, a = 1 } = rgb;
  
  // Convert RGB components to HEX
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  
  // If alpha is 1 (fully opaque), return standard 6-digit HEX
  if (a === 1) {
    return `#${rHex}${gHex}${bHex}`.toUpperCase();
  }
  
  // Otherwise, include alpha channel in 8-digit HEX
  const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}${aHex}`.toUpperCase();
};

/**
 * Converts an RGB color to HSL format
 * @param rgb The RGB values of the color
 * @returns The color in HSL format (e.g., hsl(0, 100%, 50%))
 */
export const rgbToHsl = (rgb: { r: number, g: number, b: number, a?: number }): string => {
  const { r, g, b, a = 1 } = rgb;
  
  // Convert RGB to [0, 1] range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  
  // Calculate HSL values
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / delta + 4) * 60;
    }
  }
  
  // Round values
  h = Math.round(h);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  // Return HSL string
  if (a === 1) {
    return `hsl(${h}, ${s}%, ${lPercent}%)`;
  } else {
    return `hsla(${h}, ${s}%, ${lPercent}%, ${a.toFixed(2)})`;
  }
};

/**
 * Converts an RGB color to HSV format
 * @param rgb The RGB values of the color
 * @returns The color in HSV format (e.g., hsv(0, 100%, 100%))
 */
export const rgbToHsv = (rgb: { r: number, g: number, b: number, a?: number }): string => {
  const { r, g, b, a = 1 } = rgb;
  
  // Convert RGB to [0, 1] range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  
  // Calculate HSV values
  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  const v = max;
  
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / delta + 4) * 60;
    }
  }
  
  // Round values
  h = Math.round(h);
  s = Math.round(s * 100);
  const vPercent = Math.round(v * 100);
  
  // Return HSV string
  if (a === 1) {
    return `hsv(${h}, ${s}%, ${vPercent}%)`;
  } else {
    return `hsva(${h}, ${s}%, ${vPercent}%, ${a.toFixed(2)})`;
  }
};

/**
 * Converts a CSS color to multiple color formats
 * @param color The CSS color to convert
 * @returns An object with the color in different formats
 */
export const getColorInAllFormats = (color: string): {
  rgb: string;
  hex: string;
  hsl: string;
  hsv: string;
} | null => {
  const rgbObj = colorToRgb(color);
  if (!rgbObj) return null;
  
  const { r, g, b, a } = rgbObj;
  const rgbString = a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  
  return {
    rgb: rgbString,
    hex: rgbToHex(rgbObj),
    hsl: rgbToHsl(rgbObj),
    hsv: rgbToHsv(rgbObj)
  };
};

/**
 * Analyzes a button's colors for accessibility and usability
 * @param element The button element to analyze
 * @returns An object with information about the button's colors
 */
export const analyzeButtonColors = (element: Element): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  isLightBackground: boolean;
  contrastRatio: number;
  isReadable: boolean;
  wcagLevel: 'AAA' | 'AA' | 'Fail';
  recommendation?: string;
} => {
  const computedStyle = window.getComputedStyle(element);
  
  const backgroundColor = computedStyle.backgroundColor;
  const textColor = computedStyle.color;
  const borderColor = computedStyle.borderColor;
  // Transparent backgrounds show whatever is behind them: use that for contrast
  const visibleBackground = getEffectiveBackgroundColor(element);

  const isLightBackground = isLightColor(visibleBackground);
  const readabilityInfo = evaluateReadability(textColor, visibleBackground);
  
  return {
    backgroundColor,
    textColor,
    borderColor,
    isLightBackground,
    ...readabilityInfo
  };
};