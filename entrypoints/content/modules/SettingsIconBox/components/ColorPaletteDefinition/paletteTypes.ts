import { ElementCategory } from '@entrypoints/shared/utils/categorizeElements.ts';

export type ColorSystem = 'rgb' | 'hex' | 'hsl' | 'hsv';

export interface PaletteColor {
  id: string;
  color: string;
  name: string;
  sourceElements?: Element[];
  frequency?: number;
}

export interface ColorPalette {
  primary: PaletteColor[];
  secondary: PaletteColor[];
  tertiary: PaletteColor[];
  neutral: PaletteColor[];
  element: PaletteColor[];
  text: PaletteColor[];
  border: PaletteColor[];
}

export interface ColorExtractionStats {
  isExtracting: boolean;
  lastExtracted: Date | null;
  totalElementsAnalyzed: number;
  totalColorsFound: number;
}

export interface CategorizedColorInfo {
  count: number;
  elements: Element[];
  category: ElementCategory;
}

export interface TypographyToken {
  id: string;
  name: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
  fontFamily?: string;
  sourceElements?: Element[];
  frequency?: number;
}

export interface SpacingToken {
  id: string;
  name: string;
  value: string;
  pixelValue: number;
  usage: string[];
  sourceElements?: Element[];
  frequency?: number;
}

export interface BorderRadiusToken {
  id: string;
  name: string;
  value: string;
  usage: string[];
  sourceElements?: Element[];
  frequency?: number;
}

export interface ShadowToken {
  id: string;
  name: string;
  value: string;
  usage: string[];
  sourceElements?: Element[];
  frequency?: number;
}

export enum TokenTabType {
  COLORS = 'colors',
  TYPOGRAPHY = 'typography',
  SPACING = 'spacing',
  BORDERS = 'borders',
  SHADOWS = 'shadows'
}
