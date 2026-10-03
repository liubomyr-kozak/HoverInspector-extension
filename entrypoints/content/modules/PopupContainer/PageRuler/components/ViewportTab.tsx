import React from "react";
import { Card } from "antd";
import { CopyButton } from "@entrypoints/shared/components/CopyButton";
import { useMediaFeatures } from "../hooks/useViewportInfo";
import { describeAspectRatio, formatPx, viewportReport } from "../utils/viewport";
import { Code, Hint, InfoList, SectionTitle } from "../PageRuler.styled";
import type { ViewportInfo } from "../types";

interface ViewportTabProps {
  info: ViewportInfo;
}

const size = (width: number, height: number) => `${width} × ${height}px`;

/** Media queries in em are measured against the browser's initial font size (16px), not the page's root */
const MEDIA_QUERY_EM = 16;

export const ViewportTab: React.FC<ViewportTabProps> = ({ info }) => {
  const features = useMediaFeatures();

  const rows: Array<[label: string, value: string, hint?: string]> = [
    ["Viewport", size(info.innerWidth, info.innerHeight), "window.innerWidth × innerHeight: what media queries use"],
    ["Without scrollbars", size(info.clientWidth, info.clientHeight), "documentElement.clientWidth: room for content"],
    ["Scrollbar", formatPx(info.scrollbarWidth), "0 for overlay scrollbars (macOS, phones)"],
    ["Document", size(info.documentWidth, info.documentHeight)],
    ["Screen", size(info.screenWidth, info.screenHeight)],
    ["Available screen", size(info.availWidth, info.availHeight), "Screen minus taskbar or Dock"],
    ["Device pixel ratio", `${Number(info.devicePixelRatio.toFixed(3))}`, "Physical pixels per CSS px; also changes with browser zoom"],
    ["Physical viewport", size(Math.round(info.innerWidth * info.devicePixelRatio), Math.round(info.innerHeight * info.devicePixelRatio))],
    ["Resolution", `${Math.round(info.devicePixelRatio * 96)}dpi`, "CSS resolution media query value"],
    ["Root font size", formatPx(info.rootFontSize), "Size of 1 rem on this page"],
    ["Width in em", `${Number((info.innerWidth / MEDIA_QUERY_EM).toFixed(2))}em`, "For min-width media queries written in em"],
    ["Orientation", info.orientation],
    ["Aspect ratio", describeAspectRatio(info.innerWidth, info.innerHeight)],
    ["Colour depth", `${info.colorDepth}-bit`],
  ];
  if (info.pinchZoom !== 1) rows.push(["Pinch zoom", `${info.pinchZoom.toFixed(2)}×`]);

  return (
    <div className="flex flex-col gap-2.5">
      <Card size="small">
        <SectionTitle>
          <span>Viewport</span>
          <CopyButton
            value={viewportReport(info, features, navigator.userAgent)}
            title="Copy every value as text, for a bug report"
          >
            Copy report
          </CopyButton>
        </SectionTitle>
        <InfoList>
          {rows.map(([label, value, hint]) => (
            <div key={label} title={hint}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </InfoList>
      </Card>

      <Card size="small">
        <SectionTitle>Media features</SectionTitle>
        <Hint className="mb-2">What this browser reports to @media queries right now.</Hint>
        <InfoList>
          {features.map(({ feature, value }) => (
            <div key={feature}>
              <dt>
                <Code>{feature}</Code>
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </InfoList>
      </Card>
    </div>
  );
};
