import { breakpoints, describeResizeMiss, resizeViewportTo } from "./ViewportRuler";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button as AntButton, Card as AntCard, Tabs, Tag } from "antd";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import {
  PortalModalHeader,
  HeaderPortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { INSPECTOR, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

import { tokens } from "@entrypoints/shared/styles/tokens";

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

// Label above value, two columns: stays readable down to the 320px panel
const InfoList = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin: 0;

  div {
    min-width: 0;
  }
  dt {
    font-size: 12px;
    color: ${tokens.color.textMuted};
  }
  dd {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: ${tokens.color.text};
    font-variant-numeric: tabular-nums;
  }
`;

// Section heading, same size as the other tools' section headings
const Label = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${tokens.color.text};
  margin: 0 0 8px;
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

const ResizeNote = styled.div`
  margin: -4px 0 10px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #874d00;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
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

const BreakpointTag = styled(Tag)<{ $active: boolean }>`
  margin: 0;
  font-size: 12px;
  line-height: 22px;
  font-variant-numeric: tabular-nums;
  background-color: ${({ $active }) => ($active ? tokens.color.primary : tokens.color.surfaceMuted)};
  color: ${({ $active }) => ($active ? "#fff" : tokens.color.text)};
  border: 1px solid ${({ $active }) => ($active ? tokens.color.primary : tokens.color.borderStrong)};
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const INFO_ROWS: [label: string, value: (info: any) => React.ReactNode][] = [
  ["Inner width", (i) => `${i.width}px`],
  ["Inner height", (i) => `${i.height}px`],
  ["Screen width", (i) => `${i.screenWidth}px`],
  ["Screen height", (i) => `${i.screenHeight}px`],
  ["Pixel ratio", (i) => i.pixelRatio],
  ["DPI", (i) => i.dpi],
  ["DPPX", (i) => i.dppx],
  ["DPCM", (i) => i.dpcm?.toFixed(2)],
  ["Root font size", (i) => i.rootFontSize],
  ["Orientation", (i) => i.orientation],
  ["Aspect ratio", (i) => i.aspectRatio],
];

// The ruler at the top of the page shows these labels with device emoji; the panel's buttons don't need them
const presetLabel = (label: string) => label.replace(/^[^\p{L}]+/u, "");

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

  const [resizeMiss, setResizeMiss] = useState("");
  const [pendingWidth, setPendingWidth] = useState<number | null>(null);

  const applyWidth = async (width: number) => {
    setPendingWidth(width);
    setResizeMiss("");
    try {
      const actual = await resizeViewportTo(width);
      setResizeMiss(describeResizeMiss(width, actual));
    } catch (e) {
      setResizeMiss("The window could not be resized.");
    } finally {
      setPendingWidth(null);
    }
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
          {INFO_ROWS.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value(info)}</dd>
            </div>
          ))}
        </InfoList>
      </AntCard>

      <AntCard>
        <Label>Framework breakpoints</Label>
        <Tabs
          defaultActiveKey="bootstrap"
          size="small"
          items={[
            { key: "bootstrap", label: "Bootstrap", list: bootstrapBreakpoints, active: activeBootstrap },
            { key: "material", label: "Material UI", list: materialBreakpoints, active: activeMaterial },
          ].map(({ key, label, list, active }) => ({
            key,
            label,
            children: (
              <TagList>
                {list.map((bp) => (
                  <BreakpointTag key={bp.label} $active={bp.label === active?.label}>
                    {bp.label}
                  </BreakpointTag>
                ))}
              </TagList>
            ),
          }))}
        />
      </AntCard>

      <AntCard>
        <Label>Resize window</Label>
        {resizeMiss && <ResizeNote>{resizeMiss}</ResizeNote>}
        <ButtonGroup>
          {breakpoints.map((bp) => (
            <AntButton
              key={bp.value}
              onClick={() => applyWidth(bp.value)}
              size="small"
              type={windowWidth === bp.value ? "primary" : "default"}
              loading={pendingWidth === bp.value}
            >
              {presetLabel(bp.label)}
            </AntButton>
          ))}
        </ButtonGroup>
      </AntCard>
    </Container>
  );
}
