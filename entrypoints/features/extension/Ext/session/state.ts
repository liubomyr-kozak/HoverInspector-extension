export class ExtStateSingleTab {
    tabId: number | null = null;
    alive = false;

    set(tabId: number) {
        this.tabId = tabId;
        this.alive = true;
    }

    clear() {
        this.tabId = null;
        this.alive = false;
    }

    isActive(tabId: number) {
        return this.alive && this.tabId === tabId;
    }
}

const ACTIVE_TABS_SESSION_KEY = "hoverInspectorActiveTabs";

/**
 * Tabs where the extension is switched on. Mirrored to chrome.storage.session because the MV3
 * service worker is stopped after ~30s idle and an in-memory map alone would forget every tab
 * (the icon would still say "active" while a click tried to activate again).
 */
export class ExtStateMultipleTabs {
    private stateMap: Map<number, { alive: boolean }> = new Map();

    readonly ready: Promise<void> = this.restore();

    private async restore() {
        try {
            const stored = await chrome.storage?.session?.get(ACTIVE_TABS_SESSION_KEY);
            const tabIds: number[] = stored?.[ACTIVE_TABS_SESSION_KEY] || [];
            tabIds.forEach((tabId) => this.stateMap.set(tabId, {alive: true}));
        } catch (e) {
            // storage.session is unavailable (old browser) — keep the in-memory behaviour
        }
    }

    private persist() {
        chrome.storage?.session?.set({[ACTIVE_TABS_SESSION_KEY]: this.getAllActiveTabs()}).catch(() => undefined);
    }

    set(tabId: number) {
        this.stateMap.set(tabId, {alive: true});
        this.persist();
    }

    clear(tabId: number) {
        this.stateMap.delete(tabId);
        this.persist();
    }

    isActive(tabId: number) {
        const state = this.stateMap.get(tabId);
        return !!state?.alive;
    }

    clearAll() {
        this.stateMap.clear();
        this.persist();
    }

    getAllActiveTabs(): number[] {
        return Array.from(this.stateMap.entries())
            .filter(([_, value]) => value.alive)
            .map(([tabId]) => tabId);
    }
}

export const state = new ExtStateMultipleTabs();