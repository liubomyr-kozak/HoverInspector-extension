import { getColorInAllFormats } from "@entrypoints/shared/utils/colorAnalysis.ts";
import { PaletteColor } from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/paletteTypes.ts";

const GRAY_SAT_THRESHOLD = 10; // saturation % below which a colour counts as gray (achromatic)

type HslTriplet = { h: number; s: number; l: number };

function parseHsl(hslStr: string): HslTriplet | null {
  // 🔎 Expects `hsl(h, s%, l%)`, exactly what getColorInAllFormats(...) returns
  const m = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return null;
  return { h: parseInt(m[1], 10), s: parseInt(m[2], 10), l: parseInt(m[3], 10) };
}

function parseAlphaFromRgbString(rgbStr: string): number {
  // 🔎 getColorInAllFormats returns:
  // - "rgb(r, g, b)" if a === 1
  // - "rgba(r, g, b, aa)" if a !== 1 (aa rounded to 2 decimals)
  const m = rgbStr.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([0-9.]+)\s*\)/);
  return m ? Math.min(1, Math.max(0, parseFloat(m[1]))) : 1;
}

function getHueFamily(hue: number): number {
  // 🧭 Matches the original logic
  if (hue >= 345 || hue <= 15) return 0; // Red
  if (hue >= 16 && hue <= 60) return 1; // Orange/Yellow
  if (hue >= 61 && hue <= 150) return 2; // Green
  if (hue >= 151 && hue <= 240) return 3; // Blue/Cyan
  if (hue >= 241 && hue <= 300) return 4; // Purple
  return 5; // Gray (fallback; gray is actually detected by saturation)
}

type Enriched<T> = {
  item: T; // original object
  idx: number; // original index, for a stable sort
  a: number; // alpha (0..1)
  h: number; // hue   (0..360)
  s: number; // saturation (%)
  l: number; // lightness  (%)
  isGray: boolean; // whether it is gray (achromatic)
  family: number; // hue family (0..5)
  valid: boolean; // whether parsing succeeded
};

/**
 * 🔄 Main comparator for opaque and transparent colours (alpha ignored).
 * Order:
 * 1) family (Red → Orange/Yellow → Green → Blue/Cyan → Purple → Gray)
 * 2) within a family, dark to light (l ascending)
 * 3) tie-break: chromatic colours by ascending hue (smooth transition within a family)
 * 4) tie-break 2: by saturation (more saturated first)
 * 5) stability: by original index
 */
function baseColorComparator<T>(a: Enriched<T>, b: Enriched<T>): number {
  if (a.family !== b.family) return a.family - b.family;

  // 🖤 Gray and the rest alike: dark to light (it used to be reversed by mistake)
  if (a.l !== b.l) return a.l - b.l;

  // 🎨 Fine ordering for a nicer gradient within a family
  if (a.family !== 5 && a.h !== b.h) return a.h - b.h; // chromatic families only

  // 💧 More saturated slightly earlier (all else equal)
  if (a.s !== b.s) return b.s - a.s;

  // 🔒 Stability
  return a.idx - b.idx;
}

/**
 * 🧠 Public function: sorts colours in palette order.
 * - Opaque first, transparent last
 * - Within groups: Red → Orange/Yellow → Green → Blue/Cyan → Purple → Gray
 * - Dark to light
 * - Transparent colours are also ordered by alpha (more opaque first)
 */
export function sortColorsByPaletteLogic<T extends PaletteColor & { type: string }>(colors: T[]): T[] {
  // 🗺️ Enrich the data: parse once per item (not on every comparison in sort)
  const enriched: Enriched<T>[] = colors.map((item, idx) => {
    const formats = getColorInAllFormats(item.color);
    if (!formats) {
      // Unparseable: put it at the end, keep the order stable
      return {
        item,
        idx,
        a: 1,
        h: 0,
        s: 0,
        l: 50,
        isGray: true,
        family: 5,
        valid: false,
      };
    }

    const hsl = parseHsl(formats.hsl);
    const alpha = parseAlphaFromRgbString(formats.rgb);

    if (!hsl) {
      return {
        item,
        idx,
        a: alpha,
        h: 0,
        s: 0,
        l: 50,
        isGray: true,
        family: 5,
        valid: false,
      };
    }

    const isGray = hsl.s < GRAY_SAT_THRESHOLD;
    const family = isGray ? 5 : getHueFamily(hsl.h);

    return {
      item,
      idx,
      a: alpha,
      h: hsl.h,
      s: hsl.s,
      l: hsl.l,
      isGray,
      family,
      valid: true,
    };
  });

  // 🧪 Split by transparency using the real alpha (works for #RRGGBBAA too)
  const opaque = enriched.filter((e) => e.valid && e.a >= 1);
  const transparent = enriched.filter((e) => e.valid && e.a < 1);
  const invalid = enriched.filter((e) => !e.valid);

  // 🔢 Sorting
  const opaqueSorted = [...opaque].sort(baseColorComparator);
  const transparentSorted = [...transparent].sort((a, b) => {
    // first the same palette logic...
    const byBase = baseColorComparator(a, b);
    if (byBase !== 0) return byBase;
    // ...then tie-break by alpha (more opaque first)
    if (a.a !== b.a) return b.a - a.a;
    return 0;
  });

  // ❗ invalid (unparseable) go last, in their original order
  return [...opaqueSorted, ...transparentSorted, ...invalid].map((e) => e.item);
}
