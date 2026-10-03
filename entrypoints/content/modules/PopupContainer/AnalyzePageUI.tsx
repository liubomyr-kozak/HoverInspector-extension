import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { IconColorSwatch, IconTypography, IconRuler, IconBorderRadius, IconShadow, IconLayoutDashboard, IconRefresh } from "@tabler/icons-react";
import { Button, Tabs } from "antd";

import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import TypographyRules from "@entrypoints/content/modules/SettingsIconBox/components/TypographyRules.tsx";
import DesignOverview from "@entrypoints/content/modules/SettingsIconBox/components/DesignOverview.tsx";
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

type NavigateToElement = (element: Element) => void;

/**
 * Token tabs scan the page when they are first opened (antd mounts tab panes
 * lazily), not when the content script is injected, and can be rescanned.
 */
const useLazyTokens = <T,>(extract: () => T[]) => {
  const [tokens, setTokens] = useState<T[] | null>(null);
  const scan = useCallback(() => {
    setTokens(null);
    // Let the loading state paint before the synchronous page scan
    setTimeout(() => {
      try {
        setTokens(extract());
      } catch (error) {
        console.error("Failed to extract tokens:", error);
        setTokens([]);
      }
    }, 0);
  }, [extract]);
  useEffect(scan, [scan]);
  return { tokens, rescan: scan };
};

const TokenTabFrame: React.FC<{
  loading: boolean;
  empty: boolean;
  emptyText: string;
  onRescan: () => void;
  children: React.ReactNode;
}> = ({ loading, empty, emptyText, onRescan, children }) => (
  <div>
    <div className="flex justify-end mb-2">
      <Button size="small" icon={<IconRefresh size={14} />} onClick={onRescan} disabled={loading}>
        {loading ? "Scanning..." : "Rescan"}
      </Button>
    </div>
    {loading ? <p className="text-sm text-gray-500">Scanning the page...</p> : children}
    {!loading && empty && <p className="text-sm text-gray-500 mt-3">{emptyText}</p>}
  </div>
);

const SpacingTokensPane: React.FC<{ navigateToElement: NavigateToElement }> = ({ navigateToElement }) => {
  const { tokens, rescan } = useLazyTokens(extractSpacingTokens);
  return (
    <TokenTabFrame loading={!tokens} empty={tokens?.length === 0} emptyText="No margin, padding or gap values found on this page." onRescan={rescan}>
      <SpacingTokenTab tokens={tokens || []} navigateToElement={navigateToElement} />
    </TokenTabFrame>
  );
};

const BorderTokensPane: React.FC<{ navigateToElement: NavigateToElement }> = ({ navigateToElement }) => {
  const { tokens, rescan } = useLazyTokens(extractBorderRadiusTokens);
  return (
    <TokenTabFrame loading={!tokens} empty={tokens?.length === 0} emptyText="No rounded corners found on this page." onRescan={rescan}>
      <BorderTokenTab tokens={tokens || []} navigateToElement={navigateToElement} />
    </TokenTabFrame>
  );
};

const ShadowTokensPane: React.FC<{ navigateToElement: NavigateToElement }> = ({ navigateToElement }) => {
  const { tokens, rescan } = useLazyTokens(extractShadowTokens);
  return (
    <TokenTabFrame loading={!tokens} empty={tokens?.length === 0} emptyText="No box shadows found on this page." onRescan={rescan}>
      <ShadowTokenTab tokens={tokens || []} navigateToElement={navigateToElement} />
    </TokenTabFrame>
  );
};

export const AnalyzePageUI = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const highlightManager = useHighlightOverlay();

  // Element chips in the token tabs scroll to and highlight their element
  const navigateToElement = useCallback(
    (element: Element) => {
      if (!document.contains(element)) return;
      highlightManager.startHighlight(highlightManager.generateXPath(element));
    },
    [highlightManager],
  );

  // Same pattern as the Automation tabs: every tab shows its icon, only the selected one its name, so all
  // six fit in the narrow panel instead of hiding behind a "more" menu
  const tabLabel = (key: string, Icon: React.ComponentType<{ size?: number }>, title: string) => (
    <span className="flex items-center gap-1.5" title={title} aria-label={title}>
      <Icon size={18} />
      {activeTab === key && <span className="font-medium">{title}</span>}
    </span>
  );

  const tabItems = useMemo(
    () => [
      { key: "overview", label: tabLabel("overview", IconLayoutDashboard, "Overview"), children: <DesignOverview /> },
      { key: "color-palette", label: tabLabel("color-palette", IconColorSwatch, "Colors"), children: <ColorPaletteDefinition /> },
      { key: "typography", label: tabLabel("typography", IconTypography, "Type"), children: <TypographyRules /> },
      {
        key: "spacing",
        label: tabLabel("spacing", IconRuler, "Spacing"),
        children: <SpacingTokensPane navigateToElement={navigateToElement} />,
      },
      {
        key: "borders",
        label: tabLabel("borders", IconBorderRadius, "Radii"),
        children: <BorderTokensPane navigateToElement={navigateToElement} />,
      },
      {
        key: "shadows",
        label: tabLabel("shadows", IconShadow, "Shadows"),
        children: <ShadowTokensPane navigateToElement={navigateToElement} />,
      },
    ],
    [navigateToElement, activeTab],
  );

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.ANALYZE_PAGE}>
        <FeatureTitle>
          <FeatureIcon icon={ANALYZE_PAGE.icon} isBetta />
          <FeatureTitleText title={ANALYZE_PAGE.title}>{ANALYZE_PAGE.title}</FeatureTitleText>
        </FeatureTitle>
      </PortalModalHeader>

      <div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="analyze-page-tabs"
          size="small"
          tabBarGutter={16}
          // The "more tabs" dropdown would otherwise render into the page's <body>, outside our styles
          getPopupContainer={(trigger) =>
            (trigger.getRootNode() as ShadowRoot).querySelector?.("html > body") as HTMLElement ?? trigger.parentElement!
          }
        />
      </div>
    </div>
  );
};

export default AnalyzePageUI;
