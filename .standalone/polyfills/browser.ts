import { defineBackground, defineContentScript, createShadowRootUi } from './wxt-mocks';

export const browser = {
    action: {
        onClicked: {
            addListener: (callback: (tab: any) => void) => {},
        },
        setIcon: async (details: { path: string; tabId?: number }) => {
            console.log("Setting icon with details:", details);
        }
    },
    runtime: {
        id: "mock-extension-id",
        getURL: (path: string) => path,
        onConnect: {
            addListener: (callback: (port: any) => void) => {},
        },
        onSuspend: {
            addListener: (callback: () => void) => {},
        },
        onMessage: {
            addListener: (callback: (request: any, sender: any, sendResponse: any) => boolean) => {},
        },
        sendMessage: async (data: any, callback?: (response: any) => void) => {},
    },
    storage: {
        local: {
            get: async () => ({}),
            set: async () => {},
        },
    },
    tabs: {
        create: async () => {},
        query: async (queryInfo: any) => [] as any[],
        sendMessage: async (tabId: number, message: any) => {},
    },
    scripting: {
        executeScript: async (details: { target: { tabId: number }, files: string[] }) => {},
        insertCSS: async (details: { target: { tabId: number }, files: string[] }) => {},
    },
    windows: {
        create: async (createData: any) => ({ id: 1 }),
        update: (windowId: number, updateInfo: any) => {},
        getCurrent: (queryOptions: any, callback?: (window: { id: number }) => void) => {
            if (callback) {
                callback({ id: 1 });
            }
            return { id: 1 };
        },
    }
};

// Export the mock implementations
export { defineBackground, defineContentScript, createShadowRootUi };

// Attach WXT functions to global scope
(window as any).defineBackground = defineBackground;
(window as any).defineContentScript = defineContentScript;
(window as any).createShadowRootUi = createShadowRootUi;
(window as any).browser = browser;