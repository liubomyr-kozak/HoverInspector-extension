import React, { useEffect, useState } from "react";
import { usePopoverFocus } from "@entrypoints/shared/utils/usePopoverFocus";
import { useDispatch, useSelector } from "react-redux";
import { Popover, Switch } from "antd";
import { IconInfoCircle, IconSettings, IconPointer, IconLayoutList } from "@tabler/icons-react";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon";
import { IconButton } from "@entrypoints/shared/components/IconButton";

import HoverSelectedInfo from "@entrypoints/content/modules/SettingsIconBox/HoverSelectedInfo.tsx";
import HoverCardEditor from "@entrypoints/content/modules/SettingsIconBox/components/HoverCardEditor";
import { onUpdateEventPreventDefaultWatcher } from "@entrypoints/content/store/app/saga-action/app.saga.action";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
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
      <Switch checkedChildren={"Yes"} unCheckedChildren={"No"} value={value} onChange={onChange} aria-label={title} />
    </div>
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  // Edit mode for the hover card's rows; replaces the panel body while it is on
  const [editingCard, setEditingCard] = useState(false);
  const settingsFocus = usePopoverFocus(settingsOpen, setSettingsOpen);

  // Create the content for the settings popover
  const settingsContent = (
    <div
      ref={settingsFocus.contentRef}
      onBlur={settingsFocus.onContentBlur}
      role="dialog"
      aria-label="Inspector settings"
      className="p-2"
      style={{ minWidth: "250px" }}
    >
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
      <button
        type="button"
        className="mt-1 text-sm text-blue-600 underline hover:text-blue-700"
        onClick={() => {
          setSettingsOpen(false);
          setEditingCard(true);
        }}
      >
        Customize hover card…
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <PortalModalHeader portalId={HeaderPortalId.ELEMENT_INSPECTOR}>
        <FeatureTitle>
          <FeatureIcon icon={INSPECTOR.icon} isBetta />
          <FeatureTitleText title={INSPECTOR.title}>{INSPECTOR.title}</FeatureTitleText>

          <PortalModalHeaderButtons>
            <IconButton
              label={editingCard ? "Close hover card editor" : "Customize hover card"}
              active={editingCard}
              onClick={() => setEditingCard((v) => !v)}
            >
              <IconLayoutList size={18} />
            </IconButton>
            <Popover
              content={settingsContent}
              zIndex={1150}
              placement="topRight"
              // Click as well as hover, so the settings also open from the keyboard
              trigger={["hover", "click"]}
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              // @ts-ignore
              getPopupContainer={() => document.querySelector("hover-inspector")!.shadowRoot as HTMLElement}
            >
              <IconButton
                ref={settingsFocus.triggerRef as React.Ref<HTMLButtonElement>}
                label="Inspector settings"
                title=""
                aria-haspopup="dialog"
                aria-expanded={settingsOpen}
              >
                <IconSettings size={18} />
              </IconButton>
            </Popover>
          </PortalModalHeaderButtons>
        </FeatureTitle>
      </PortalModalHeader>
      {editingCard ? (
        <HoverCardEditor onDone={() => setEditingCard(false)} />
      ) : (
      <>
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
      </>
      )}
    </div>
  );
};
