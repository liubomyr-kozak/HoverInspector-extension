import { requestProcessing } from "./requestProcessing.ts";
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";

type LocalExecFn<T = any, R = any> = (
  params: T,
  ctx: { getState: () => any; setState: (newState: Partial<any>) => void },
) => Promise<R> | R;

// Key used to transport an action error from the background back to the caller
const SLICE_ERROR_KEY = "__chromeSliceError";

type StorageType = "localStorage" | "sessionStorage";

type StorageStrategy = {
  get: (key: string) => Promise<any>;
  set: (key: string, data: any) => Promise<void>;
};

type SliceDefinition<T extends Record<string, LocalExecFn>> = {
  name: string;
  initialState: any;
  version?: number;
  actions: T;
  storage?: StorageType; // localStorage or sessionStorage
};

const chromeStorageStrategies: Record<StorageType, StorageStrategy> = {
  localStorage: {
    get: async (key: string) => {
      const raw = await LocalStorage.get(key);
      return raw ? JSON.parse(raw) : null;
    },
    set: async (key: string, data: any) => {
      LocalStorage.set(key, JSON.stringify(data));
    },
  },
  sessionStorage: {
    get: async (key: string) => {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    },
    set: async (key: string, data: any) => {
      sessionStorage.setItem(key, JSON.stringify(data));
    },
  },
};

export const createChromeSlice = <T extends Record<string, LocalExecFn>>(config: SliceDefinition<T>) => {
  const { name = "__global__", initialState, version = 1, storage = "localStorage" } = config;
  const storageStrategy = chromeStorageStrategies[storage];

  // Local state is always synchronous
  let state = { ...initialState, version };

  // Load persistedState from Chrome storage asynchronously.
  // Every action awaits `ready`, so nothing reads the empty initial state (or
  // overwrites storage with it) before the persisted state has been loaded.
  const ready: Promise<void> = Promise.resolve()
    .then(() => storageStrategy.get(name))
    .then((persistedState: any) => {
      if (!persistedState) return;
      if (persistedState.version === version) {
        state = { ...state, ...persistedState };
      } else {
        const preservedKeys = Object.keys(initialState).filter((key) => key in persistedState);
        for (const key of preservedKeys) state[key] = persistedState[key];
        state.version = version;
      }
    })
    .catch((error) => {
      console.error(`[${name}] failed to load persisted state`, error);
    });

  const getState = () => state;

  // setState updates local state synchronously and writes to storage asynchronously
  const setState = (newState: Partial<typeof state>) => {
    state = { ...state, ...newState };
    storageStrategy.set(name, state).catch(console.error);
  };

  const methods = { getState, setState };

  // Actions wrapped so they always run against the loaded state
  const actions = {} as T;
  for (const key in config.actions) {
    const fn = config.actions[key];
    actions[key] = (async (data: any, ctx: typeof methods) => {
      await ready;
      return fn(data, ctx);
    }) as T[typeof key];
  }

  const bound: any = {};

  for (const key in actions) {
    const fn = actions[key];
    bound[key] = (data: Parameters<typeof fn>[0]) =>
      new Promise<Awaited<ReturnType<typeof fn>>>((resolve, reject) => {
        const debugCb = () => fn(data, methods);

        requestProcessing(
          { action: `${name}/${key}`, data },
          (response: any) => {
            if (response && typeof response === "object" && SLICE_ERROR_KEY in response) {
              reject(new Error(response[SLICE_ERROR_KEY]));
            } else {
              resolve(response);
            }
          },
          debugCb,
          reject,
        );
      });
  }

  return {
    name,
    actions,
    methods,
    ready,
    ...bound,
  } as {
    name: string;
    actions: T;
    ready: Promise<void>;
    methods: {
      getState: () => typeof state;
      setState: (newState: Partial<typeof state>) => void;
    };
  } & {
    [K in keyof T]: (data: Parameters<T[K]>[0]) => Promise<Awaited<ReturnType<T[K]>>>;
  };
};
// =====================================================
// combineChromeSlices
// =====================================================
export const combineChromeSlices = <T extends Record<string, ReturnType<typeof createChromeSlice>>>(slices: T) => {
  const root: any = { ...slices };

  root.initMiddleware = () => {
    if (chrome.runtime) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (typeof request?.action !== "string") return false;
        const [sliceName, actionName] = request.action.split("/");

        const slice = Object.values(slices).find((s) => s.name === sliceName);
        if (slice && slice.actions[actionName]) {
          const fn = slice.actions[actionName] as LocalExecFn;

          Promise.resolve()
            .then(() => fn(request.data, slice.methods))
            .then(
              (res) => sendResponse(res),
              (error) => {
                console.error(`[${request.action}] failed`, error);
                sendResponse({ [SLICE_ERROR_KEY]: String(error?.message || error) });
              },
            );
          return true;
        }
        return false;
      });
    }
  };

  return root as {
    [K in keyof T]: T[K];
  } & { initMiddleware: () => void };
};
