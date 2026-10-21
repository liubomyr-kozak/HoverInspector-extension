import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IconPalette } from "@tabler/icons-react";
import { calculateContrastRatio, getColorInAllFormats } from "@entrypoints/shared/utils/colorAnalysis.ts";
import { ColorPalette, PaletteColor } from "./paletteTypes";
import { extractCategorizedColorMaps, categorizeColorsIntoPalette, sortColorsByPaletteLogic } from "./utils/paletteUtils.ts";
import { usePalette } from "./PaletteContext";
import { matchValue } from "./utils/themeDiff";
import { TokenTabLayout, type TokenEntry, type TokenGroup } from "./tokenUi/TokenTabLayout";
import type { TokenDetail } from "./tokenUi/TokenDetailPanel";
import { buildNames, secondaryName, variableAliases } from "./tokenUi/helpers";

// Start empty: the palette is filled from the page, never from placeholder colours
const emptyPalette: ColorPalette = {
  primary: [],
  secondary: [],
  tertiary: [],
  neutral: [],
  element: [],
  text: [],
  border: [],
};

const ratio = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : "N/A");

/**
 * The Colors tab: the page's colours grouped by role (brand, text, background, border) as swatches; the
 * selected one opens the shared detail panel (formats, contrast, theme status, names, elements).
 */
export const ColorPaletteDefinition: React.FC = () => {
  const { audit, theme } = usePalette();
  const [colorPalette, setColorPalette] = useState<ColorPalette>(emptyPalette);
  const [extracting, setExtracting] = useState(true);

  // The palette holds live DOM references (sourceElements), so it is kept in component state only
  const extractColorsFromPage = useCallback(() => {
    setExtracting(true);
    // Let the loading state paint before the synchronous page scan
    setTimeout(() => {
      try {
        const { backgroundColors, textColors, borderColors } = extractCategorizedColorMaps();
        setColorPalette(categorizeColorsIntoPalette(backgroundColors, textColors, borderColors));
      } catch (error) {
        console.error("Error extracting colors from page:", error);
      } finally {
        setExtracting(false);
      }
    }, 0);
  }, []);

  useEffect(extractColorsFromPage, [extractColorsFromPage]);

  const roleGroups = useMemo(
    () =>
      [
        // Backgrounds of buttons, containers and navigation, picked by role
        { key: "brand", title: "Brand colours", type: "Brand", colors: [...colorPalette.primary, ...colorPalette.secondary, ...colorPalette.tertiary] },
        { key: "text", title: "Text colours", type: "Text", colors: colorPalette.text },
        { key: "element", title: "Background colours", type: "Element", colors: colorPalette.element },
        { key: "border", title: "Border colours", type: "Border", colors: colorPalette.border },
      ].map((group) => ({ ...group, colors: sortColorsByPaletteLogic(group.colors.map((c) => ({ ...c, type: group.type }))) as PaletteColor[] })),
    [colorPalette],
  );

  const groups = useMemo<TokenGroup[]>(
    () =>
      roleGroups
        .filter((g) => g.colors.length)
        .map((g) => ({
          key: g.key,
          title: g.title,
          layout: "swatches" as const,
          entries: g.colors.map((c): TokenEntry => {
            const hex = (getColorInAllFormats(c.color)?.hex || c.color).toUpperCase();
            const match = matchValue("color", hex, theme);
            return {
              id: c.id,
              key: hex,
              label: hex,
              secondary: secondaryName(audit?.variables[hex] || [], match) || c.name,
              count: c.frequency ?? c.sourceElements?.length ?? 0,
              swatch: c.color,
              match,
            };
          }),
        })),
    [roleGroups, theme, audit],
  );

  const getDetail = useCallback(
    (entry: TokenEntry): TokenDetail | null => {
      const color = roleGroups.flatMap((g) => g.colors).find((c) => c.id === entry.id);
      if (!color) return null;
      const formats = getColorInAllFormats(color.color);
      const variables = variableAliases(audit, "color", entry.key);
      const elements = color.sourceElements || [];
      return {
        preview: <div className="w-12 h-12 rounded-md border shadow-inner" style={{ backgroundColor: color.color }} />,
        title: color.name,
        subtitle: entry.key,
        formatsTitle: "Color Information",
        formats: [
          { label: "HEX", value: formats?.hex || color.color },
          { label: "RGB", value: formats?.rgb || "" },
          { label: "HSL", value: formats?.hsl || "" },
          { label: "HSV", value: formats?.hsv || "" },
        ],
        extra: (
          <>
            <p className="m-0 mb-1">
              <strong>Contrast ratio with white:</strong> {ratio(calculateContrastRatio(color.color, "#ffffff"))}
            </p>
            <p className="m-0">
              <strong>Contrast ratio with black:</strong> {ratio(calculateContrastRatio(color.color, "#000000"))}
            </p>
          </>
        ),
        names: buildNames({ variables, match: entry.match, elements, extra: [{ kind: "Role", text: color.name }] }),
        elements,
        match: entry.match,
      };
    },
    [roleGroups, audit],
  );

  return (
    <TokenTabLayout
      tab="color-palette"
      icon={<IconPalette size={18} />}
      title="Colour tokens"
      description="The colours used on this page, grouped by role."
      groups={groups}
      loading={extracting}
      loadingLabel="Extracting colours from the page…"
      emptyText="No colours found on this page."
      onRescan={extractColorsFromPage}
      getDetail={getDetail}
    />
  );
};

/**
 * The detail of a colour of the page scan (the Overview opens it in place): every text, background and
 * border use of the colour together
 */
export const useColorUsageDetail = () => {
  const { audit } = usePalette();
  return useCallback(
    (entry: TokenEntry): TokenDetail | null => {
      if (!audit) return null;
      const uses = [...audit.colors.text, ...audit.colors.background, ...audit.colors.border].filter((c) => c.value === entry.key);
      if (!uses.length) return null;
      const elements = [...new Set(uses.flatMap((c) => c.elements))];
      const formats = getColorInAllFormats(entry.key);
      const variables = variableAliases(audit, "color", entry.key);
      const roles = [
        audit.colors.text.some((c) => c.value === entry.key) && "Text",
        audit.colors.background.some((c) => c.value === entry.key) && "Background",
        audit.colors.border.some((c) => c.value === entry.key) && "Border",
      ].filter((role): role is string => !!role);
      return {
        preview: <div className="w-12 h-12 rounded-md border shadow-inner" style={{ backgroundColor: entry.key }} />,
        title: entry.key,
        subtitle: secondaryName(variables, entry.match),
        formatsTitle: "Color Information",
        formats: [
          { label: "HEX", value: formats?.hex || entry.key },
          { label: "RGB", value: formats?.rgb || "" },
          { label: "HSL", value: formats?.hsl || "" },
          { label: "HSV", value: formats?.hsv || "" },
        ],
        extra: (
          <>
            <p className="m-0 mb-1">
              <strong>Contrast ratio with white:</strong> {ratio(calculateContrastRatio(entry.key, "#ffffff"))}
            </p>
            <p className="m-0">
              <strong>Contrast ratio with black:</strong> {ratio(calculateContrastRatio(entry.key, "#000000"))}
            </p>
          </>
        ),
        names: buildNames({
          variables,
          match: entry.match,
          elements,
          extra: roles.map((role) => ({ kind: "Role", text: role })),
        }),
        elements,
        match: entry.match,
      };
    },
    [audit],
  );
};
