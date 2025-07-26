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