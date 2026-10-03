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
