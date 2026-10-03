---
paths:
  - "entrypoints/content/store/**"
  - "entrypoints/**/*.slice.ts"
  - "entrypoints/**/*.saga.ts"
  - "entrypoints/**/*.saga.action.ts"
  - "entrypoints/core/libs/**"
  - "entrypoints/**/*Context.tsx"
---

# Code style: state (Redux, sagas, local state)

| Data | Owner |
| --- | --- |
| State used by one component | Local `useState` |
| State shared within a tool | Lift to a common owner; use tool context when prop relaying becomes the problem |
| App-wide or shared domain state | Content Redux slice |
| Data that survives reloads | Storage, loaded into the appropriate state owner |

Small tools may use local state and storage directly. Do not add Redux just for persistence.

## Content slices

Add `<domain>/<domain>.slice.ts` under `entrypoints/content/store/` and register its reducer in
`rootReducer.ts`. Export typed selectors alongside the slice and use `useSelector(selectX)` in UI.

Minimal slice template (adapt the domain, file and registration):

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface WordCounterState {
  lastCount: number;
}

const initialState: WordCounterState = { lastCount: 0 };
const wordCounterSlice = createSlice({
  name: "wordCounter",
  initialState,
  reducers: {
    setLastCount: (state, action: PayloadAction<number>) => {
      state.lastCount = action.payload;
    },
  },
});

export const { setLastCount } = wordCounterSlice.actions;
/** Selects the most recent count. */
export const selectLastCount = (state: { wordCounter: WordCounterState }) => state.wordCounter.lastCount;
export default wordCounterSlice.reducer;
```

## Sagas

For side effects triggered by Redux actions, follow the existing domain's saga setup:

1. Define the action generator using `sagaEnhancer` in `<domain>.saga.action.ts`.
2. Give its generator a unique name: the enhancer derives an action type from the name.
3. Register the watcher in `<domain>.saga.ts`; register a new domain saga in `rootSaga.ts`.
4. Dispatch with `action.getPayload(payload)`.

Use `call` for async operations in new sagas; do not copy older direct promise yields.
Fragment inside an existing saga (import `call` and `put` from `redux-saga/effects`):

```ts
yield call(() => ExtensionStorageManager.changeLauncherIconOrder(payload));
yield put(setLauncherIconOrder(payload));
```

Catch failures and restore loading state in `finally` where applicable. Existing domains keep their
naming; for a new domain use `<verb><Noun>Watcher` in `<domain>.saga.action.ts`.
Reference definitions: `core/libs/sagaEnhancer.ts`, `content/store/rootSaga.ts`.
