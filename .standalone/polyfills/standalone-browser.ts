/**
 * Standalone browser polyfill that provides type definitions without using browser API
 * This file is used in the standalone build to avoid using browser API
 */

import { defineBackground, defineContentScript, createShadowRootUi } from './wxt-mocks';
import { createStandaloneStorage, StandaloneStorage } from './standaloneStorage';

type MessageListener = (message: unknown, sender: { id: string }, sendResponse: (response?: unknown) => void) => unknown;

// Same in-page message bus as LinguaReef's BrowserApi mock: background code runs in the page, so a
// message "to a tab" goes straight to the listeners the content code registered here.
const messageListeners = new Set<MessageListener>();
const STANDALONE_EXTENSION_ID = "standalone-extension-id";

const deliverToListeners = async (message: unknown): Promise<unknown> => {
  let response: unknown;
  for (const listener of messageListeners) {
    const result = await new Promise<unknown>((resolve) => {
      const returned = listener(message, { id: STANDALONE_EXTENSION_ID }, resolve);
      // A listener that returns true answers later through sendResponse; anything else answers now
      if (returned !== true) resolve(returned instanceof Promise ? returned : undefined);
    });
    if (result !== undefined) response = result;
  }
  return response;
};

// Define Browser interface for export
export interface Browser {
  action: {
    onClicked: {
      addListener: (callback: (tab: any) => void) => void;
    };
    setIcon: (details: { path: string; tabId?: number }) => Promise<void>;
  };
  runtime: {
    id: string;
    getURL: (path: string) => string;
    onConnect: {
      addListener: (callback: (port: any) => void) => void;
    };
    onSuspend: {
      addListener: (callback: () => void) => void;
    };
    onMessage: {
      addListener: (callback: MessageListener) => void;
      removeListener: (callback: MessageListener) => void;
      hasListener: (callback: MessageListener) => boolean;
    };
    sendMessage: (data: any, callback?: (response: any) => void) => Promise<void>;
  };
  storage: StandaloneStorage;
  tabs: {
    create: () => Promise<void>;
    query: (queryInfo: any) => Promise<any[]>;
    sendMessage: (tabId: number, message: unknown) => Promise<unknown>;
  };
  scripting: {
    executeScript: (details: { target: { tabId: number }, files: string[] }) => Promise<void>;
    insertCSS: (details: { target: { tabId: number }, files: string[] }) => Promise<void>;
  };
  windows: {
    create: (createData: any) => Promise<{ id: number }>;
    update: (windowId: number, updateInfo: any) => void;
    getCurrent: (queryOptions: any, callback?: (window: { id: number }) => void) => any;
  };
}

// Export empty browser object with type definitions
// This object doesn't use any browser API but provides the necessary type structure
export const browser: Browser = {
  action: {
    onClicked: {
      addListener: (callback: (tab: any) => void) => {
        console.log('Mock browser.action.onClicked.addListener called');
      },
    },
    setIcon: async (details: { path: string; tabId?: number }) => {
      console.log('Mock browser.action.setIcon called with:', details);
    }
  },
  runtime: {
    id: STANDALONE_EXTENSION_ID,
    getURL: (path: string) => path,
    onConnect: {
      addListener: (callback: (port: any) => void) => {
        console.log('Mock browser.runtime.onConnect.addListener called');
      },
    },
    onSuspend: {
      addListener: (callback: () => void) => {
        console.log('Mock browser.runtime.onSuspend.addListener called');
      },
    },
    onMessage: {
      addListener: (callback) => {
        messageListeners.add(callback);
      },
      removeListener: (callback) => {
        messageListeners.delete(callback);
      },
      hasListener: (callback) => messageListeners.has(callback),
    },
    sendMessage: async (data: any, callback?: (response: any) => void) => {
      console.log('Mock browser.runtime.sendMessage called with:', data);
      if (callback) callback({});
    },
  },
  storage: createStandaloneStorage(window.localStorage, window.sessionStorage),
  tabs: {
    create: async () => {
      console.log('Mock browser.tabs.create called');
    },
    query: async (queryInfo: any) => {
      console.log('Mock browser.tabs.query called with:', queryInfo);
      return [];
    },
    // Every "tab" is this page
    sendMessage: (_tabId, message) => deliverToListeners(message),
  },
  scripting: {
    executeScript: async (details: { target: { tabId: number }, files: string[] }) => {
      console.log('Mock browser.scripting.executeScript called with:', details);
    },
    insertCSS: async (details: { target: { tabId: number }, files: string[] }) => {
      console.log('Mock browser.scripting.insertCSS called with:', details);
    },
  },
  windows: {
    create: async (createData: any) => {
      console.log('Mock browser.windows.create called with:', createData);
      return { id: 1 };
    },
    update: (windowId: number, updateInfo: any) => {
      console.log('Mock browser.windows.update called with:', windowId, updateInfo);
    },
    getCurrent: (queryOptions: any, callback?: (window: { id: number }) => void) => {
      console.log('Mock browser.windows.getCurrent called with:', queryOptions);
      if (callback) {
        callback({ id: 1 });
      }
      return { id: 1 };
    },
  }
};

// Export the mock implementations
export { defineBackground, defineContentScript, createShadowRootUi };

// Add default export for compatibility with libraries that use default import
export default browser;

// Make browser and chrome globally available for compatibility with code that expects them to be global
// This is needed despite the original intention not to modify the global window object
(window as any).browser = browser;
(window as any).chrome = browser; // Add chrome as an alias to browser

console.log('Standalone browser polyfill loaded with global browser and chrome objects');