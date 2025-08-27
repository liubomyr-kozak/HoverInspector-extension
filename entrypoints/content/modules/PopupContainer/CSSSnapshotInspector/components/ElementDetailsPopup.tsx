import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@entrypoints/content/store/createStore";
import { closeElementDetails } from "@entrypoints/content/store/elementDetails/elementDetails.slice";
import { ElementDetails } from "./SnapshotViewer/components/ElementDetails";
import { ElementDiff } from "./SnapshotViewer/components/ElementDetails/ElementDiff/ElementDiff.tsx";
import { FloatingModal } from "@entrypoints/shared/components/FloatingModal/FloatingModal";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager";
import { ModalOverlayModal } from "@entrypoints/shared/components/FloatingModal/ModalOverlayModal";

export const ElementDetailsPopup: React.FC = () => {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => s.elementDetails);

  // Default position and size
  const defaultPosition = {
    x: window.innerWidth - 460,
    y: 50,
    width: 420,
    height: 400,
  };

  // State for panel position and size
  const [panelPosition, setPanelPosition] = useState(defaultPosition);
  const [isPositionLoaded, setIsPositionLoaded] = useState(false);

  // Load saved position on mount
  useEffect(() => {
    const loadPosition = async () => {
      try {
        const savedPosition = await ExtensionStorageManager.getElementDetailsPanelPosition();
        if (savedPosition) {
          setPanelPosition(savedPosition);
        }
        setIsPositionLoaded(true);
      } catch (error) {
        console.error("Failed to load ElementDetails panel position:", error);
        setIsPositionLoaded(true);
      }
    };

    loadPosition();

    return () => {
      dispatch(closeElementDetails());
    };
  }, []);

  // Handle position/size changes
  const handleModalStateChange = async (newState: { x: number; y: number; width: number; height: number }) => {
    setPanelPosition(newState);
    try {
      await ExtensionStorageManager.saveElementDetailsPanelPosition(newState);
    } catch (error) {
      console.error("Failed to save ElementDetails panel position:", error);
    }
  };

  if (!state?.isOpen || !isPositionLoaded) return null;

  const selectedElementData = {
    tagName: state.tagName || "",
    id: state.id || null,
    classes: state.classes || [],
    attributes: state.attributes || {},
    bounds: state.bounds,
    inlineStyles: state.inlineStyles || {},
    xpath: state.xpath,
  } as any;

  const selectedElementStyles = Object.entries(state.styles || {});

  return (
    <FloatingModal
      open={state.isOpen}
      title="Element details"
      onCancel={() => dispatch(closeElementDetails())}
      initialWidth={panelPosition.width}
      initialHeight={panelPosition.height}
      initialX={panelPosition.x}
      initialY={panelPosition.y}
      onModalStateChange={handleModalStateChange}
      footer={null}
    >
      <ModalOverlayModal>
        <ElementDetails
          selectedElement={1}
          selectedElementData={selectedElementData}
          selectedElementStyles={selectedElementStyles as Array<[string, any]>}
        />
      </ModalOverlayModal>
    </FloatingModal>
  );
};
