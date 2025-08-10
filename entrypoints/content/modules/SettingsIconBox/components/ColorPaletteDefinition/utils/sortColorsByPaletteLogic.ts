import { getColorInAllFormats } from "@entrypoints/shared/utils/colorAnalysis.ts";
import { PaletteColor } from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition/paletteTypes.ts";

const GRAY_SAT_THRESHOLD = 10; // % насиченості, нижче якого вважаємо колір "сірим" (achromatic)

type HslTriplet = { h: number; s: number; l: number };

function parseHsl(hslStr: string): HslTriplet | null {
  // 🔎 Очікуємо формат `hsl(h, s%, l%)` — рівно такий повертає getColorInAllFormats(...)
  const m = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return null;
  return { h: parseInt(m[1], 10), s: parseInt(m[2], 10), l: parseInt(m[3], 10) };
}

function parseAlphaFromRgbString(rgbStr: string): number {
  // 🔎 getColorInAllFormats повертає:
  // - "rgb(r, g, b)" якщо a === 1
  // - "rgba(r, g, b, aa)" якщо a !== 1 (aa з точністю до 2 знаків)
  const m = rgbStr.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([0-9.]+)\s*\)/);
  return m ? Math.min(1, Math.max(0, parseFloat(m[1]))) : 1;
}

function getHueFamily(hue: number): number {
  // 🧭 Відповідає твоїй початковій логіці
  if (hue >= 345 || hue <= 15) return 0; // Red
  if (hue >= 16 && hue <= 60) return 1; // Orange/Yellow
  if (hue >= 61 && hue <= 150) return 2; // Green
  if (hue >= 151 && hue <= 240) return 3; // Blue/Cyan
  if (hue >= 241 && hue <= 300) return 4; // Purple
  return 5; // Gray (fallback, але реально ми визначаємо Gray по насиченості)
}

type Enriched<T> = {
  item: T; // оригінальний об'єкт
  idx: number; // початковий індекс для стабільності
  a: number; // alpha (0..1)
  h: number; // hue   (0..360)
  s: number; // saturation (%)
  l: number; // lightness  (%)
  isGray: boolean; // чи "сірий" (achromatic)
  family: number; // сімейство hue (0..5)
  valid: boolean; // чи вдало розпарсили
};

/**
 * 🔄 Головний компаратор для непрозорих і прозорих кольорів (без урахування alpha).
 * Порядок:
 * 1) family (Red → Orange/Yellow → Green → Blue/Cyan → Purple → Gray)
 * 2) всередині family — від темного до світлого (l зростає)
 * 3) tie-break: для кольорових — за hue зростаюче (плавний перехід усередині сім'ї)
 * 4) tie-break №2: за насиченістю (більш насичені — раніше)
 * 5) стабільність: за початковим індексом
 */
function baseColorComparator<T>(a: Enriched<T>, b: Enriched<T>): number {
  if (a.family !== b.family) return a.family - b.family;

  // 🖤 Для Gray й для інших — однаково: від темного до світлого (було помилково навпаки)
  if (a.l !== b.l) return a.l - b.l;

  // 🎨 Дрібний порядок для приємнішого градієнта всередині сім'ї
  if (a.family !== 5 && a.h !== b.h) return a.h - b.h; // тільки для кольорових сімей

  // 💧 Більш насичений трохи раніше (якщо все інше рівне)
  if (a.s !== b.s) return b.s - a.s;

  // 🔒 Стабільність
  return a.idx - b.idx;
}

/**
 * 🧠 Публічна функція: сортує кольори за палітровою логікою.
 * - Непрозорі попереду, прозорі в кінці
 * - Всередині груп — Red → Orange/Yellow → Green → Blue/Cyan → Purple → Gray
 * - Від темного до світлого
 * - Прозорі додатково впорядковуються за alpha (більш непрозорі — раніше)
 */
export function sortColorsByPaletteLogic<T extends PaletteColor & { type: string }>(colors: T[]): T[] {
  // 🗺️ Збагачуємо дані — парсимо один раз на елемент (не під час кожного порівняння в sort)
  const enriched: Enriched<T>[] = colors.map((item, idx) => {
    const formats = getColorInAllFormats(item.color);
    if (!formats) {
      // Якщо не вдалося розпарсити — ставимо в кінець, зберігаємо стабільність
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

  // 🧪 Ділимо на групи за прозорістю — вже по справжньому alpha (працює і для #RRGGBBAA)
  const opaque = enriched.filter((e) => e.valid && e.a >= 1);
  const transparent = enriched.filter((e) => e.valid && e.a < 1);
  const invalid = enriched.filter((e) => !e.valid);

  // 🔢 Сортування
  const opaqueSorted = [...opaque].sort(baseColorComparator);
  const transparentSorted = [...transparent].sort((a, b) => {
    // спочатку така ж палітрова логіка...
    const byBase = baseColorComparator(a, b);
    if (byBase !== 0) return byBase;
    // ...а потім тай-брейк по alpha (більш непрозорий — раніше)
    if (a.a !== b.a) return b.a - a.a;
    return 0;
  });

  // ❗ invalid (не розпарсились) — ставимо в самий кінець у початковому порядку
  return [...opaqueSorted, ...transparentSorted, ...invalid].map((e) => e.item);
}
