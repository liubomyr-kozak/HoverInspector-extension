import React, { JSX, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  onChangeFeaturePopupPosition,
  onChangeLauncherIconOrder,
  onClearAllActiveIcons,
} from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { FloatingModal } from "@entrypoints/shared/components/FloatingModal/FloatingModal";
import { ElementInspectorPopup } from "@entrypoints/content/modules/PopupContainer/ElementInspectorPopup";
import {
  ANALYZE_PAGE,
  AUTOMATION,
  CONVERT_TOOLS,
  CSS_SNAPSHOT,
  INSPECTOR,
  PICKER,
  POPUP_SUPPORT_TOOLS,
  RULER,
} from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { UnitConverter } from "@entrypoints/content/modules/PopupContainer/UnitConverter.tsx";
import ColorPicker from "@entrypoints/content/modules/PopupContainer/ColorPicker.tsx";
import AnalyzePageUI from "@entrypoints/content/modules/PopupContainer/AnalyzePageUI.tsx";
import { AutomationScenarios } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationScenarios.tsx";
import { CSSSnapshotInspector } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/CSSSnapshotInspector.tsx";
import { HighlightOverlayProvider } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext.tsx";
import {
  FeatureContainer,
  FooterContainer,
  HeaderContainer,
  ButtonsContainer,
  HeaderButtonsContainer,
} from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import ViewportInfo from "@entrypoints/content/modules/PopupContainer/ViewportInfo.tsx";
import { ModalOverlayModal } from "@entrypoints/shared/components/FloatingModal/FloatingModal.styled.ts";

// Smallest size at which every tool panel is still usable (older versions allowed shrinking to 10px)
const MIN_PANEL_WIDTH = 320;
const MIN_PANEL_HEIGHT = 260;

// POPUP_SUPPORT_TOOLS mandatory updated this list
const COMPONENT_MAP: Record<string, JSX.Element> = {
  [INSPECTOR.id]: <ElementInspectorPopup />,
  [CONVERT_TOOLS.id]: <UnitConverter />,
  [PICKER.id]: <ColorPicker />,
  [RULER.id]: <ViewportInfo />,
  [ANALYZE_PAGE.id]: <AnalyzePageUI />,
  [AUTOMATION.id]: <AutomationScenarios />,
  [CSS_SNAPSHOT.id]: <CSSSnapshotInspector />,
};

export function PopupContainer() {
  const dispatch = useDispatch();

  const { activeIcons = [], iconOrder: iconOrderStorage } = useSelector((state: any) => state?.app.launcher);
  const featurePopupPosition = useSelector((state: any) => state?.app.featurePopupPosition);

  const handleUpdatePopupSetting = (data) => {
    dispatch(onChangeFeaturePopupPosition.getPayload(data));
  };

  // Create header content - now all features use portals to inject their headers
  const renderHeaderContent = () => {
    return (
      <HeaderContainer>
        <HeaderButtonsContainer id="popup-header-container" />
      </HeaderContainer>
    );
  };

  // Tools added in a newer version go to the end of the user's saved order
  const iconOrder = useMemo(() => {
    if (!iconOrderStorage?.length) return POPUP_SUPPORT_TOOLS;
    const missingElements = POPUP_SUPPORT_TOOLS.filter((id) => !iconOrderStorage.includes(id));
    return missingElements.length ? [...iconOrderStorage, ...missingElements] : iconOrderStorage;
  }, [iconOrderStorage]);

  useEffect(() => {
    if (iconOrderStorage?.length && iconOrder !== iconOrderStorage) {
      dispatch(onChangeLauncherIconOrder.getPayload(iconOrder));
    }
  }, [iconOrder, iconOrderStorage]);

  const FeatureView = useMemo(() => {
    // Tools that were removed may still be in a saved order or active list
    return iconOrder.filter((id) => activeIcons.includes(id) && COMPONENT_MAP[id]).map((id) => COMPONENT_MAP[id]);
  }, [iconOrder, activeIcons]);

  return (
    <>
      <FloatingModal
        open={activeIcons.length}
        title={renderHeaderContent()}
        minWidth={MIN_PANEL_WIDTH}
        minHeight={MIN_PANEL_HEIGHT}
        initialHeight={featurePopupPosition.height}
        initialWidth={featurePopupPosition.width}
        initialX={featurePopupPosition.x}
        initialY={featurePopupPosition.y}
        onModalStateChange={handleUpdatePopupSetting}
        onCancel={() => dispatch(onClearAllActiveIcons.getPayload())}
        footer={
          <FooterContainer>
            <ButtonsContainer id="hover-inspector-popup-footer-container" />
          </FooterContainer>
        }
      >
        <ModalOverlayModal>
          <FeatureContainer key={`PopupContainer-feature--${iconOrder.join(".")}`}>{FeatureView}</FeatureContainer>
        </ModalOverlayModal>
      </FloatingModal>
    </>
  );
}
