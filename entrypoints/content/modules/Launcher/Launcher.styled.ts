import styled, { css } from "styled-components";
import { ZINDEX_LAUNCHER_CONTAINER } from "@entrypoints/shared/constant/zIndex.ts";
import { LogoContainer } from "@entrypoints/shared/components/Logo/Logo.tsx";

export const LauncherContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  display: flex;
  align-items: center;
  z-index: ${ZINDEX_LAUNCHER_CONTAINER};
  transform: translateX(-50%);
  /* On narrow windows the toolbar wraps instead of running off both edges (and hiding the menu) */
  width: max-content;
  max-width: calc(100vw - 16px);

  @media (max-width: 560px) {
    bottom: 8px;
  }
`;

export const LauncherBody = styled.div`
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  padding: 10px 20px;
  border-radius: 16px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  row-gap: 14px;
  color: #333;

  @media (max-width: 560px) {
    padding: 8px 10px;

    /* Keep the logo, drop its label to leave room for the tools */
    ${LogoContainer} {
      font-size: 0;
      gap: 0;
      margin-right: 6px;
    }
  }

  &::before {
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    backdrop-filter: blur(12px);
    position: absolute;
    border-radius: 16px;
    z-index: -1;
  }
`;

export const LauncherMiniModal = styled.div`
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  color: #333;
  margin-left: 15px;
  cursor: pointer;

  &::before {
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    backdrop-filter: blur(12px);
    position: absolute;
    border-radius: 16px;
    z-index: -1;
  }
`;

export const IconButton = styled.button<{ $active?: boolean }>`
  background: transparent;
  border: none;
  cursor: pointer;
  margin: 0 6px;
  display: flex;
  align-items: center;

  padding: 0;
  justify-content: center;
  transition: background 0.2s ease;
  border-radius: 2px;

  position: relative;

  ${({ $active }) =>
    $active &&
    css`
      &::after {
        content: "";
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        height: 3px;
        background-color: #007bff;
        border-radius: 1px;
      }
    `}
  &:hover {
    background: #1874d214;
    transform: scale(1.1);
  }
`;

export const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: bold;
  color: #888;
  margin: 0 0 6px;
  padding: 0 4px;
  text-transform: uppercase;
`;

export const Divider = styled.div`
  height: 1px;
  background: #eee;
  margin: 8px 0;
`;

export const MenuContainer = styled.div`
  max-width: calc(100vw - 32px);
  padding: 8px;
  background: #fff;
  border-radius: 8px;
`;

export const MenuItem = styled.div`
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
  user-select: none;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

export const MenuItemText = styled.div`
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 14px;
  user-select: none;
`;

export const MenuWrapper = styled.div`
  display: flex;
  max-height: min(600px, calc(100vh - 120px));
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`;

export const LeftColumn = styled.div`
  flex: 1;
  //padding: 16px;
  //border-right: 1px solid #eee;
`;

export const RightColumn = styled.div`
  padding: 12px 0;
  //background: #fafafa;
`;

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;