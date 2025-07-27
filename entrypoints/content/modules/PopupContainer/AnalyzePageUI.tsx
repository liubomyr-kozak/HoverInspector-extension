import React, { useState } from "react";
import { IconBrush, IconColorSwatch, IconLayoutDashboard, IconTypography } from "@tabler/icons-react";
import { Tabs } from "antd";

import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import { BetaBadge } from "@entrypoints/shared/components/BetaBadge.tsx";
import ColorAnalysis from "../SettingsIconBox/components/ColorAnalysis";
import TypographyRules from "@entrypoints/content/modules/SettingsIconBox/components/TypographyRules.tsx";
import ColorPaletteDefinition from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition.tsx";

// Define the tab items
const tabItems = [
  {
    key: "all-styles",
    label: (
      <span className="flex items-center gap-2">
        <IconLayoutDashboard size={18} className="text-blue-500" />
        <span className="font-medium">All Styles</span>
      </span>
    ),
    children: <ColorAnalysis />,
  },
  {
    key: "color-palette",
    label: (
      <span className="flex items-center gap-2">
        <IconColorSwatch size={18} className="text-purple-500" />
        <span className="font-medium">Color Palette</span>
      </span>
    ),
    children: <ColorPaletteDefinition />,
  },
  {
    key: "typography",
    label: (
      <span className="flex items-center gap-2">
        <IconTypography size={18} className="text-green-600" />
        <span className="font-medium">Typography Rules</span>
      </span>
    ),
    children: <TypographyRules />,
  },
];

export const AnalyzePageUI = () => {
  const [activeTab, setActiveTab] = useState("all-styles");

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <IconBrush size={20} className="text-blue-600" />
          <FeatureTitle className="text-xl font-semibold text-gray-800 m-0">
            Analyze Page UI <BetaBadge>Beta</BetaBadge>
          </FeatureTitle>
        </div>
        <p className="text-sm text-gray-600 mt-1 ml-7">Analyze and improve your page design based on best practices</p>
      </div>
      <div className="p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="analyze-page-tabs"
          size="large"
          tabBarGutter={24}
        />
      </div>
    </div>
  );
};

export default AnalyzePageUI;