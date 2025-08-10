import React, { useMemo } from "react";
import { AUTOMATION } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import { AutomationMinimized } from "./AutomationMinimized";
import { GenericMinimized } from "./GenericMinimized";

interface MinimizedFeatureProps {
  featureId: string;
}

// Simplified component mapping helper - memoized to avoid recreation
const getMinimizedComponent = (featureId: string) => {
  if (featureId === AUTOMATION.id) {
    return AutomationMinimized;
  }
  return GenericMinimized;
};

export const MinimizedFeature: React.FC<MinimizedFeatureProps> = React.memo(({ featureId }) => {
  // Memoize component selection to avoid recalculation on every render
  const Component = useMemo(() => getMinimizedComponent(featureId), [featureId]);

  return <Component featureId={featureId} />;
});
