import ExtensionLoader from "@entrypoints/core/services/ExtensionLoader.ts";

import {register, unregister, getAll} from './port.ts';
import {state} from './state.ts';
import icon from '../tabs/icon.ts';
import {remove} from '../tabs/tab.ts';
import {sendMessage} from "@entrypoints/features/extension/messaging.ts";
import {HOVER_INSPECTOR_DEACTIVATE} from "@entrypoints/shared/globalEvents.ts";

export async function activate(tabId: number) {
    state.set(tabId);
    icon.activate(tabId);

    await ExtensionLoader.loadStrategy.updateScriptManual(tabId);
}

export async function deactivate(tabId: number) {
    if (!tabId) return;

    try {
        await sendMessage(HOVER_INSPECTOR_DEACTIVATE, null, tabId as number);
    } catch (error) {
        console.log("🚀🚀🚀 deactivate::deactivate ->", tabId, error);
    }

    icon.deactivate(tabId);
    remove(tabId);
    state.clear(tabId);
}

export function initializePort(port: chrome.runtime.Port) {
    const tabId = port.sender?.tab?.id;
    if (!tabId) return;

    register(tabId, port);

    if (!state.isActive(tabId)) {
        deactivate(tabId);
        return;
    }

    port.onDisconnect.addListener(() => {
        unregister(tabId);
        deactivate(tabId);
    });

    port.postMessage({action: 'init'});

    port.onMessage.addListener((event) => {
        if (event.action === 'destroy') {
            deactivate(tabId);
        }
    });
}

export function isActive(tabId: number): boolean {
    return state.isActive(tabId);
}

export function getActivePorts() {
    return getAll(); // з `port.ts`
}