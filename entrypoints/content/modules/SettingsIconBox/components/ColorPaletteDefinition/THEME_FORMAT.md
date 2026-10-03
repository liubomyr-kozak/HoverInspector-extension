# Theme format

The Color Palette & Typography tool can compare the page with a theme: the design tokens the page is
supposed to use. Open **Theme** on the right of the tab bar and either **Generate theme** (every value
the page uses now becomes a token, named like the Overview's "Copy as CSS variables"; copy it with
**Copy JSON** and remove what should not be a token) or paste your own / load a `.json` / `.css` file. It is
kept in the extension's storage (`browser.storage.local`, key `designTheme.active`) until you remove it.

Every value found on the page is then marked:

- ✓ matches a token (the token name is shown);
- ? close to a token (likely a typo of it): the nearest token and how far off;
- ⚠ nothing close: the nearest token and how far off.

Parsing and matching live in `utils/themeDiff.ts` (tested in `utils/__tests__/themeDiff.test.ts`).

## JSON

```json
{
  "name": "Acme UI",
  "colors": { "primary": "#2563eb", "text": "#1f2937", "border": "#e5e7eb" },
  "spacing": { "1": "4px", "2": "8px", "4": "16px" },
  "radii": { "sm": "4px", "md": "8px", "full": "9999px" },
  "shadows": { "sm": "0 1px 2px rgba(0, 0, 0, 0.05)" },
  "borders": { "default": "1px solid #e5e7eb" },
  "typography": {
    "fontFamilies": { "sans": "Inter, system-ui, sans-serif" },
    "fontSizes": { "sm": "14px", "base": "1rem" },
    "fontWeights": { "regular": "400", "bold": "700" },
    "lineHeights": { "normal": "1.5", "heading": "28px" }
  }
}
```

Every group is optional; a group that is missing is not checked. Also accepted:

- nested groups, flattened with `-`: `"colors": { "blue": { "500": "#3b82f6" } }` gives `blue-500`;
- design-token leaves: `{ "$value": "#3b82f6" }` or `{ "value": "#3b82f6" }`;
- bare numbers for lengths (px): `"spacing": { "4": 16 }`;
- typography groups at the top level (`"fontSizes": { … }`), `colours` for `colors`, `radius` for `radii`;
- the JSON wrapped in a ```` ```json ```` fence, as AI answers often are.

Values are CSS values: any CSS colour; lengths in `px`, `rem` (root font size) or `em`; shadows as
`box-shadow` values (several layers separated by commas); borders as `width style colour` (any part can be
left out); line heights unitless (× font size), in `%` or as a length.

## CSS custom properties

A `:root { … }` block works too, including the output of the Overview's **Copy as CSS variables**:

```css
:root {
  --color-primary: #2563eb;
  --space-4: 16px;
  --radius-md: 8px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --font-family-sans: Inter, sans-serif;
  --font-size-base: 1rem;
}
```

Each property is sorted by its name (`shadow`, `radius`, `font-family`, `weight`, `line-height` /
`leading`, `font-size` / `text-lg`, `border`, `space` / `gap`) and then by its value (colour → colours,
length → spacing). `var(--x)` references inside the block are resolved. A `/* theme: Name */` comment
names the theme.

## Matching

| Kind | Match (✓) | Close (?) |
| --- | --- | --- |
| Colours | ΔE (CIE76) < 2 | ΔE < 10 |
| Spacing, radii, font sizes | same px after conversion (1rem = 16px) | within 2px |
| Line heights | within 0.5px of the token × font size | within 2px |
| Font weights | same number (`bold` = 700) | within 100 |
| Font families | first family of the stack is the token's first family | it is a fallback in the token's stack |
| Shadows | same layers, lengths and colour (ΔE < 2) | within 4px in total, colour ΔE < 10 |
| Borders | width, style and colour (ΔE < 2) | width within 1px |

A type style (family, size, weight, line height) matches when every part the theme defines matches.
