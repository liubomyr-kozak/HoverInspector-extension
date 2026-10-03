import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Popover, Switch } from "antd";
import { IconInfoCircle, IconSettings, IconPointer } from "@tabler/icons-react";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";

import HoverSelectedInfo from "@entrypoints/content/modules/SettingsIconBox/HoverSelectedInfo.tsx";
import { onUpdateEventPreventDefaultWatcher } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import {
  PortalModalHeader,
  HeaderPortalId,
  PortalModalHeaderButtons,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";

import { setIsSingleSelect, setPreventDefault, setShowAllBorders } from "../../store/app/app.slice";
import PopupSettingModel from "@entrypoints/core/Models/PopupSettingModel.ts";
import { INSPECTOR, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

export const ElementInspectorPopup = () => {
  const dispatch = useDispatch();
  const preventDefault = useSelector((state: any) => state.app?.preventDefault);
  const isSingleSelect = useSelector((state: any) => state.app?.isSingleSelect);
  const showAllBorders = useSelector((state: any) => state.app?.showAllBorders);
  const [preventDefaultValue, setPreventDefaultValue] = useState(preventDefault);
  const [isSingleSelectValue, setIsSingleSelectValue] = useState(isSingleSelect);
  const [showAllBordersValue, setShowAllBordersValue] = useState(showAllBorders);

  const handleUpdatePopupSetting = (data) => {
    dispatch(onUpdateEventPreventDefaultWatcher.getPayload(data));
  };

  useEffect(() => {
    setPreventDefaultValue(() => {
      return preventDefault;
    });
  }, [preventDefault]);

  useEffect(() => {
    setIsSingleSelectValue(() => {
      return isSingleSelect;
    });
  }, [isSingleSelect]);

  useEffect(() => {
    setShowAllBordersValue(() => {
      return showAllBorders;
    });
  }, [showAllBorders]);

  // Helper function to render a toggle
  const renderToggle = (title: string, tooltip: string, value: boolean, onChange: () => void) => (
    <div className="mb-4 flex justify-between items-center">
      <span className="mr-5 flex items-center">
        {title}
        <Tooltip placement="top" title={tooltip}>
          <span className="ml-1" style={{ display: "inline-flex", alignItems: "center" }}>
            <IconInfoCircle size={16} />
          </span>
        </Tooltip>
      </span>
      <Switch checkedChildren={"Yes"} unCheckedChildren={"No"} value={value} onChange={onChange} />
    </div>
  );

  // Create the content for the settings popover
  const settingsContent = (
    <div className="p-2" style={{ minWidth: "250px" }}>
      <div className="font-medium mb-2">Additional Settings</div>
      <div>
        {renderToggle(
          "Prevent Default",
          "Prevents default browser behavior when interacting with elements",
          preventDefaultValue,
          () => {
            dispatch(setPreventDefault(!preventDefault));
            handleUpdatePopupSetting({ preventDefault: !preventDefault });
          },
        )}

        {renderToggle(
          "Hover Only",
          "Inspect only the element under the cursor; clicks don't select a source element",
          isSingleSelectValue,
          () => {
            dispatch(setIsSingleSelect(!isSingleSelect));
            PopupSettingModel.setIsSingleSelect(!isSingleSelect);
          },
        )}

        {renderToggle(
          "Show All Borders",
          "Outline every element on the page to see the layout structure",
          showAllBordersValue,
          () => {
            dispatch(setShowAllBorders(!showAllBorders));
            PopupSettingModel.setShowAllBorders(!showAllBorders);
          },
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.ELEMENT_INSPECTOR}>
        <FeatureTitle>
          <FeatureIcon icon={INSPECTOR.icon} isBetta />
          {INSPECTOR.title}

          <PortalModalHeaderButtons>
            <Popover
              content={settingsContent}
              zIndex={1150}
              placement="topRight"
              trigger="hover"
              // @ts-ignore
              getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
            >
              <span className={`cursor-pointer text-gray-500 hover:text-gray-700 transition-colors ml-auto`}>
                <IconSettings size={18} />
              </span>
            </Popover>
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalModalHeader>
      {/* Display active toggles directly in the UI */}
      <div className="mb-4">
        {preventDefault &&
          renderToggle(
            "Prevent Default",
            "Prevents default browser behavior when interacting with elements",
            preventDefaultValue,
            () => {
              dispatch(setPreventDefault(!preventDefault));
              handleUpdatePopupSetting({ preventDefault: !preventDefault });
            },
          )}

        {isSingleSelect &&
          renderToggle(
            "Hover Only",
            "Inspect only the element under the cursor; clicks don't select a source element",
            isSingleSelectValue,
            () => {
              dispatch(setIsSingleSelect(!isSingleSelect));
              PopupSettingModel.setIsSingleSelect(!isSingleSelect);
            },
          )}

        {showAllBorders &&
          renderToggle(
            "Show All Borders",
            "Outline every element on the page to see the layout structure",
            showAllBordersValue,
            () => {
              dispatch(setShowAllBorders(!showAllBorders));
              PopupSettingModel.setShowAllBorders(!showAllBorders);
            },
          )}
      </div>
      <HoverSelectedInfo />
    </div>
  );
};
