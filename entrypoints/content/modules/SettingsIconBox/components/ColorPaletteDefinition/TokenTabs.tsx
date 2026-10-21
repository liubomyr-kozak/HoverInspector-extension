import React, { useCallback, useMemo } from "react";
import { IconBorderRadius, IconRuler, IconShadow, IconTypography } from "@tabler/icons-react";
import { isOnGrid, type TypeStyle, type ValueUsage } from "@entrypoints/shared/utils/designAudit";
import { usePalette } from "./PaletteContext";
import { TokenTabLayout, type TokenEntry, type TokenGroup } from "./tokenUi/TokenTabLayout";
import type { TokenDetail } from "./tokenUi/TokenDetailPanel";
import { buildNames, lengthFormats, secondaryName, variableAliases, WEIGHT_NAMES } from "./tokenUi/helpers";
import {
  formatShadow,
  lineHeightPx,
  matchTypeStyle,
  matchValue,
  parseBorder,
  parseShadow,
} from "./utils/themeDiff";

/**
 * The Type, Spacing, Borders and Shadows tabs. They read the same page scan as the Overview, name every
 * value by itself (or the CSS variable / theme token that holds it) and share one layout and detail panel.
 */

const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

// ---------------------------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------------------------

/** Spacing: the detail of one value (the Spacing tab and the Overview open it) */
export const useSpacingDetail = () => {
  const { audit, rootFontSize, grid } = usePalette();
  const spacing = audit?.spacing || [];
  return useCallback(
    (entry: TokenEntry): TokenDetail | null => {
      const s = spacing.find((v) => v.value === entry.key);
      if (!s) return null;
      const px = s.size ?? 0;
      const variables = variableAliases(audit, "spacing", s.value, { rootFontSize });
      return {
        preview: <span className="block w-12 h-12 rounded border border-blue-200 bg-blue-50 flex items-center justify-center">
          <span className="block bg-blue-500" style={{ width: Math.min(px, 40), height: Math.min(px, 40), minWidth: 2, minHeight: 2 }} />
        </span>,
        title: s.value,
        subtitle: secondaryName(variables, entry.match),
        formats: [...lengthFormats(px, rootFontSize), { label: "Tailwind step", value: `${round(px / 4)}` }],
        extra: (
          <>
            {isOnGrid(px, grid) ? `On the ${grid}px grid.` : `Off the ${grid}px grid.`} Used {s.count}{" "}
            {s.count === 1 ? "time" : "times"} as a margin, padding or gap.
          </>
        ),
        names: buildNames({ variables, match: entry.match, elements: s.elements }),
        elements: s.elements,
        match: entry.match,
      };
    },
    [spacing, audit, rootFontSize, grid],
  );
};

export const SpacingTab: React.FC = () => {
  const { audit, theme, rescan, rootFontSize, grid, error, progress } = usePalette();
  const spacing = audit?.spacing || [];
  const max = Math.max(...spacing.map((s) => s.size ?? 0), 1);

  const groups = useMemo<TokenGroup[]>(() => {
    const entries = spacing.map((s): TokenEntry => {
      const match = matchValue("spacing", s.value, theme, { rootFontSize });
      const off = !isOnGrid(s.size ?? 0, grid);
      return {
        id: s.value,
        key: s.value,
        label: s.value,
        secondary: secondaryName(audit?.variables[s.value] || [], match),
        count: s.count,
        match,
        preview: (
          <span
            className={`block h-2.5 rounded-sm ${off ? "bg-orange-400" : "bg-blue-500"}`}
            style={{ width: `${Math.max(2, ((s.size ?? 0) / max) * 64)}px` }}
          />
        ),
      };
    });
    return [
      {
        key: "spacing",
        title: "Spacing scale",
        layout: "rows",
        entries,
        hint: `Margins, paddings and gaps, smallest first. Orange bars are off the ${grid}px grid.`,
      },
    ];
  }, [spacing, theme, rootFontSize, grid, audit, max]);

  const getDetail = useSpacingDetail();

  return (
    <TokenTabLayout
      tab="spacing"
      icon={<IconRuler size={18} />}
      title="Spacing tokens"
      description="Every margin, padding and gap on this page."
      groups={groups}
      loading={!audit && !error}
      error={error}
      progress={progress}
      emptyText="No margin, padding or gap values found on this page."
      onRescan={rescan}
      getDetail={getDetail}
    />
  );
};

// ---------------------------------------------------------------------------------------------
// Borders: corner radii and border lines
// ---------------------------------------------------------------------------------------------

/** Radii (id "radius:<value>") and border lines: the detail of one value */
export const useBordersDetail = () => {
  const { audit, rootFontSize } = usePalette();
  const radii = audit?.radii || [];
  const lines = audit?.borderLines || [];
  return useCallback(
    (entry: TokenEntry): TokenDetail | null => {
      if (entry.id.startsWith("radius:")) {
        const r = radii.find((v) => v.value === entry.key);
        if (!r) return null;
        const variables = variableAliases(audit, "radius", r.value, { rootFontSize });
        return {
          preview: (
            <span className="block w-12 h-12 bg-blue-50 border-2 border-blue-500" style={{ borderRadius: Math.min(r.size ?? 0, 24) }} />
          ),
          title: r.value,
          subtitle: secondaryName(variables, entry.match),
          formats: [...lengthFormats(r.size ?? 0, rootFontSize), { label: "CSS", value: `border-radius: ${r.value};` }],
          names: buildNames({ variables, match: entry.match, elements: r.elements }),
          elements: r.elements,
          match: entry.match,
        };
      }
      const l = lines.find((v) => v.value === entry.key);
      if (!l) return null;
      const [width, style, color] = l.value.split(" ");
      const parts = parseBorder(l.value);
      const variables = [
        ...variableAliases(audit, "border", l.value),
        ...variableAliases(audit, "color", color).map((v) => v),
      ];
      return {
        preview: <span className="block w-12 h-12 rounded bg-white" style={{ border: l.value }} />,
        title: l.value,
        subtitle: secondaryName(variables, entry.match),
        formats: [
          { label: "CSS", value: `border: ${l.value};`, wide: true },
          { label: "Width", value: width },
          { label: "Style", value: style },
          { label: "Colour", value: color },
          ...(parts?.width ? [{ label: "Width (rem)", value: `${round(parts.width / rootFontSize, 4)}rem` }] : []),
        ],
        names: buildNames({ variables, match: entry.match, elements: l.elements }),
        elements: l.elements,
        match: entry.match,
      };
    },
    [radii, lines, audit, rootFontSize],
  );
};

export const BordersTab: React.FC = () => {
  const { audit, theme, rescan, rootFontSize, error, progress } = usePalette();
  const radii = audit?.radii || [];
  const lines = audit?.borderLines || [];

  const groups = useMemo<TokenGroup[]>(
    () => [
      {
        key: "radii",
        title: "Corner radii",
        layout: "tiles",
        entries: radii.map((r): TokenEntry => {
          const match = matchValue("radius", r.value, theme, { rootFontSize });
          return {
            id: `radius:${r.value}`,
            key: r.value,
            label: r.value,
            secondary: secondaryName(audit?.variables[r.value] || [], match),
            count: r.count,
            match,
            preview: (
              <span
                className="block w-10 h-10 bg-blue-50 border-2 border-blue-500"
                style={{ borderRadius: Math.min(r.size ?? 0, 20) }}
              />
            ),
          };
        }),
      },
      {
        key: "lines",
        title: "Border lines",
        layout: "rows",
        hint: "Width, style and colour of the borders drawn on the page.",
        entries: lines.map((l): TokenEntry => {
          const match = matchValue("border", l.value, theme);
          const color = l.value.split(" ")[2];
          return {
            id: `border:${l.value}`,
            key: l.value,
            label: l.value,
            secondary: secondaryName(audit?.variables[color] || [], match),
            count: l.count,
            match,
            preview: <span className="block w-14" style={{ borderTop: l.value }} />,
          };
        }),
      },
    ],
    [radii, lines, theme, rootFontSize, audit],
  );

  const getDetail = useBordersDetail();

  return (
    <TokenTabLayout
      tab="borders"
      icon={<IconBorderRadius size={18} />}
      title="Radii & borders"
      description="Corner radii and the border lines drawn on this page."
      groups={groups}
      loading={!audit && !error}
      error={error}
      progress={progress}
      emptyText="No rounded corners or borders found on this page."
      onRescan={rescan}
      getDetail={getDetail}
    />
  );
};

// ---------------------------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------------------------

/** Short name for a shadow tile: the first layer's offsets and blur ("0 1px 3px"), "+1" per extra layer */
export const shadowLabel = (value: string) => {
  const layers = parseShadow(value);
  if (!layers) return value;
  const [x, y, blur, spread] = layers[0].lengths;
  const parts = [x, y, blur, ...(spread ? [spread] : [])].map((n) => (n === 0 ? "0" : `${round(n)}px`));
  return `${layers[0].inset ? "inset " : ""}${parts.join(" ")}${layers.length > 1 ? ` +${layers.length - 1}` : ""}`;
};

/** Shadows: the detail of one value */
export const useShadowsDetail = () => {
  const { audit } = usePalette();
  const shadows = audit?.shadows || [];
  return useCallback(
    (entry: TokenEntry): TokenDetail | null => {
      const s = shadows.find((v) => v.value === entry.key);
      if (!s) return null;
      const variables = variableAliases(audit, "shadow", s.value);
      const layers = parseShadow(s.value) || [];
      return {
        preview: <span className="block w-12 h-12 rounded-md bg-white" style={{ boxShadow: s.value }} />,
        title: shadowLabel(s.value),
        subtitle: secondaryName(variables, entry.match),
        formats: [
          { label: "CSS", value: `box-shadow: ${formatShadow(s.value)};`, wide: true },
          { label: "Computed value", value: s.value, wide: true },
          ...layers.map((layer, i) => ({
            label: layers.length > 1 ? `Layer ${i + 1}: x y blur spread` : "x y blur spread",
            value: layer.lengths.map((n) => `${round(n)}px`).join(" "),
            wide: true,
          })),
        ],
        extra: layers.length > 1 ? `${layers.length} layers.` : undefined,
        names: buildNames({ variables, match: entry.match, elements: s.elements }),
        elements: s.elements,
        match: entry.match,
      };
    },
    [shadows, audit],
  );
};

export const ShadowsTab: React.FC = () => {
  const { audit, theme, rescan, error, progress } = usePalette();
  const shadows = audit?.shadows || [];

  const groups = useMemo<TokenGroup[]>(
    () => [
      {
        key: "shadows",
        title: "Box shadows",
        layout: "tiles",
        tileMin: 128,
        entries: shadows.map((s): TokenEntry => {
          const match = matchValue("shadow", s.value, theme);
          return {
            id: s.value,
            key: s.value,
            label: shadowLabel(s.value),
            secondary: secondaryName(variableAliases(audit, "shadow", s.value), match),
            count: s.count,
            match,
            preview: <span className="block w-12 h-8 rounded bg-white" style={{ boxShadow: s.value }} />,
          };
        }),
      },
    ],
    [shadows, theme, audit],
  );

  const getDetail = useShadowsDetail();

  return (
    <TokenTabLayout
      tab="shadows"
      icon={<IconShadow size={18} />}
      title="Shadow tokens"
      description="Every box shadow on this page, most used first."
      groups={groups}
      loading={!audit && !error}
      error={error}
      progress={progress}
      emptyText="No box shadows found on this page."
      onRescan={rescan}
      getDetail={getDetail}
    />
  );
};

// ---------------------------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------------------------

const Aa: React.FC<{ family?: string; size?: number; weight?: string }> = ({ family, size = 16, weight }) => (
  <span
    className="block text-gray-900 leading-none truncate"
    style={{ fontFamily: family, fontSize: Math.min(size, 26), fontWeight: weight as React.CSSProperties["fontWeight"] }}
  >
    Aa
  </span>
);

/** `16px / 24px · 400` */
export const typeStyleLabel = (t: Pick<TypeStyle, "size" | "lineHeight" | "weight">) =>
  `${t.size}px / ${t.lineHeight} · ${t.weight}`;

const fontShorthand = (t: TypeStyle) => `${t.weight} ${t.size}px/${t.lineHeight === "normal" ? "normal" : t.lineHeight} ${t.family}`;

interface Aggregate {
  value: string;
  count: number;
  elements: Element[];
  /** A style using it, for the font size of line heights */
  sample: TypeStyle;
}

const aggregate = (styles: TypeStyle[], keyOf: (t: TypeStyle) => string): Aggregate[] => {
  const map = new Map<string, Aggregate>();
  for (const t of styles) {
    const key = keyOf(t);
    const entry = map.get(key) || { value: key, count: 0, elements: [], sample: t };
    entry.count += t.count;
    for (const el of t.elements) if (entry.elements.length < 50 && !entry.elements.includes(el)) entry.elements.push(el);
    map.set(key, entry);
  }
  return [...map.values()];
};

/** The page's type styles and their families, sizes, weights and line heights */
const useTypeGroups = () => {
  const { audit } = usePalette();
  const styles = useMemo(() => audit?.typography || [], [audit]);
  const families = useMemo(() => aggregate(styles, (t) => t.familyName).sort((a, b) => b.count - a.count), [styles]);
  const weights = useMemo(() => aggregate(styles, (t) => t.weight).sort((a, b) => Number(a.value) - Number(b.value)), [styles]);
  const lineHeights = useMemo(
    () => aggregate(styles, (t) => t.lineHeight).sort((a, b) => (parseFloat(a.value) || 0) - (parseFloat(b.value) || 0)),
    [styles],
  );
  const sizes: ValueUsage[] = useMemo(() => audit?.fontSizes || [], [audit]);
  return { styles, families, sizes, weights, lineHeights };
};

/** Type: the detail of a style ("style:<key>"), family, size, weight or line height */
export const useTypeDetail = () => {
  const { audit, theme, rootFontSize } = usePalette();
  const { styles, families, sizes, weights, lineHeights } = useTypeGroups();
  return useCallback(
    (entry: TokenEntry): TokenDetail | null => {
      const [kind] = entry.id.split(":");
      const ctx = { rootFontSize };
      if (kind === "style") {
        const t = styles.find((s) => s.key === entry.key);
        if (!t) return null;
        const m = matchTypeStyle(t, theme, rootFontSize);
        const lh = lineHeightPx(t.lineHeight, t.size);
        const variables = [
          ...variableAliases(audit, "fontSize", `${t.size}px`, ctx),
          ...variableAliases(audit, "fontFamily", t.family, ctx),
        ];
        return {
          preview: (
            <span className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              <Aa family={t.family} size={t.size} weight={t.weight} />
            </span>
          ),
          title: typeStyleLabel(t),
          subtitle: t.familyName,
          formats: [
            { label: "Font shorthand", value: `font: ${fontShorthand(t)};`, wide: true },
            {
              label: "CSS",
              value: `font-family: ${t.family};\nfont-size: ${t.size}px;\nfont-weight: ${t.weight};\nline-height: ${t.lineHeight};`,
              wide: true,
            },
            { label: "Size (rem)", value: `${round(t.size / rootFontSize, 4)}rem` },
            { label: "Line height ×", value: lh ? `${round(lh / t.size, 3)}` : t.lineHeight },
          ],
          names: buildNames({
            variables,
            elements: t.elements,
            extra: Object.values(m.parts)
              .filter((part) => part?.status === "match" && part.token)
              .map((part) => ({ kind: "Theme token", text: part!.token! })),
          }),
          elements: t.elements,
          match: m.overall,
          matchParts: [
            { label: "Family", match: m.parts.fontFamily },
            { label: "Size", match: m.parts.fontSize },
            { label: "Weight", match: m.parts.fontWeight },
            { label: "Line height", match: m.parts.lineHeight },
          ],
        };
      }
      if (kind === "family") {
        const f = families.find((v) => v.value === entry.key);
        if (!f) return null;
        const variables = variableAliases(audit, "fontFamily", f.sample.family, ctx);
        return {
          preview: (
            <span className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
              <Aa family={f.sample.family} size={22} />
            </span>
          ),
          title: f.value,
          subtitle: secondaryName(variables, entry.match),
          formats: [
            { label: "CSS", value: `font-family: ${f.sample.family};`, wide: true },
            { label: "First family", value: f.value },
          ],
          names: buildNames({ variables, match: entry.match, elements: f.elements }),
          elements: f.elements,
          match: entry.match,
        };
      }
      if (kind === "size") {
        const s = sizes.find((v) => v.value === entry.key);
        if (!s) return null;
        const variables = variableAliases(audit, "fontSize", s.value, ctx);
        return {
          preview: (
            <span className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              <Aa size={s.size} />
            </span>
          ),
          title: s.value,
          subtitle: secondaryName(variables, entry.match),
          formats: [...lengthFormats(s.size ?? 0, rootFontSize), { label: "CSS", value: `font-size: ${s.value};` }],
          names: buildNames({ variables, match: entry.match, elements: s.elements }),
          elements: s.elements,
          match: entry.match,
        };
      }
      if (kind === "weight") {
        const w = weights.find((v) => v.value === entry.key);
        if (!w) return null;
        const variables = (audit?.variableEntries || []).filter(([name, v]) => /weight/i.test(name) && v.trim() === w.value).map(([n]) => n);
        return {
          preview: (
            <span className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
              <Aa weight={w.value} size={22} />
            </span>
          ),
          title: entry.label,
          subtitle: secondaryName(variables, entry.match),
          formats: [
            { label: "CSS", value: `font-weight: ${w.value};`, wide: true },
            { label: "Number", value: w.value },
            ...(WEIGHT_NAMES[w.value] ? [{ label: "Name", value: WEIGHT_NAMES[w.value] }] : []),
          ],
          names: buildNames({ variables, match: entry.match, elements: w.elements }),
          elements: w.elements,
          match: entry.match,
        };
      }
      const l = lineHeights.find((v) => v.value === entry.key);
      if (!l) return null;
      const px = lineHeightPx(l.value, l.sample.size);
      return {
        preview: (
          <span className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex flex-col justify-center gap-0.5 px-2">
            <span className="block h-1 bg-gray-400 rounded" />
            <span className="block h-1 bg-gray-400 rounded" />
            <span className="block h-1 bg-gray-400 rounded w-2/3" />
          </span>
        ),
        title: l.value,
        subtitle: entry.secondary,
        formats: [
          { label: "CSS", value: `line-height: ${l.value};`, wide: true },
          ...(px ? [{ label: `Unitless (${l.sample.size}px text)`, value: `${round(px / l.sample.size, 3)}` }] : []),
        ],
        names: buildNames({ match: entry.match, elements: l.elements }),
        elements: l.elements,
        match: entry.match,
      };
    },
    [styles, families, sizes, weights, lineHeights, theme, rootFontSize, audit],
  );
};

export const TypeTab: React.FC = () => {
  const { audit, theme, rescan, rootFontSize, error, progress } = usePalette();
  const { styles, families, sizes, weights, lineHeights } = useTypeGroups();

  const groups = useMemo<TokenGroup[]>(() => {
    const ctx = { rootFontSize };
    return [
      {
        key: "styles",
        title: "Type styles",
        layout: "rows",
        hint: "Size / line height · weight, largest first.",
        entries: styles.map((t): TokenEntry => {
          const match = matchTypeStyle(t, theme, rootFontSize).overall;
          return {
            id: `style:${t.key}`,
            key: t.key,
            label: typeStyleLabel(t),
            secondary: t.familyName,
            count: t.count,
            match,
            preview: <Aa family={t.family} size={t.size} weight={t.weight} />,
          };
        }),
      },
      {
        key: "families",
        title: "Font families",
        layout: "rows",
        entries: families.map((f): TokenEntry => {
          const match = matchValue("fontFamily", f.sample.family, theme, ctx);
          return {
            id: `family:${f.value}`,
            key: f.value,
            label: f.value,
            secondary: match?.status === "match" ? match.token : undefined,
            count: f.count,
            match,
            preview: <Aa family={f.sample.family} />,
          };
        }),
      },
      {
        key: "sizes",
        title: "Font sizes",
        layout: "rows",
        entries: sizes.map((s): TokenEntry => {
          const match = matchValue("fontSize", s.value, theme, ctx);
          return {
            id: `size:${s.value}`,
            key: s.value,
            label: s.value,
            secondary: secondaryName(audit?.variables[s.value] || [], match),
            count: s.count,
            match,
            preview: <Aa size={s.size} />,
          };
        }),
      },
      {
        key: "weights",
        title: "Font weights",
        layout: "rows",
        entries: weights.map((w): TokenEntry => {
          const match = matchValue("fontWeight", w.value, theme, ctx);
          return {
            id: `weight:${w.value}`,
            key: w.value,
            label: `${w.value}${WEIGHT_NAMES[w.value] ? ` ${WEIGHT_NAMES[w.value]}` : ""}`,
            secondary: match?.status === "match" ? match.token : undefined,
            count: w.count,
            match,
            preview: <Aa weight={w.value} />,
          };
        }),
      },
      {
        key: "lineHeights",
        title: "Line heights",
        layout: "rows",
        entries: lineHeights.map((l): TokenEntry => {
          const match = matchValue("lineHeight", l.value, theme, { ...ctx, fontSize: l.sample.size });
          const px = lineHeightPx(l.value, l.sample.size);
          return {
            id: `lh:${l.value}`,
            key: l.value,
            label: l.value,
            secondary: match?.status === "match" ? match.token : px ? `${round(px / l.sample.size)}× of ${l.sample.size}px` : undefined,
            count: l.count,
            match,
          };
        }),
      },
    ];
  }, [styles, families, sizes, weights, lineHeights, theme, rootFontSize, audit]);

  const getDetail = useTypeDetail();

  return (
    <TokenTabLayout
      tab="typography"
      icon={<IconTypography size={18} />}
      title="Type tokens"
      description="Type styles, families, sizes, weights and line heights of the text on this page."
      groups={groups}
      loading={!audit && !error}
      error={error}
      progress={progress}
      emptyText="No text found on this page."
      onRescan={rescan}
      getDetail={getDetail}
    />
  );
};

