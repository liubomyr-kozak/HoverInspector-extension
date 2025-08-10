import React, { useState } from "react";
import { IconBrush, IconColorSwatch, IconTypography } from "@tabler/icons-react";
import { Tabs } from "antd";

import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import { BetaBadge } from "@entrypoints/shared/components/BetaBadge.tsx";
import TypographyRules from "@entrypoints/content/modules/SettingsIconBox/components/TypographyRules.tsx";
import { ColorPaletteDefinition } from "@entrypoints/content/modules/SettingsIconBox/components/ColorPaletteDefinition.tsx";

// Define the tab items
const tabItems = [
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
  const [activeTab, setActiveTab] = useState("color-palette");

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <IconBrush size={20} className="text-blue-600" />
        <FeatureTitle className="text-xl font-semibold text-gray-800 m-0">
          Analyze Page UI <BetaBadge>Beta</BetaBadge>
        </FeatureTitle>
      </div>
      <div className="py-4">
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
