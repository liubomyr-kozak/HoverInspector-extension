import React, { useMemo, useRef, useState } from "react";
import { Button } from "antd";
import { IconCheck, IconCopy, IconFileUpload, IconSparkles, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { countThemeTokens, parseTheme, type DesignTheme } from "../utils/themeDiff";
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

/**
 * The one theme entry point for every tab: import (paste JSON or CSS variables, or load a file), an
 * example, a prompt for an AI to write one, and remove.
 */
export const ThemeBar: React.FC = () => {
  const { theme, setTheme } = usePalette();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { copy, copied } = useCopy();
  const parsed = useMemo(() => (text.trim() ? parseTheme(text) : null), [text]);

  const apply = () => {
    if (!parsed?.theme) return;
    setTheme(parsed.theme);
    setOpen(false);
    setText("");
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
  };

  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <IconSparkles size={16} className="shrink-0 text-blue-600" aria-hidden />
        <div className="flex-1 min-w-[8rem] text-xs text-gray-700">
          {theme ? (
            <>
              <span className="text-gray-600">Theme:</span>{" "}
              <strong className="text-gray-900 break-words">{theme.name}</strong>
              <div className="text-[11px] text-gray-500">{themeContents(theme)}</div>
            </>
          ) : (
            <>
              <strong className="text-gray-900">No theme</strong>
              <div className="text-[11px] text-gray-500">Import design tokens to check the page against them.</div>
            </>
          )}
        </div>
        <Button size="small" icon={<IconUpload size={14} />} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {theme ? "Replace" : "Import theme"}
        </Button>
        {theme && (
          <IconButton label="Remove theme" size={24} onClick={() => setTheme(null)}>
            <IconTrash />
          </IconButton>
        )}
      </div>

      {open && (
        <div className="border-t border-gray-200 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="palette-theme-input" className="text-xs font-medium text-gray-700">
              Paste theme JSON or CSS variables
            </label>
            <IconButton label="Close import" size={24} onClick={() => setOpen(false)}>
              <IconX />
            </IconButton>
          </div>
          <textarea
            id="palette-theme-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder={'{ "name": "Brand", "colors": { "primary": "#2563eb" }, "spacing": { "4": "16px" } }\nor\n:root { --color-primary: #2563eb; --space-4: 16px; }'}
            className="w-full h-32 p-2 text-xs font-mono border border-gray-300 rounded resize-y bg-white focus:border-blue-600"
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
              Example theme
            </Button>
            <Button
              size="small"
              icon={copied === AI_THEME_PROMPT ? <IconCheck size={14} /> : <IconCopy size={14} />}
              onClick={() => copy(AI_THEME_PROMPT)}
              title="Copies a prompt to give an AI, which answers with a theme for your brand to paste here"
            >
              {copied === AI_THEME_PROMPT ? "Prompt copied" : "Copy prompt for AI"}
            </Button>
          </div>
          {parsed && (
            <div
              role="status"
              className={`text-xs rounded px-2 py-1 ${parsed.theme ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
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
          <div className="flex justify-end gap-1.5">
            <Button size="small" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="small" type="primary" disabled={!parsed?.theme} onClick={apply}>
              Use this theme
            </Button>
          </div>
          <p className="m-0 text-[11px] text-gray-500">
            The theme is kept in the extension until you remove it. Values that match a token get ✓, close ones ?, others ⚠.
          </p>
        </div>
      )}
    </div>
  );
};
