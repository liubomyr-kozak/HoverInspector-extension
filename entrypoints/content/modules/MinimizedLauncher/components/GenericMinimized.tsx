import React from "react";
import { useDispatch } from "react-redux";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { Modal } from "antd";
import { toggleLauncherActiveIcon, toggleFeatureMinimized } from "@entrypoints/content/store/app/app.slice.ts";
import { ICON_ITEMS } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { FeatureContainer, MainButton, QuickAction } from "../MinimizedLauncher.styled.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";

interface GenericMinimizedProps {
  featureId: string;
  style?: React.CSSProperties;
}

export const GenericMinimized: React.FC<GenericMinimizedProps> = ({ featureId, style }) => {
  const dispatch = useDispatch();
  const feature = ICON_ITEMS.find((item) => item.id === featureId);

  if (!feature) return null;

  const openFeature = () => dispatch(toggleLauncherActiveIcon(featureId));

  const closeMinimized = () => {
    Modal.confirm({
      title: "Close Minimized Launcher",
      content: `Would you like to activate the ${feature.title} feature?`,
      okText: "Yes, Activate",
      cancelText: "Just Close",
      getContainer: () =>
        // @ts-ignore
        (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!,
      onOk: () => {
        dispatch(toggleLauncherActiveIcon(featureId));
        dispatch(toggleFeatureMinimized(featureId));
      },
      onCancel: () => {
        dispatch(toggleFeatureMinimized(featureId));
        dispatch(toggleLauncherActiveIcon(featureId));
      },
    });
  };

  const FeatureIcon = feature.icon;

  return (
    <FeatureContainer style={style}>
      <Tooltip title="Close">
        <QuickAction onClick={closeMinimized}>
          <IconX size={14} />
        </QuickAction>
      </Tooltip>
      <MainButton onClick={openFeature}>
        <FeatureIcon size={16} />
        {feature.title}
        <IconChevronDown size={14} />
      </MainButton>
    </FeatureContainer>
  );
};
