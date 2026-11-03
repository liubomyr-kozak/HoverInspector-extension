/**
 * CSS colour constants
 * 
 * All standard CSS colour keywords from the W3C specification.
 * Used by isColorValue to tell whether a value is a colour.
 */

/** CSS keywords for system and special colours */
export const CSS_SYSTEM_KEYWORDS = [
  'transparent', 
  'currentColor', 
  'inherit', 
  'initial', 
  'unset', 
  'revert'
] as const;

/** Standard CSS named colours */
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

/** All CSS colour keywords */
export const CSS_COLOR_KEYWORDS = [
  ...CSS_SYSTEM_KEYWORDS,
  ...CSS_NAMED_COLORS
] as const;

/** Regular expressions that recognise colour formats */
export const COLOR_REGEX_PATTERNS = {
  /** HEX colours: #RGB, #RRGGBB, #RGBA, #RRGGBBAA */
  hex: /^#[0-9a-fA-F]{3,8}$/,
  
  /** RGB/RGBA functions with flexible formatting */
  rgb: /^rgba?\s*\([^)]+\)$/i,
  
  /** HSL/HSLA functions with flexible formatting */
  hsl: /^hsla?\s*\([^)]+\)$/i,
  
  /** Modern CSS colour functions */
  modernCSS: /^(color|lab|lch|oklab|oklch)\s*\([^)]+\)$/i
} as const;