import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
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

const TokenTabFrame: React.FC<{ loading: boolean; onRescan: () => void; children: React.ReactNode }> = ({
  loading,
  onRescan,
  children,
}) => (
  <div>
    <div className="flex justify-end mb-2">
      <button
        className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        onClick={onRescan}
        disabled={loading}
      >
        {loading ? "Scanning..." : "Rescan page"}
      </button>
    </div>
    {loading ? <p className="text-sm text-gray-500">Scanning the page...</p> : children}
  </div>
);

const SpacingTokensPane: React.FC<{ navigateToElement: NavigateToElement }> = ({ navigateToElement }) => {
  const { tokens, rescan } = useLazyTokens(extractSpacingTokens);
  return (
    <TokenTabFrame loading={!tokens} onRescan={rescan}>
      <SpacingTokenTab tokens={tokens || []} navigateToElement={navigateToElement} />
    </TokenTabFrame>
  );
};

const BorderTokensPane: React.FC<{ navigateToElement: NavigateToElement }> = ({ navigateToElement }) => {
  const { tokens, rescan } = useLazyTokens(extractBorderRadiusTokens);
  return (
    <TokenTabFrame loading={!tokens} onRescan={rescan}>
      <BorderTokenTab tokens={tokens || []} navigateToElement={navigateToElement} />
    </TokenTabFrame>
  );
};

const ShadowTokensPane: React.FC<{ navigateToElement: NavigateToElement }> = ({ navigateToElement }) => {
  const { tokens, rescan } = useLazyTokens(extractShadowTokens);
  return (
    <TokenTabFrame loading={!tokens} onRescan={rescan}>
      <ShadowTokenTab tokens={tokens || []} navigateToElement={navigateToElement} />
    </TokenTabFrame>
  );
};

export const AnalyzePageUI = () => {
  const [activeTab, setActiveTab] = useState("color-palette");
  const highlightManager = useHighlightOverlay();

  // Element chips in the token tabs scroll to and highlight their element
  const navigateToElement = useCallback(
    (element: Element) => {
      if (!document.contains(element)) return;
      highlightManager.startHighlight(highlightManager.generateXPath(element));
    },
    [highlightManager],
  );

  const tabItems = useMemo(
    () => [
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
        children: <SpacingTokensPane navigateToElement={navigateToElement} />,
      },
      {
        key: "borders",
        label: (
          <span className="flex items-center gap-2">
            <IconBorderRadius size={18} className="text-orange-500" />
            <span className="font-medium">Border Tokens</span>
          </span>
        ),
        children: <BorderTokensPane navigateToElement={navigateToElement} />,
      },
      {
        key: "shadows",
        label: (
          <span className="flex items-center gap-2">
            <IconShadow size={18} className="text-gray-500" />
            <span className="font-medium">Shadow Tokens</span>
          </span>
        ),
        children: <ShadowTokensPane navigateToElement={navigateToElement} />,
      },
    ],
    [navigateToElement],
  );

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
