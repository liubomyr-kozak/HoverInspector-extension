import React, { useEffect } from "react";
import { SettingTab, SettingTabHeader, TabContainer } from "./HoverSelectedInfo.styled";
import { IconBrandAbstract, IconCode, IconLayersSelected, IconWashDryShade } from "@tabler/icons-react";
import CustomSegmented from "@entrypoints/shared/components/CustomSegmented";
import Title from "antd/es/typography/Title";
import PopupStyleInspector from "./components/PopupStyleInspector";
import StyleVisualizer from "./components/StyleVisualizer";
import { useDispatch, useSelector } from "react-redux";
import {
  onUpdateInspectorViewTypeWatcher,
  unlockTarget,
} from "@entrypoints/content/store/app/saga-action/app.saga.action";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager";
import DomNodeManagerInstance from "@entrypoints/core/services/dom/DomNodeManager";
import { setSelectedElementType, setTargetLocked } from "@entrypoints/content/store/app/app.slice";

const HoverSelectedInfo = () => {
  const dispatch = useDispatch();
  const app = useSelector((state: any) => state.app);

  const viewType = app.viewType || "ui";
  const selectedElementType = app.selectedElementType;
  const isSingleSelect = app.isSingleSelect;
  const isTargetLocked = !!app.isTargetLocked;

  const isElementWasSelected = DomNodeManagerInstance.isFirstNodeSelected;
  const activeElement = isElementWasSelected ? selectedElementType : "hoverElement";

  // When isSingleSelect is true, automatically set selectedElementType to 'hoverElement'
  useEffect(() => {
    if (isSingleSelect && selectedElementType === "selectedElement") {
      dispatch(setSelectedElementType("hoverElement"));
    }
  }, [isSingleSelect, selectedElementType, dispatch]);

  // Hover Only never selects, so a target locked before it was switched on would stay stuck
  useEffect(() => {
    if (isSingleSelect && isTargetLocked) handleUnlockTarget();
  }, [isSingleSelect, isTargetLocked]);

  const handleUnlockTarget = () => {
    unlockTarget();
    dispatch(setTargetLocked(false));
  };

  const handleUpdateInspectorViewType = (data) => {
    dispatch(onUpdateInspectorViewTypeWatcher.getPayload(data));
  };

  const handleSetSelectedElementType = (elementType) => {
    dispatch(setSelectedElementType(elementType));
    const selectedNode = DomNodeManager.get(elementType);

    // Flash the element so the user sees which one they switched to. A Web Animation on the outline leaves
    // the element's own styles alone (changing its background used to show up in the tooltip and CSS output)
    if (selectedNode?.nodeType === Node.ELEMENT_NODE && typeof (selectedNode as any).animate === "function") {
      selectedNode.animate(
        [
          { outline: "3px solid rgba(242, 157, 104, 1)", outlineOffset: "2px" },
          { outline: "3px solid rgba(242, 157, 104, 0)", outlineOffset: "6px" },
        ],
        { duration: 700, easing: "ease-out" },
      );
    }
  };

  return (
    <SettingTab>
      <SettingTabHeader>
        <Title level={5}>View type</Title>
        <CustomSegmented
          className="mb-5"
          value={viewType}
          onChange={handleUpdateInspectorViewType}
          options={[
            {
              value: "code",
              label: "Style code",
              icon: <IconCode size={16} />,
            },
            {
              value: "ui",
              label: "UI details",
              icon: <IconBrandAbstract size={16} />,
            },
          ]}
          ariaLabel="View type"
        />

        {!isSingleSelect && (
          <>
            <Title level={5}>Selected element</Title>
            <CustomSegmented
              className="mb-5"
              value={selectedElementType}
              onChange={handleSetSelectedElementType}
              options={[
                {
                  label: "Source",
                  value: "selectedElement",
                  icon: <IconWashDryShade size={16} />,
                },
                {
                  label: "Target",
                  value: "hoverElement",
                  icon: <IconLayersSelected size={16} />,
                },
              ]}
              ariaLabel="Selected element"
            />
            <div className="-mt-3 mb-4 text-xs text-gray-500">
              {isTargetLocked ? (
                <>
                  Target locked. Click on the page to pick a new source, or{" "}
                  <button type="button" className="text-blue-600 underline hover:text-blue-700" onClick={handleUnlockTarget}>
                    unlock it
                  </button>
                  .
                </>
              ) : isElementWasSelected ? (
                "Hover to measure from the source. Click again to lock the target."
              ) : (
                "Click an element on the page to make it the source."
              )}
            </div>
          </>
        )}
      </SettingTabHeader>

      <TabContainer active>
        {viewType === "code" ? (
          <PopupStyleInspector selectedElementType={activeElement} />
        ) : (
          <StyleVisualizer selectedElementType={activeElement} />
        )}
      </TabContainer>
    </SettingTab>
  );
};

export default HoverSelectedInfo;
