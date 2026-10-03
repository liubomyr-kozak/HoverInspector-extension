import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { IconCopy } from "@tabler/icons-react";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { targetColorStringToHex } from "@entrypoints/content/modules/Popup/helpers.tsx";
import BestColorPicker from "react-best-gradient-color-picker";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { useDebouncedCallback } from "@entrypoints/shared/utils/useDebouncedCallback.ts";
import { addColorToHistory } from "@entrypoints/content/store/app/app.slice.ts";
import { IconHistory } from "@tabler/icons-react";
import {
  ScenarioPortalHeaderButtons as PortalHeaderButtons,
  HeaderPortalId,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { INSPECTOR, PICKER } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

const Container = styled.div`
  position: relative;
`;

const PickerWrapper = styled.div`
  //position: absolute;
  //top: 0;
  //left: 0;

  overflow-x: auto;
`;

const HistoryContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 16px;
`;

const ColorHistoryItem = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${(props) => props.color};
  cursor: pointer;
  border: 1px solid #ccc;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const HistoryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  margin-left: auto;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const CopyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const CurrentSwatch = styled.div<{ color: string }>`
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: ${(props) => props.color};
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-family: Monaco, "SF Mono", Consolas, monospace;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: #f3f4f6;
  }
`;

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`Copied ${value}`, { autoClose: 1500 });
  } catch (e) {
    toast.error("Could not copy to the clipboard");
  }
};

// Only remember a colour once the user stops dragging, not every intermediate value
const HISTORY_COMMIT_DELAY = 700;

const ColorPicker = () => {
  const [color, setColor] = useState("rgba(255,255,255,1)");
  const [showHistory, setShowHistory] = useState(false);
  const dispatch = useDispatch();

  // Get color history from Redux store
  const colorHistory = useSelector((state: any) => state?.app.colorHistory || []);

  const featurePopupPosition = useSelector((state: any) => state?.app.featurePopupPosition);

  const isFirstColor = useRef(true);

  // Add the colour to history after the user settles on it, and keep the history across reloads
  useEffect(() => {
    if (isFirstColor.current) {
      isFirstColor.current = false;
      return;
    }

    const timer = setTimeout(() => dispatch(addColorToHistory(color)), HISTORY_COMMIT_DELAY);
    return () => clearTimeout(timer);
  }, [color, dispatch]);

  const historyLoaded = useRef(false);
  useEffect(() => {
    if (!historyLoaded.current) {
      historyLoaded.current = true;
      return;
    }
    ExtensionStorageManager.changeColorHistory(colorHistory);
  }, [colorHistory]);

  const isGradient = color.includes("gradient");
  const hexValue = isGradient ? "" : targetColorStringToHex(color);

  // Handle selecting a color from history
  const handleSelectHistoryColor = useDebouncedCallback((historyColor: string) => {
    setColor(historyColor);
  }, 120);

  // Toggle history visibility
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <Container>
      {/* Move FeatureTitle to portal header */}
      <PortalHeaderButtons portalId={HeaderPortalId.COLOR_PICKER}>
        <FeatureTitle className="flex items-center">
          <FeatureIcon icon={PICKER.icon} isBetta />
          {PICKER.title}
          <PortalModalHeaderButtons>
            {colorHistory.length > 0 && (
              <HistoryButton onClick={toggleHistory} title="Color History" style={{ position: "relative" }}>
                <IconHistory size={20} color={showHistory ? "#4CAF50" : "#666"} />
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "#4CAF50",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {colorHistory.length}
                </span>
              </HistoryButton>
            )}
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalHeaderButtons>

      {/* Display color history if there are any saved colors and showHistory is true */}
      {colorHistory.length > 0 && showHistory && (
        <>
          <div style={{ marginTop: "8px", marginBottom: "4px", fontSize: "14px" }}>Recently used colors:</div>
          <HistoryContainer>
            {colorHistory.map((historyColor: string, index: number) => (
              <ColorHistoryItem
                key={index}
                color={historyColor}
                onClick={() => handleSelectHistoryColor(historyColor)}
                title={historyColor}
              />
            ))}
          </HistoryContainer>
        </>
      )}

      <CopyRow>
        <CurrentSwatch color={color} />
        {hexValue && (
          <CopyButton onClick={() => copyToClipboard(hexValue)} title="Copy HEX">
            <IconCopy size={14} /> {hexValue}
          </CopyButton>
        )}
        <CopyButton onClick={() => copyToClipboard(color)} title={isGradient ? "Copy CSS gradient" : "Copy RGBA"}>
          <IconCopy size={14} /> {isGradient ? "gradient" : color.replace(/\s+/g, "")}
        </CopyButton>
      </CopyRow>

      <PickerWrapper>
        <BestColorPicker
          value={color}
          onChange={setColor}
          // Without the native EyeDropper the library falls back to screenshotting #root, which most pages don't have
          hideEyeDrop={typeof window === "undefined" || !("EyeDropper" in window)}
          width={Math.max(220, featurePopupPosition.width - 32 /* padding */ - 15 /* scrollbar */)}
          height={200}
        />
      </PickerWrapper>
    </Container>
  );
};

export default ColorPicker;
