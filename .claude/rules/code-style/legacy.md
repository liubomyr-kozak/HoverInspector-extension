---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Code style: legacy code, do not copy

Follow these replacements in the lines your task needs. Leave unrelated legacy code alone, even if its
cleanup looks small. Report a relevant obstacle; do not expand the task into a migration.

| Old pattern | New code |
| --- | --- |
| `any` selectors or suppressed typing | Typed selectors/props; `unknown` with validation at boundaries |
| Custom untyped popup-container lookup | Shared `shadowBody` helper |
| Hard-coded theme colors | Shared token or corresponding Tailwind class |
| Button focus rings / selection rings | Global keyboard focus / selected background tint |
| Dark-mode classes or orange primary palette | Current light theme |
| Literal or another tool's portal id | Own `HeaderPortalId` value |
| `ScenarioPortalHeaderButtons` header alias | `PortalModalHeader` |
| Styling props forwarded to DOM | `$` transient styled props |
| Old custom thunk middleware | Existing RTK slice/saga setup |
| `@/entrypoints/...` imports | `@entrypoints/...` |
| Tests beside source | New tests in adjacent `__tests__/` |
| Hand-positioned dropdown div | antd Popover menu with keyboard handling |

Vendored areas (`shared/components/git-diff-view/`, `shared/components/ReactRnd/`,
`PopupContainer/Note Taking Tools/`) are not style references. Edit them only when targeted by the task.
