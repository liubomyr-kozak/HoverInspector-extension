# Hover Inspector: code style and architecture

The guide is split by topic in [`.claude/rules/code-style/`](../.claude/rules/code-style/). Claude Code
loads those files by itself: the first three at every session start, the rest when it reads or edits a
matching file (each file's `paths:` list). Other agents and people: read `core.md`, then the topic files
for your change.

| Topic | File |
| --- | --- |
| Read first: scope, core rules, which file covers what | [core.md](../.claude/rules/code-style/core.md) |
| Architecture, folder map, file naming | [architecture.md](../.claude/rules/code-style/architecture.md) |
| Commands, browser check, Git, verification checklist | [workflow.md](../.claude/rules/code-style/workflow.md) |
| Writing a component, shared components and helpers | [components.md](../.claude/rules/code-style/components.md) |
| The tool panel: header, body, footer | [panel.md](../.claude/rules/code-style/panel.md) |
| Styling, tokens and Tailwind classes, shadow-root overlays | [styling.md](../.claude/rules/code-style/styling.md) |
| State: Redux, sagas, local state | [state.md](../.claude/rules/code-style/state.md) |
| Storage | [storage.md](../.claude/rules/code-style/storage.md) |
| Background and messaging | [messaging.md](../.claude/rules/code-style/messaging.md) |
| Working with the host page, frames | [host-page.md](../.claude/rules/code-style/host-page.md) |
| TypeScript, imports, comments, errors, logging | [typescript.md](../.claude/rules/code-style/typescript.md) |
| Legacy code: do not copy | [legacy.md](../.claude/rules/code-style/legacy.md) |
| Tests | [tests.md](../.claude/rules/code-style/tests.md) |

When you change a rule, edit the topic file. Keep a new file's `paths:` list narrow enough that it
loads only for code it is about.
