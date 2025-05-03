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

export class ExtStateMultipleTabs {
    private stateMap: Map<number, { alive: boolean }> = new Map();

    set(tabId: number) {
        this.stateMap.set(tabId, {alive: true});
    }

    clear(tabId: number) {
        this.stateMap.delete(tabId);
    }

    isActive(tabId: number) {
        const state = this.stateMap.get(tabId);
        return !!state?.alive;
    }

    clearAll() {
        this.stateMap.clear();
    }

    getAllActiveTabs(): number[] {
        return Array.from(this.stateMap.entries())
            .filter(([_, value]) => value.alive)
            .map(([tabId]) => tabId);
    }
}

export const state = new ExtStateMultipleTabs();