/**
 * Константи CSS кольорів
 * 
 * Містить всі стандартні CSS ключові слова для кольорів згідно зі специфікацією W3C.
 * Використовується для визначення чи є значення кольором у функції isColorValue.
 */

/** CSS ключові слова для системних та спеціальних кольорів */
export const CSS_SYSTEM_KEYWORDS = [
  'transparent', 
  'currentColor', 
  'inherit', 
  'initial', 
  'unset', 
  'revert'
] as const;

/** Стандартні іменовані кольори CSS */
export const CSS_NAMED_COLORS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 
  'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 
  'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 
  'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgrey', 'darkgreen', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 
  'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue',
  'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 
  'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
  'gray', 'grey', 'green', 'greenyellow', 'honeydew', 'hotpink', 'indianred',
  'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
  'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
  'lightgray', 'lightgrey', 'lightgreen', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
  'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta',
  'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
  'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
  'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin',
  'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum',
  'powderblue', 'purple', 'red', 'rosybrown', 'royalblue', 'saddlebrown',
  'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver',
  'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
  'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
] as const;

/** Всі CSS кольорові ключові слова */
export const CSS_COLOR_KEYWORDS = [
  ...CSS_SYSTEM_KEYWORDS,
  ...CSS_NAMED_COLORS
] as const;

/** Регулярні вирази для розпізнавання кольорових форматів */
export const COLOR_REGEX_PATTERNS = {
  /** HEX кольори: #RGB, #RRGGBB, #RGBA, #RRGGBBAA */
  hex: /^#[0-9a-fA-F]{3,8}$/,
  
  /** RGB/RGBA функції з гнучким форматуванням */
  rgb: /^rgba?\s*\([^)]+\)$/i,
  
  /** HSL/HSLA функції з гнучким форматуванням */
  hsl: /^hsla?\s*\([^)]+\)$/i,
  
  /** Сучасні CSS кольорові функції */
  modernCSS: /^(color|lab|lch|oklab|oklch)\s*\([^)]+\)$/i
} as const;