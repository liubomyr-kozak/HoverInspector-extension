import { useEffect, useState } from "react";
import { getFrameClipRect, getFrameScale, getRectInTopViewport, PlainRect } from "@entrypoints/shared/utils/frames";
import { isRemoteFrameNode } from "@entrypoints/shared/frameAgent/remoteNode";
import { buildStyleSummary, styleRulesList } from "./nodeStyle";

export { normalizeBorder, normalizePaddingMargin } from "./nodeStyle";


class DomNodeManager {
    nodes = {};
    subscribers: Record<string, Set<(node: Element | null) => void>> = {};
    isFirstNodeSelected = false;

    subscribe = (key: string, callback: (node: Element | null) => void) => {
        if (!this.subscribers[key]) {
            this.subscribers[key] = new Set();
        }
        this.subscribers[key].add(callback);

        // одразу викликаємо callback з поточним значенням
        callback(this.nodes[key] || null);

        return () => {
            this.subscribers[key].delete(callback);
            if (this.subscribers[key].size === 0) {
                delete this.subscribers[key];
            }
        };
    };

    private notify = (key: string, node: Element | null) => {
        if (this.subscribers[key]) {
            for (const cb of this.subscribers[key]) {
                cb(node);
            }
        }
    };

    update = (nodes) => {
        Object
            .keys(nodes)
            .map((key) => {
                this.nodes[key] = nodes[key];
                this.notify(key, nodes[key]);
            })
    }

    get = (key) => {
        return this.nodes[key];
    }

    remove = (key) => {
        delete this.nodes[key];
        this.notify(key, null);
    }

    getBoundingClientRec(value) {
        const nodeEl = typeof value === 'string' ? this.get(value) : value;
        if (!nodeEl) return nodeEl;

        // In the top viewport, also for elements inside iframes (cross-origin ones report through an agent)
        return isRemoteFrameNode(nodeEl) ? nodeEl.getBoundingClientRect() : getRectInTopViewport(nodeEl);
    }

    /**
     * Where overlays for the node may be drawn, in the top viewport: the visible part of the iframes
     * it is in. Null for elements of the top document (no clipping).
     */
    getOverlayClipRect(value): PlainRect | null {
        const nodeEl = typeof value === 'string' ? this.get(value) : value;
        if (!nodeEl) return null;
        return isRemoteFrameNode(nodeEl) ? nodeEl.getClipRect() : getFrameClipRect(nodeEl);
    }

    /** CSS px of the node -> px of the top viewport (CSS zoom, scaled iframes) */
    getOverlayScale(value): number {
        const nodeEl = typeof value === 'string' ? this.get(value) : value;
        if (!nodeEl) return 1;
        if (isRemoteFrameNode(nodeEl)) return nodeEl.getScale();
        const zoom = nodeEl.currentCSSZoom;
        return (typeof zoom === "number" && zoom > 0 ? zoom : 1) * getFrameScale(nodeEl);
    }

    getStyleByNode = (value, styleRules = styleRulesList) => {
        const nodeEl = typeof value === 'string' ? this.get(value) : value;
        if (!nodeEl) return {}

        if (isRemoteFrameNode(nodeEl)) return nodeEl.getStyleSummary();

        // One computed style object per call instead of one per property
        const computed = window.getComputedStyle(nodeEl);
        const rect = nodeEl.getBoundingClientRect();
        const className = nodeEl.className && typeof nodeEl.className === "string" ? nodeEl.className : '';

        return buildStyleSummary(
            (ruleName) => computed.getPropertyValue(ruleName),
            rect,
            { className, id: nodeEl.id || '', tag: nodeEl.localName },
            styleRules,
        );
    };

    setIsFirstNodeSelected(value) {
        this.isFirstNodeSelected = value;
    }
}


const DomNodeManagerInstance = new DomNodeManager()

export default DomNodeManagerInstance;


export const useDomNodeObserver = (key: string): Element | null => {
    const [element, setElement] = useState<Element | null>(null);

    useEffect(() => {
        const unsubscribe = DomNodeManagerInstance.subscribe(key, (node) => {
            setElement(node);
        });

        return () => {
            unsubscribe?.();
        };
    }, [key]);

    return element;
};