import React, { useState } from "react";
import { Tabs } from "antd";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import {
  PortalModalHeader,
  HeaderPortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { useViewportInfo } from "./PageRuler/hooks/useViewportInfo";
import { ViewportTab } from "./PageRuler/components/ViewportTab";
import { BreakpointsTab } from "./PageRuler/components/BreakpointsTab";
import { ChecksTab } from "./PageRuler/components/ChecksTab";
import { ReferenceTab } from "./PageRuler/components/ReferenceTab";
import { PageRulerTab } from "./PageRuler/types";

export default function ViewportInfoPanel() {
  const info = useViewportInfo();
  const [tab, setTab] = useState<PageRulerTab>(PageRulerTab.Viewport);

  return (
    <div className="flex flex-col min-w-0">
      <PortalModalHeader portalId={HeaderPortalId.VIEWPORT_INFO}>
        <FeatureTitle>
          <FeatureIcon icon={RULER.icon} isBetta />
          <FeatureTitleText title={RULER.title}>{RULER.title}</FeatureTitleText>
        </FeatureTitle>
      </PortalModalHeader>

      <Tabs
        size="small"
        tabBarGutter={14}
        activeKey={tab}
        onChange={(key) => setTab(key as PageRulerTab)}
        // antd renders a tab the first time it opens, so the page checks don't scan until someone asks
        items={[
          { key: PageRulerTab.Viewport, label: "Viewport", children: <ViewportTab info={info} /> },
          { key: PageRulerTab.Breakpoints, label: "Breakpoints", children: <BreakpointsTab width={info.innerWidth} /> },
          { key: PageRulerTab.Checks, label: "Checks", children: <ChecksTab width={info.clientWidth} /> },
          { key: PageRulerTab.Reference, label: "Guide", children: <ReferenceTab info={info} /> },
        ]}
      />
    </div>
  );
}
