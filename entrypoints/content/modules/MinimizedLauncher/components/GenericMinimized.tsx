import React from "react";
import { useDispatch } from "react-redux";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import {
  onCloseMinimizedFeature,
  onToggleFeatureMinimized,
} from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";
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

  // Restore: un-minimize and open the tool (persisted by the saga)
  const openFeature = () => dispatch(onToggleFeatureMinimized.getPayload({ featureKey: featureId }));

  // Close: drop the pill and bring the normal toolbar back, without opening the tool
  const closeMinimized = () => dispatch(onCloseMinimizedFeature.getPayload({ featureKey: featureId }));

  const FeatureIcon = feature.icon;

  return (
    <FeatureContainer className="drag-handle" style={style}>
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
