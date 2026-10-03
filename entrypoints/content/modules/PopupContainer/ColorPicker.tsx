import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { IconCopy } from "@tabler/icons-react";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";
import { targetColorStringToHex } from "@entrypoints/content/modules/Popup/helpers.tsx";
import BestColorPicker from "react-best-gradient-color-picker";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
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
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { colorPickerStyles, useColorPickerA11y } from "./colorPickerA11y";

const Container = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`;

const PickerWrapper = styled.div`
  overflow-x: auto;
  /* Room for the focus ring of the edge controls, which the scroll container would otherwise clip */
  padding: 3px;
  margin: -3px;

  /* The library sets \`outline: none\` inline on its inputs and tool buttons. Keyboard navigation only */
  :host([data-hi-keyboard]) & input[id^="rbgcp-"]:focus-visible,
  :host([data-hi-keyboard]) & [id^="rbgcp-"][role="button"]:focus-visible {
    outline: 2px solid ${tokens.color.focusRing} !important;
    outline-offset: 1px;
  }
`;

const HistoryContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 16px;
`;

const ColorHistoryItem = styled.button<{ $color: string }>`
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
  background-color: ${(props) => props.$color};
  cursor: pointer;
  border: 1px solid #d1d5db;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const HistoryCount = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background: ${tokens.color.primary};
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
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
  min-width: 0;
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
  flex: 0 1 auto;

  svg {
    flex-shrink: 0;
  }

  /* The rgba() value is long; in a narrow panel it ends in an ellipsis instead of leaving the panel */
  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

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

  // The picker takes a fixed pixel width: follow the panel's real content width (also while it is being
  // resized), so it never overflows a narrow panel
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const pickerWidth = containerWidth
    ? Math.max(200, containerWidth)
    : Math.max(220, featurePopupPosition.width - 32 /* padding */ - 15 /* scrollbar */);

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
  const pickerRef = useRef<HTMLDivElement>(null);
  useColorPickerA11y(pickerRef, isGradient);
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
    <Container ref={containerRef}>
      {/* Move FeatureTitle to portal header */}
      <PortalHeaderButtons portalId={HeaderPortalId.COLOR_PICKER}>
        <FeatureTitle className="flex items-center">
          <FeatureIcon icon={PICKER.icon} isBetta />
          <FeatureTitleText title={PICKER.title}>{PICKER.title}</FeatureTitleText>
          <PortalModalHeaderButtons>
            {colorHistory.length > 0 && (
              <IconButton
                label={showHistory ? "Hide recent colors" : "Show recent colors"}
                active={showHistory}
                onClick={toggleHistory}
                style={{ position: "relative" }}
              >
                <IconHistory size={18} />
                <HistoryCount aria-hidden>{colorHistory.length}</HistoryCount>
              </IconButton>
            )}
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalHeaderButtons>

      {/* Display color history if there are any saved colors and showHistory is true */}
      {colorHistory.length > 0 && showHistory && (
        <>
          <h3 className="m-0 mt-1 text-sm font-semibold text-gray-800">Recent colors</h3>
          <HistoryContainer>
            {colorHistory.map((historyColor: string, index: number) => (
              <ColorHistoryItem
                key={index}
                type="button"
                $color={historyColor}
                onClick={() => handleSelectHistoryColor(historyColor)}
                title={historyColor}
                aria-label={`Use ${historyColor}`}
              />
            ))}
          </HistoryContainer>
        </>
      )}

      <CopyRow>
        <CurrentSwatch color={color} />
        {hexValue && (
          // The short HEX value never truncates; the long rgba() one shrinks first
          <CopyButton
            style={{ flexShrink: 0 }}
            onClick={() => copyToClipboard(hexValue)}
            title="Copy HEX"
            aria-label={`Copy ${hexValue}`}
          >
            <IconCopy size={14} /> <span>{hexValue}</span>
          </CopyButton>
        )}
        <CopyButton onClick={() => copyToClipboard(color)} title={isGradient ? "Copy CSS gradient" : "Copy RGBA"}>
          <IconCopy size={14} /> <span>{isGradient ? "gradient" : color.replace(/\s+/g, "")}</span>
        </CopyButton>
      </CopyRow>

      <PickerWrapper ref={pickerRef}>
        <BestColorPicker
          value={color}
          onChange={setColor}
          // Without the native EyeDropper the library falls back to screenshotting #root, which most pages don't have
          hideEyeDrop={typeof window === "undefined" || !("EyeDropper" in window)}
          width={pickerWidth}
          height={200}
          style={colorPickerStyles}
          // The panels are always light; don't switch the picker to its dark theme on a dark OS
          disableDarkMode
        />
      </PickerWrapper>
    </Container>
  );
};

export default ColorPicker;
