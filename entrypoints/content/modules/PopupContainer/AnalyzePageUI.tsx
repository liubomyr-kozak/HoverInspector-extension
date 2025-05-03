import React, { useState } from "react";
import { IconList, IconPalette, IconFileDescription, IconTypography } from "@tabler/icons-react";
import { Tabs } from "antd";

import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import { BetaBadge } from "@entrypoints/shared/components/BetaBadge.tsx";
import ColorAnalysis from "../SettingsIconBox/components/ColorAnalysis";
import TypographyRules from "@entrypoints/content/modules/SettingsIconBox/components/TypographyRules.tsx";
import GuidelinesViewer from "@entrypoints/content/modules/SettingsIconBox/components/GuidelinesViewer.tsx";
import ColorPaletteDefinition from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition.tsx";

// Define the tab items
const tabItems = [
    {
        key: 'all-styles',
        label: (
            <span className="flex items-center gap-1">
                <IconList size={16} />
                All Styles
            </span>
        ),
        children: <ColorAnalysis />
    },
    {
        key: 'color-palette',
        label: (
            <span className="flex items-center gap-1">
                <IconPalette size={16} />
                Color Palette
            </span>
        ),
        children: <ColorPaletteDefinition />
    },
    {
        key: 'typography',
        label: (
            <span className="flex items-center gap-1">
                <IconTypography size={16} />
                Typography Rules
            </span>
        ),
        children: <TypographyRules />
    },
    {
        key: 'guidelines',
        label: (
            <span className="flex items-center gap-1">
                <IconFileDescription size={16} />
                Guidelines
            </span>
        ),
        children: <GuidelinesViewer onElementSelect={(element) => {
            // Highlight the selected element
            if (element instanceof HTMLElement) {
                const originalOutline = element.style.outline;
                const originalTransition = element.style.transition;
                const originalBoxShadow = element.style.boxShadow;

                element.style.outline = "2px solid #f29d68";
                element.style.outlineOffset = "2px";
                element.style.transition = "all 0.25s ease-in-out";
                element.style.boxShadow = "0 0 8px 2px rgba(242, 157, 104, 0.8)";

                // Scroll the element into view
                element.scrollIntoView({ behavior: "smooth", block: "center" });

                // Reset styles after a delay
                setTimeout(() => {
                    element.style.outline = originalOutline;
                    element.style.transition = originalTransition;
                    element.style.boxShadow = originalBoxShadow;
                }, 2000);
            }
        }} />
    }
];

export const AnalyzePageUI = () => {
    const [activeTab, setActiveTab] = useState('all-styles');

    return (
        <div className="w-full">
            <FeatureTitle>Analyze Page UI <BetaBadge>Beta</BetaBadge></FeatureTitle>
            <div className="mb-4">
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab} 
                    items={tabItems}
                    className="analyze-page-tabs"
                />
            </div>
        </div>
    );
}

export default AnalyzePageUI;