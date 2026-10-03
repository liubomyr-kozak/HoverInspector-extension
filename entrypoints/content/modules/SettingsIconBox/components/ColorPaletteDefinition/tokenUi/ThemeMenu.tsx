import React, { useMemo, useRef, useState } from "react";
import { Button, Popover } from "antd";
import { IconCheck, IconCopy, IconFileUpload, IconSparkles, IconTrash, IconWand } from "@tabler/icons-react";
import { shadowBody } from "@entrypoints/shared/utils/shadowBody";
import { countThemeTokens, parseTheme, type DesignTheme } from "../utils/themeDiff";
import { themeFromAudit } from "../utils/themeFromAudit";
import { AI_THEME_PROMPT, EXAMPLE_THEME_TEXT } from "../utils/themeExamples";
import { usePalette } from "../PaletteContext";
import { useCopy } from "./copy";

const GROUPS: Array<[string, (t: DesignTheme) => number]> = [
  ["colours", (t) => Object.keys(t.colors).length],
  ["spacing", (t) => Object.keys(t.spacing).length],
  ["radii", (t) => Object.keys(t.radii).length],
  ["shadows", (t) => Object.keys(t.shadows).length],
  ["borders", (t) => Object.keys(t.borders).length],
  [
    "type",
    (t) =>
      Object.keys(t.typography.fontFamilies).length +
      Object.keys(t.typography.fontSizes).length +
      Object.keys(t.typography.fontWeights).length +
      Object.keys(t.typography.lineHeights).length,
  ],
];

const themeContents = (theme: DesignTheme) =>
  GROUPS.map(([label, count]) => [label, count(theme)] as const)
    .filter(([, n]) => n > 0)
    .map(([label, n]) => `${n} ${label}`)
    .join(" · ");

const pageName = () => location.hostname || "This page";

/** The menu's content: the current theme, then the two ways to get one (from this page, or your own) */
const ThemeMenuContent: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { theme, setTheme, audit } = usePalette();
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { copy, copied } = useCopy();
  const parsed = useMemo(() => (text.trim() ? parseTheme(text) : null), [text]);
  const themeJson = useMemo(() => (theme ? JSON.stringify(theme, null, 2) : ""), [theme]);

  const use = (next: DesignTheme | null) => {
    if (!next) return;
    setTheme(next);
    setText("");
    onDone();
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
  };

  return (
    <div className="w-[300px] max-w-[calc(100vw-32px)] space-y-3 text-xs text-gray-700">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {theme ? (
            <>
              <strong className="block text-sm text-gray-900 break-words">{theme.name}</strong>
              <span className="text-gray-500">{themeContents(theme)}</span>
            </>
          ) : (
            <>
              <strong className="block text-sm text-gray-900">No theme</strong>
              <span className="text-gray-500">Values are checked against a theme once you add one.</span>
            </>
          )}
        </div>
        {theme && (
          <div className="flex shrink-0 gap-1">
            <Button
              size="small"
              icon={copied === themeJson ? <IconCheck size={14} /> : <IconCopy size={14} />}
              onClick={() => copy(themeJson)}
            >
              {copied === themeJson ? "Copied" : "Copy JSON"}
            </Button>
            <Button size="small" danger icon={<IconTrash size={14} />} onClick={() => setTheme(null)} aria-label="Remove theme" />
          </div>
        )}
      </div>

      <section className="space-y-1.5 border-t border-gray-200 pt-3">
        <h6 className="m-0 text-xs font-semibold text-gray-900">From this page</h6>
        <p className="m-0 text-gray-500">Every value the page uses now becomes a token. Copy it and remove what should not be one.</p>
        <Button
          size="small"
          icon={<IconWand size={14} />}
          disabled={!audit}
          onClick={() => audit && use(themeFromAudit(audit, pageName()))}
        >
          {audit ? "Generate theme" : "Scanning the page…"}
        </Button>
      </section>

      <section className="space-y-1.5 border-t border-gray-200 pt-3">
        <label htmlFor="palette-theme-input" className="block text-xs font-semibold text-gray-900">
          Your own theme
        </label>
        <textarea
          id="palette-theme-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={'Paste theme JSON or CSS variables\n{ "colors": { "primary": "#2563eb" } }\n:root { --space-4: 16px; }'}
          className="w-full h-24 p-2 text-xs font-mono border border-gray-300 rounded resize-y bg-white focus:border-blue-600"
        />
        <div className="flex flex-wrap gap-1.5">
          <Button size="small" icon={<IconFileUpload size={14} />} onClick={() => fileRef.current?.click()}>
            Load file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.css,.txt,application/json,text/css,text/plain"
            className="hidden"
            onChange={(e) => {
              loadFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button size="small" onClick={() => setText(EXAMPLE_THEME_TEXT)}>
            Example
          </Button>
          <Button
            size="small"
            icon={copied === AI_THEME_PROMPT ? <IconCheck size={14} /> : <IconCopy size={14} />}
            onClick={() => copy(AI_THEME_PROMPT)}
            title="Copies a prompt to give an AI, which answers with a theme for your brand to paste here"
          >
            {copied === AI_THEME_PROMPT ? "Prompt copied" : "Prompt for AI"}
          </Button>
        </div>
        {parsed && (
          <div
            role="status"
            className={`rounded px-2 py-1 ${parsed.theme ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
          >
            {parsed.theme ? (
              <>
                <strong>{parsed.theme.name}</strong>: {countThemeTokens(parsed.theme)} tokens ({themeContents(parsed.theme)})
                {parsed.skipped.length > 0 && (
                  <div className="text-gray-600">
                    Skipped {parsed.skipped.length}: {parsed.skipped.slice(0, 6).join(", ")}
                    {parsed.skipped.length > 6 ? "…" : ""}
                  </div>
                )}
              </>
            ) : (
              parsed.error
            )}
          </div>
        )}
        <div className="flex justify-end">
          <Button size="small" type="primary" disabled={!parsed?.theme} onClick={() => use(parsed?.theme ?? null)}>
            Use this theme
          </Button>
        </div>
      </section>

      <p className="m-0 text-[11px] text-gray-500">
        The theme is kept in the extension until you remove it. Values that match a token get ✓, close ones ?, others ⚠.
      </p>
    </div>
  );
};

/**
 * The one theme entry point for every tab, on the right of the tab bar: shows the theme in use and opens
 * a menu to generate one from the page, import your own, copy or remove it.
 */
interface ThemeMenuProps {
  /** Icon only, for a narrow panel */
  compact?: boolean;
}

export const ThemeMenu: React.FC<ThemeMenuProps> = ({ compact }) => {
  const { theme } = usePalette();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      content={<ThemeMenuContent onDone={() => setOpen(false)} />}
      getPopupContainer={shadowBody}
    >
      <Button
        size="small"
        type={theme ? "default" : "dashed"}
        icon={<IconSparkles size={14} className="text-blue-600" />}
        aria-expanded={open}
        aria-label={theme ? `Theme: ${theme.name}` : "Theme: none. Generate or import one"}
        title={theme ? `Theme: ${theme.name}` : "Generate a theme from this page or import your own"}
      >
        {!compact && <span className="max-w-[88px] truncate">{theme ? theme.name : "Theme"}</span>}
      </Button>
    </Popover>
  );
};
