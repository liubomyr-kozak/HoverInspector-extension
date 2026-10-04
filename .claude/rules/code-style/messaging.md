---
paths:
  - "entrypoints/background/**"
  - "entrypoints/features/**"
  - "entrypoints/core/libs/**"
  - "entrypoints/shared/frameAgent/**"
  - "entrypoints/frame-agent.ts"
---

# Code style: background and messaging

Background has privileged tabs/scripting/windows APIs and no page DOM. Content has page DOM and React.
Put work in background when it needs those privileged APIs, outlives the page or coordinates tabs.

Reuse the layer for the domain:

| Purpose | Existing layer |
| --- | --- |
| Extension activation/deactivation/check | `features/extension/messaging.ts`, `@webext-core/messaging` |
| Call background domain actions | `core/libs/chromeActionsSlice.ts` and `background/store/actions/`, `background/store/slices/` |
| Notes with persisted slice state | `core/libs/createChromeSlice.ts`, `background/store/notesActionsSlice.ts` |
| Frame agent | Runtime messages with a `type` field; `shared/frameAgent/protocol.ts`, `background/frameAgentRelay.ts` |

Do not introduce `webext-bridge`; it is installed but unused.

To extend a background domain action, add the function to that domain's action object and export it
through its slice. Add a storage-manager method when the existing domain uses that manager. Notes
export their actions directly. Follow the receiving API's `({ data }, sender)` contract and return
JSON-serializable values. Inspect the wrapper's error result before handling it at the caller.

Message boundary rules:

- Treat incoming values as `unknown`, then validate their shape before accessing fields.
- For content-script messages, check `sender.id === browser.runtime.id` and required tab/frame identity.
- Ignore messages outside your protocol so other listeners can handle them.
- Never trust page `window.postMessage` payloads. Do not send page content over that channel.
