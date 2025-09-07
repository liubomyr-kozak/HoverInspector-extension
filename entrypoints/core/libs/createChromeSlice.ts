import { requestProcessing } from "./requestProcessing.ts";
import LocalStorage from "@entrypoints/core/services/storage/LocalStorage.ts";

type LocalExecFn<T = any, R = any> = (
  params: T,
  ctx: { getState: () => any; setState: (newState: Partial<any>) => void },
) => Promise<R> | R;

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
  storage?: StorageType; // localStorage або sessionStorage
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

console.log("😎😎😎 :: -> createChromeSlice");
export const createChromeSlice = <T extends Record<string, LocalExecFn>>(config: SliceDefinition<T>) => {
  const { name = "__global__", initialState, version = 1, actions, storage = "chromeLocal" } = config;
  const storageStrategy = chromeStorageStrategies[storage];

  // Локальний state завжди синхронний
  let state = { ...initialState, version };

  // Асинхронне завантаження persistedState з Chrome storage
  storageStrategy.get(name).then((persistedState: any) => {
    if (persistedState) {
      if (persistedState.version === version) {
        state = { ...state, ...persistedState };
      } else {
        const preservedKeys = Object.keys(initialState).filter((key) => key in persistedState);
        for (const key of preservedKeys) state[key] = persistedState[key];
        state.version = version;
      }
    }
  });

  const getState = () => state;

  // setState оновлює локальний state синхронно і відправляє асинхронно у storage
  const setState = (newState: Partial<typeof state>) => {
    state = { ...state, ...newState };
    storageStrategy.set(name, state).catch(console.error);
  };

  const bound: any = {};
  const methods = { getState, setState };

  for (const key in actions) {
    const fn = actions[key];
    bound[key] = (data: Parameters<typeof fn>[0]) =>
      new Promise<Awaited<ReturnType<typeof fn>>>((resolve) => {
        const debugCb = () => fn(data, methods);

        requestProcessing({ action: `${name}/${key}`, data }, resolve, debugCb);
      });
  }

  return {
    name,
    actions,
    methods,
    ...bound,
  } as {
    name: string;
    actions: T;
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
        const [sliceName, actionName] = request.action.split("/");

        const slice = Object.values(slices).find((s) => s.name === sliceName);
        if (slice && slice.actions[actionName]) {
          const fn = slice.actions[actionName] as LocalExecFn;

          fn(request.data, slice.methods).then((res) => sendResponse(res));
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
