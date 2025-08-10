import React, { useState } from "react";
import { IconColorSwatch, IconTypography, IconRuler, IconBorderRadius, IconShadow } from "@tabler/icons-react";
import { Tabs } from "antd";

import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import TypographyRules from "@entrypoints/content/modules/SettingsIconBox/components/TypographyRules.tsx";
import {
  PortalModalHeader,
  HeaderPortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { ANALYZE_PAGE } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { ColorPaletteDefinition } from "../SettingsIconBox/components/ColorPaletteDefinition/ColorPaletteDefinition";
import { SpacingTokenTab } from "../SettingsIconBox/components/ColorPaletteDefinition/SpacingTokenTab";
import { BorderTokenTab } from "../SettingsIconBox/components/ColorPaletteDefinition/BorderTokenTab";
import { ShadowTokenTab } from "../SettingsIconBox/components/ColorPaletteDefinition/ShadowTokenTab";
import {
  extractSpacingTokens,
  extractBorderRadiusTokens,
  extractShadowTokens 
} from "../SettingsIconBox/components/ColorPaletteDefinition/utils/tokenExtraction";

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
  {
    key: "spacing",
    label: (
      <span className="flex items-center gap-2">
        <IconRuler size={18} className="text-blue-500" />
        <span className="font-medium">Spacing Tokens</span>
      </span>
    ),
    children: <SpacingTokenTab tokens={extractSpacingTokens()} />,
  },
  {
    key: "borders",
    label: (
      <span className="flex items-center gap-2">
        <IconBorderRadius size={18} className="text-orange-500" />
        <span className="font-medium">Border Tokens</span>
      </span>
    ),
    children: <BorderTokenTab tokens={extractBorderRadiusTokens()} />,
  },
  {
    key: "shadows",
    label: (
      <span className="flex items-center gap-2">
        <IconShadow size={18} className="text-gray-500" />
        <span className="font-medium">Shadow Tokens</span>
      </span>
    ),
    children: <ShadowTokenTab tokens={extractShadowTokens()} />,
  },
];

export const AnalyzePageUI = () => {
  const [activeTab, setActiveTab] = useState("color-palette");

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.ANALYZE_PAGE}>
        <FeatureTitle>
          <FeatureIcon icon={ANALYZE_PAGE.icon} isBetta />
          {ANALYZE_PAGE.title}
        </FeatureTitle>
      </PortalModalHeader>

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
