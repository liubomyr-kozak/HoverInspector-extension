---
paths:
  - "**/__tests__/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "vitest.config.*"
---

# Code style: tests

vitest uses jsdom and repository aliases. WXT auto-imports do not exist in tests; explicitly import
extension APIs where needed or keep pure logic independent of them.

- For a bug, reproduce the incorrect behavior before fixing it, then verify the fix.
- Test meaningful parsing, calculation, matching and state transitions, including relevant edge cases.
- Test message sanitizers with malformed/oversized input; test migrations against old saved shapes.
- Do not extract trivial expressions or add tests that merely repeat implementation to satisfy a quota.
- UI changes need the browser check in `workflow.md`. The existing suite focuses on logic rather than
  component interaction; small markup helpers may use `renderToStaticMarkup`.
- Import `describe`, `expect`, `it` from `vitest`. Name cases by behavior. Use fixed dates rather than
  the live clock when testing date-dependent logic.

Examples to inspect: `shared/frameAgent/__tests__/protocol.test.ts`,
`background/services/noteScope.test.ts`, and the tool's existing `utils/__tests__/`.

Start with `yarn vitest run <relevant-path>`. Run the full suite and build as required by "Checklist before you commit" in `workflow.md`.
Do not quote a historic test count as evidence of passing tests.
