const ports = new Map<number, chrome.runtime.Port>();

export function register(tabId: number, port: chrome.runtime.Port) {
    ports.set(tabId, port);
}

export function unregister(tabId: number) {
    ports.delete(tabId);
}

export function get(tabId: number): chrome.runtime.Port | undefined {
    return ports.get(tabId);
}

export function getAll(): Map<number, chrome.runtime.Port> {
    return ports;
}
