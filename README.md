# Hover Inspector

A browser extension for designers, front-end developers and QA engineers. Hover over any element on a
page to see its size and the distances to the element you selected, and open more inspection tools from
one floating panel.

Chrome (Manifest V3) is the main target; Firefox, Edge and Safari builds are produced from the same code.

## Tools

| Tool | What it does |
| --- | --- |
| Element Inspector | Size, spacing and styles of the hovered element, and its distances to the selected one |
| Page Ruler | The viewport size against common device widths and CSS framework breakpoints |
| Color Picker | Pick solid colours and gradients and copy them as HEX or rgba() |
| Unit Converter | Convert between px, rem, em, %, vw and vh |
| Color Palette & Typography | The page's colours, type scale, spacing, radii and shadows, compared with a design theme |
| Automation Scenarios | Record, edit and replay step-by-step scenarios on a page |
| CSS Snapshot Inspector | Capture the CSS of a page or element and diff two snapshots |
| Live Watching | Note your actions across pages in a floating watch log and turn repeated ones into scenarios |

The whole UI runs in a shadow root on the page, so it does not change the page's own styles.

## Install from source

You need a current Node.js LTS release and [Yarn 1](https://classic.yarnpkg.com/). This project uses Yarn only;
`yarn.lock` is the only lockfile.

```bash
git clone https://github.com/liubomyr-kozak/HoverInspector-extension.git
cd HoverInspector-extension
yarn install
yarn build
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked** and select
`dist/chrome-mv3`. Click the extension's toolbar button on any page to turn it on.

## Development

```bash
yarn dev          # WXT dev browser with the extension loaded ("staging" mode)
yarn dev:firefox  # the same in Firefox (also dev:chrome, dev:edge)
yarn start        # standalone page at http://localhost:4400, no extension needed
yarn test         # unit tests (vitest + jsdom)
yarn test:watch   # unit tests in watch mode
yarn verify       # pattern checks, TypeScript diff against master, tests and build
```

### Modes

WXT sets `NODE_ENV` to the build mode, and the code switches on it (`entrypoints/shared/helpers.ts`,
`entrypoints/core/libs/requestProcessing.ts`, `entrypoints/core/services/storage/LocalStorage.ts`).

| Command | `NODE_ENV` | Background actions | Data |
| --- | --- | --- | --- |
| `yarn start` | `development` | run in the page itself | the page's `localStorage` (see `.standalone/polyfills/standaloneStorage.ts`) |
| `yarn dev`, `yarn build:local` | `staging` | sent to the background service worker | extension storage |
| `yarn build`, `yarn zip` | `production` | sent to the background service worker | extension storage |

`development` is only for the standalone page. Never run the extension itself in development mode
(`wxt --mode development`): its content script would then run background actions in the page and keep
the extension's data in the website's own `localStorage`.

`yarn build:local` builds the extension as it ships, but not minified and with source maps, into
`dist/chrome-mv3-staging/`.

### Build and package

```bash
yarn build          # tests, then production build -> dist/chrome-mv3/
yarn build:firefox  # also build:chrome, build:edge, build:safari
yarn zip            # build and zip -> archives/<version>-<browser>.zip
yarn zip:firefox    # also zip:chrome, zip:edge
```

## Project structure

```
entrypoints/
  background/    service worker: toolbar button, tabs, frame relay, MCP bridge
  content/       content script: shadow-root UI, Redux store, the panel and every tool
  core/          storage services and other infrastructure without UI
  features/      messaging protocol and tab sessions
  shared/        shared components, design tokens and helpers
mcp-server/      optional MCP server that lets AI agents use the extension
.standalone/     polyfills for the standalone development page
```

## MCP server for AI agents

An optional local MCP server lets AI agents (Claude Code, Cursor, Codex and other MCP clients) read a
page's palette and type scale, take CSS snapshots and screenshots, and run automation scenarios through
the extension. It listens on `127.0.0.1` only and is off until you turn it on in the extension's menu.
See [mcp-server/README.md](mcp-server/README.md).

## Privacy

The extension keeps its data (settings, scenarios, snapshots, watch log) in the browser's extension
storage on your computer. It has no analytics or tracking. It sends data only where you point it: the
MCP bridge, when you turn it on, talks only to a server on your own machine, and Automation Scenarios
can sync with a server only if you enter its address in the scenario settings.

## Contributing

Issues and pull requests are welcome. Before you open a pull request, run `yarn verify` and check UI
changes in Chromium at 320px and 440px panel width. The code style and architecture guide starts at
[docs/CODE_STYLE.md](docs/CODE_STYLE.md); [CLAUDE.md](CLAUDE.md) is the short version for AI coding agents.

## License

[MIT](LICENSE) © Liubomyr Kozak

`entrypoints/shared/components/git-diff-view/` contains a copy of
[git-diff-view](https://github.com/MrWangJustToDo/git-diff-view) under its own MIT license
([LICENSE](entrypoints/shared/components/git-diff-view/react/LICENSE)).
