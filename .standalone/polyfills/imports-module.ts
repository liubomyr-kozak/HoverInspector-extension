/**
 * Implementation file for the #imports virtual module in standalone mode
 * This file provides actual implementations for the functions and objects
 * that are exported from the #imports virtual module
 */

// Export browser and related types from our standalone implementation
export { browser, Browser } from './standalone-browser';

// Export WXT utility mocks from our standalone implementation
export { defineBackground, defineContentScript, createShadowRootUi } from './wxt-mocks';

// Export React hooks directly from React
export { useState, useCallback, useMemo, useEffect, useRef, useContext, useReducer } from 'react';

// Mock implementation for @webext-core/messaging
export function defineExtensionMessaging<T>() {
  return {
    sendMessage: async (type: keyof T, data?: any, tabId?: number) => {
      console.log('Mock sendMessage called with:', { type, data, tabId });
      return {};
    },
    onMessage: (type: keyof T, callback: (data: any) => void) => {
      console.log('Mock onMessage registered for:', type);
      // In standalone mode, we don't actually register any listeners
      return () => {}; // Return unsubscribe function
    }
  };
}

// Mock implementations for other WXT utilities

// Storage mock
export const storage = {
  get: async () => ({}),
  set: async () => {},
  remove: async () => {},
  clear: async () => {},
  onChange: {
    addListener: () => {},
    removeListener: () => {},
  },
};

// App config mock
export const useAppConfig = () => ({});

// Content script context mock
export const ContentScriptContext = {};
export const WxtWindowEventMap = {};

// UI creation mocks
export const createIframeUi = async (ctx: any, options: any) => ({
  mount: () => {},
  unmount: () => {},
});

export const createIntegratedUi = async (ctx: any, options: any) => ({
  mount: () => {},
  unmount: () => {},
});

export const ContentScriptUi = {};

// Other WXT utility mocks
export const defineAppConfig = (config: any) => config;
export const defineUnlistedScript = (options: any) => options;
export const defineWxtPlugin = (plugin: any) => plugin;
export const injectScript = async (options: any) => {};
export const InvalidMatchPattern = {};
export const MatchPattern = {};
export const fakeBrowser = {};

// Type definitions are provided in imports-module.d.ts