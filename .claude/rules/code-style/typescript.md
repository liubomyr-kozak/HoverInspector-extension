---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Code style: TypeScript, imports, comments, errors, logging

- Give new code real types even though `noImplicitAny` is currently disabled. Use `unknown` and
  narrowing at external boundaries, not casts that merely silence errors.
- Prefer `interface` for object shapes, `type` for unions, and `as const` for fixed lookup objects.
- Use `import type` or inline `type` for type-only imports.
- Use `@entrypoints/...` across tool/folder boundaries and relative imports within the same tool.
  Do not add `@/entrypoints/...` or long relative paths escaping the tool.
- Omit `.ts`/`.tsx` import extensions. Order React, other packages, alias imports, then relative imports.
- Use double quotes and semicolons; follow `.prettierrc` for formatting. Do not reformat unrelated code.
- Comments explain intent or constraints in English. Add short JSDoc for exported helpers/components
  and non-obvious contracts. Do not document obvious implementation steps.

Error handling:

| Situation | Handling |
| --- | --- |
| Caller owns recovery | Return/propagate the error to that caller; ensure the async chain is handled |
| User action fails | Explain with `toast.error(...)` or inline error text |
| Failure needs diagnosis | `console.error("Failed to ...", error)`; prefix background logs with the area |
| Expected recoverable problem | `console.warn(...)` when useful |
| Explicitly best-effort preference/history write | Catching with `.catch(() => undefined)` is allowed only when silent loss is acceptable |

Do not silently swallow user-authored data or successful-save claims. No unhandled rejections.
Use toasts or antd confirmation controls, not `alert`, `confirm` or `prompt`.
Do not add `console.log`, `debugger`, commented-out code or TypeScript suppression directives.
