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

export const BecomeASponsor = styled.a`
  background: #f9f9f9;
  border: 1px solid #ddd;
  display: block;
  border-radius: 8px;
  text-align: center;
  font-family: sans-serif;
  text-decoration: none;
  cursor: pointer;
  //mask: linear-gradient(to top, #000 1%, 0%, #0000 8%, 0%, #000 10%, 0%, #0000 16%, 0%, #000 19%, 0%, #0000 24%, 0%, #000 28%, 0%, #0000 32%, 0%, #000 37%, 0%, #0000 40%, 0%, #000 46%, 0%, #0000 48%, 0%, #000 55%, 0%, #0000 56%, 0%, #000 57%);
  padding: 16px;
  inline-size: 5rem;
  aspect-ratio: 1;
  justify-self: center;
  width: 100%;
  height: 75px;
  position: relative;
  overflow: hidden;
  color: #333;
  transition: all 0.3s ease;
  flex-shrink: 0;
  .hover-effect {
    display: none;
  }

  &:hover {
    background: transparent;
    border-color: #ccc;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);

    .hover-effect {
      display: block;
    }

    color: #fff;
  }

  &:active,
  &:focus {
    outline: 2px solid #999;
    outline-offset: 2px;
  }
`;

export const BecomeASponsorText = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;

  h3 {
    margin: 0;
    font-size: 17px;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }

  p {
    margin: 0;
    font-size: 15px;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }
`;

export const HideButton = styled.button`
  background: linear-gradient(to right, #9d4edd, #7b2cbf);
  border: 1px solid #c77dff;
  border-radius: 8px;
  padding: 1px 7px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
  align-self: center;
  z-index: 1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);

  &:hover {
    background: linear-gradient(to right, #c77dff, #9d4edd);
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }

  &:active {
    background: linear-gradient(to right, #7b2cbf, #5a189a);
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

export const FeatureTitle = styled.div`
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.02em;
  color: #888;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
`;

// Single-line tool name in the panel header; long names end in an ellipsis
// instead of pushing the header to three lines
export const FeatureTitleText = styled.span`
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
`;

export const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
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
