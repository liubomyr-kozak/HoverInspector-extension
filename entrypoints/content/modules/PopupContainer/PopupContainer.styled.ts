import styled from "styled-components";
import { isDevelopment } from "@entrypoints/shared/helpers.ts";

export const PopupWrapper = styled.div<{ $x: number; $y: number }>`
  top: ${({ $y }) => $y}px;
  left: ${({ $x }) => $x}px;
  width: auto;
  max-height: 100vh;
  max-width: 100vw;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: auto;
`;

export const Header = styled.div`
  padding: 8px;
  background: #f0f0f0;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Icon = styled.div`
  width: 24px;
  height: 24px;
  background: url(/icon.svg) no-repeat center center;
  background-size: contain;
`;

export const Title = styled.div`
  flex-grow: 1;
  text-align: center;
  font-weight: bold;
`;

export const MinifyButton = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
`;

export const FeatureTitle = styled.div.attrs({ className: "hi-feature-title" })`
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.02em;
  /* #888 was 3.5:1 on white; gray-500 meets AA */
  color: #6b7280;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
`;

// Single-line tool name in the panel header; long names end in an ellipsis
// instead of pushing the header to three lines
export const FeatureTitleText = styled.span.attrs({ className: "hi-feature-title-text" })`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FeatureContainer = styled.div.attrs({
  id: isDevelopment() ? "hover-inspector-feature-container" : "",
})`
  display: flex;
  align-items: flex-start;
  gap: 35px;
  flex-direction: column;
  height: 100%;
`;

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 16px;
  container-type: inline-size;
  container-name: hi-panel-header;

  /*
   * In a narrow panel a tool with three or more header actions has room for only two or three letters of
   * its name ("CS…"). Show just the tool icon then (its name is in the toolbar button's tooltip).
   */
  @container hi-panel-header (max-width: 300px) {
    .hi-feature-title:has(.hi-header-buttons > :nth-child(3), .hi-header-buttons > * > :nth-child(3))
      .hi-feature-title-text {
      display: none;
    }
  }
`;

// Footer row for the tool buttons (Save, Cancel, Compare...) that tools portal in
export const FooterContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;

  &:empty {
    display: none;
  }
`;

export const HeaderButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
`;

export const MinimizeButton = styled.button<{ isMinimized?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${(props) => (props.isMinimized ? "rgba(34, 197, 94, 0.1)" : "rgba(156, 163, 175, 0.1)")};
  border: 1px solid ${(props) => (props.isMinimized ? "#22c55e" : "#9ca3af")};
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => (props.isMinimized ? "#16a34a" : "#6b7280")};
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.isMinimized ? "rgba(34, 197, 94, 0.2)" : "rgba(156, 163, 175, 0.2)")};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
