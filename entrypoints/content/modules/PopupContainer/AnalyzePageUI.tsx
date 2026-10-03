import React, { useMemo, useState } from "react";
import { IconColorSwatch, IconTypography, IconRuler, IconBorderRadius, IconShadow, IconLayoutDashboard } from "@tabler/icons-react";
import { Tabs } from "antd";

import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import DesignOverview from "@entrypoints/content/modules/SettingsIconBox/components/DesignOverview.tsx";
import {
  PortalModalHeader,
  HeaderPortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { ANALYZE_PAGE } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { ColorPaletteDefinition } from "../SettingsIconBox/components/ColorPaletteDefinition/ColorPaletteDefinition";
import { BordersTab, ShadowsTab, SpacingTab, TypeTab } from "../SettingsIconBox/components/ColorPaletteDefinition/TokenTabs";
import { PaletteProvider, type PaletteTab } from "../SettingsIconBox/components/ColorPaletteDefinition/PaletteContext";
import { ThemeBar } from "../SettingsIconBox/components/ColorPaletteDefinition/tokenUi/ThemeBar";

export const AnalyzePageUI = () => {
  const [activeTab, setActiveTab] = useState<PaletteTab>("overview");

  // Same pattern as the Automation tabs: every tab shows its icon, only the selected one its name, so all
  // six fit in the narrow panel instead of hiding behind a "more" menu
  const tabLabel = (key: PaletteTab, Icon: React.ComponentType<{ size?: number }>, title: string) => (
    <span className="flex items-center gap-1.5" title={title} aria-label={title}>
      <Icon size={18} />
      {activeTab === key && <span className="font-medium">{title}</span>}
    </span>
  );

  const tabItems = useMemo(
    () => [
      { key: "overview", label: tabLabel("overview", IconLayoutDashboard, "Overview"), children: <DesignOverview /> },
      { key: "color-palette", label: tabLabel("color-palette", IconColorSwatch, "Colors"), children: <ColorPaletteDefinition /> },
      { key: "typography", label: tabLabel("typography", IconTypography, "Type"), children: <TypeTab /> },
      { key: "spacing", label: tabLabel("spacing", IconRuler, "Spacing"), children: <SpacingTab /> },
      { key: "borders", label: tabLabel("borders", IconBorderRadius, "Borders"), children: <BordersTab /> },
      { key: "shadows", label: tabLabel("shadows", IconShadow, "Shadows"), children: <ShadowsTab /> },
    ],
    [activeTab],
  );

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.ANALYZE_PAGE}>
        <FeatureTitle>
          <FeatureIcon icon={ANALYZE_PAGE.icon} isBetta />
          <FeatureTitleText title={ANALYZE_PAGE.title}>{ANALYZE_PAGE.title}</FeatureTitleText>
        </FeatureTitle>
      </PortalModalHeader>

      {/* One page scan and one theme for every tab */}
      <PaletteProvider onOpenTab={setActiveTab}>
        <ThemeBar />
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as PaletteTab)}
          items={tabItems}
          className="analyze-page-tabs"
          size="small"
          tabBarGutter={16}
          // The "more tabs" dropdown would otherwise render into the page's <body>, outside our styles
          getPopupContainer={(trigger) =>
            (trigger.getRootNode() as ShadowRoot).querySelector?.("html > body") as HTMLElement ?? trigger.parentElement!
          }
        />
      </PaletteProvider>
    </div>
  );
};

export default AnalyzePageUI;
