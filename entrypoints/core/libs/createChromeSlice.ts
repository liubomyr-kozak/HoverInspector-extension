import { requestProcessing } from "./requestProcessing.ts";

type LocalExecFn<T = any, R = any> = (
  params: { data: T },
  ctx: { getState: () => any; setState: (newState: Partial<any>) => Promise<void> },
) => Promise<R>;

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

const defaultStorageStrategies: Record<StorageType, StorageStrategy> = {
  localStorage: {
    get: async (key: string) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    },
    set: async (key: string, data: any) => {
      localStorage.setItem(key, JSON.stringify(data));
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

export const createChromeSlice = async <T extends Record<string, LocalExecFn>>(config: SliceDefinition<T>) => {
  const { name = "__global__", initialState, version = 1, actions, storage = "localStorage" } = config;

  const storageStrategy = defaultStorageStrategies[storage];

  // Отримуємо persistedState із storage
  const persistedState = await storageStrategy.get(name);

  // Ініціалізація state з версіонністю
  let state: any;
  if (persistedState?.version === version) {
    state = { ...initialState, ...persistedState };
  } else if (persistedState) {
    const preservedKeys = Object.keys(initialState).filter((key) => key in persistedState);
    state = { ...initialState };
    for (const key of preservedKeys) state[key] = persistedState[key];
    state.version = version;
  } else {
    state = { ...initialState, version };
  }

  const getState = () => state;
  const setState = async (newState: Partial<typeof state>) => {
    state = { ...state, ...newState };
    await storageStrategy.set(name, state);
  };

  const bound: any = {};
  for (const key in actions) {
    const fn = actions[key];
    bound[key] = (data: Parameters<typeof fn>[0]) =>
      new Promise<Awaited<ReturnType<typeof fn>>>((resolve) => {
        requestProcessing({ action: `${name}/${key}`, data }, resolve, () => fn({ data }, { getState, setState }));
      });
  }

  return {
    name,
    getState,
    setState,
    actions,
    ...bound,
  } as {
    name: string;
    getState: () => typeof state;
    setState: (newState: Partial<typeof state>) => Promise<void>;
    actions: T;
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
          fn(request.data).then((res) => sendResponse(res));
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
