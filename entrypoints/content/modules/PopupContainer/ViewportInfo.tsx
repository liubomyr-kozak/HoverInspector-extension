import { breakpoints } from "./ViewportRuler";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button as AntButton, Card as AntCard, Tabs, Tag } from "antd";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import {
  PortalModalHeader,
  HeaderPortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { INSPECTOR, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

const { TabPane } = Tabs;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .ant-tabs-tabpane {
    width: 100%;
    flex-wrap: wrap;
  }

  .ant-card-body {
    padding: 10px !important;
  }
`;

const InfoList = styled.ul`
  font-size: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 0;
  list-style: none;
`;

const Label = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const BreakpointList = styled.ul`
  font-size: 14px;
  list-style: disc inside;
  padding-left: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

type Breakpoint = {
  label: string;
  min: number;
  max?: number;
};

const bootstrapBreakpoints: Breakpoint[] = [
  { label: "xs: <576px", min: 0, max: 575 },
  { label: "sm: ≥576px", min: 576, max: 767 },
  { label: "md: ≥768px", min: 768, max: 1023 },
  { label: "lg: ≥1024px", min: 1024, max: 1199 },
  { label: "xl: ≥1200px", min: 1200, max: 1399 },
  { label: "xxl: ≥1400px", min: 1400 },
];

const materialBreakpoints: Breakpoint[] = [
  { label: "xs: 0–599px", min: 0, max: 599 },
  { label: "sm: 600–899px", min: 600, max: 899 },
  { label: "md: 900–1199px", min: 900, max: 1199 },
  { label: "lg: 1200–1535px", min: 1200, max: 1535 },
  { label: "xl: ≥1536px", min: 1536 },
];

const BreakpointTag = styled(Tag)<{ active: boolean }>`
  margin: 4px;
  font-size: 14px;
  background-color: ${({ active }) => (active ? "#1890ff" : "#f0f0f0")};
  color: ${({ active }) => (active ? "#fff" : "inherit")};
  border: ${({ active }) => (active ? "none" : "1px solid #ccc")};
`;

function getActiveBreakpoint(breakpoints: Breakpoint[], width: number) {
  return breakpoints.find((bp) => width >= bp.min && (bp.max === undefined || width <= bp.max));
}

export default function ViewportInfoPanel() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const updateInfo = () => {
      setInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        screenWidth: screen.width,
        screenHeight: screen.height,
        pixelRatio: window.devicePixelRatio,
        orientation: window.innerWidth > window.innerHeight ? "landscape" : "portrait",
        dpi: window.devicePixelRatio * 96,
        dppx: window.devicePixelRatio,
        dpcm: window.devicePixelRatio * 37.8,
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
        aspectRatio: (window.innerWidth / window.innerHeight).toFixed(2),
      });
    };

    updateInfo();

    window.addEventListener("resize", updateInfo);

    return () => window.removeEventListener("resize", updateInfo);
  }, []);

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeBootstrap = useMemo(() => getActiveBreakpoint(bootstrapBreakpoints, windowWidth), [windowWidth]);
  const activeMaterial = useMemo(() => getActiveBreakpoint(materialBreakpoints, windowWidth), [windowWidth]);

  const applyWidth = (width) => {
    ExtensionStorageManager.changeCurrentWindowSize(width);
  };

  return (
    <Container>
      <PortalModalHeader portalId={HeaderPortalId.VIEWPORT_INFO}>
        <FeatureTitle>
          <FeatureIcon icon={RULER.icon} isBetta />
          <FeatureTitleText title={RULER.title}>{RULER.title}</FeatureTitleText>
        </FeatureTitle>
      </PortalModalHeader>

      <AntCard>
        <InfoList>
          <li>Inner Width: {info.width}px</li>
          <li>Inner Height: {info.height}px</li>
          <li>Screen Width: {info.screenWidth}px</li>
          <li>Screen Height: {info.screenHeight}px</li>
          <li>Pixel Ratio: {info.pixelRatio}</li>
          <li>DPI: {info.dpi}</li>
          <li>DPPX: {info.dppx}</li>
          <li>DPCM: {info.dpcm?.toFixed(2)}</li>
          <li>Root Font Size: {info.rootFontSize}</li>
          <li>Orientation: {info.orientation}</li>
          <li>Aspect Ratio: {info.aspectRatio}</li>
        </InfoList>
      </AntCard>

      <AntCard>
        <Label>Media Query Recommendations</Label>
        <Tabs defaultActiveKey="bootstrap">
          <TabPane tab="Bootstrap" key="bootstrap">
            {bootstrapBreakpoints.map((bp, i) => (
              <BreakpointTag key={i} active={bp.label === activeBootstrap?.label}>
                {bp.label}
              </BreakpointTag>
            ))}
          </TabPane>
          <TabPane tab="Material UI" key="material">
            {materialBreakpoints.map((bp, i) => (
              <BreakpointTag key={i} active={bp.label === activeMaterial?.label}>
                {bp.label}
              </BreakpointTag>
            ))}
          </TabPane>
        </Tabs>
      </AntCard>

      <AntCard>
        <Label>Resize Presets</Label>
        <ButtonGroup>
          {breakpoints.map((bp) => (
            <AntButton key={bp.value} onClick={() => applyWidth(bp.value)} size="small">
              {bp.label}
            </AntButton>
          ))}
        </ButtonGroup>
      </AntCard>
    </Container>
  );
}
