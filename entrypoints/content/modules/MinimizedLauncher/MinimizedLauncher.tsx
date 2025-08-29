import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Rnd } from "react-rnd";
import { onChangeMinimizedLauncherPosition } from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";
import { MinimizedFeature } from "./components/MinimizedFeature";
import { BodyPortal } from "@entrypoints/shared/components/BodyPortal";

// Main minimized launcher component
export const MinimizedLauncher: React.FC = () => {
  const dispatch = useDispatch();
  const minimizedPosition = useSelector((state: any) => state?.app.launcher.minimizedPosition || { x: 20, y: 20 });
  const { minimizedFeatures = [] } = useSelector((state: any) => state?.app);

  const handleDragStop = (e: any, d: { x: number; y: number }) => {
    dispatch(onChangeMinimizedLauncherPosition.getPayload({ x: d.x, y: d.y }));
  };

  return (
    // <BodyPortal containerId="hover-inspector-porta-minimized-launcher">
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10000 }}>
      <Rnd
        position={{
          x: minimizedPosition.x,
          y: minimizedPosition.y,
        }}
        size={{
          width: "auto",
          height: "auto",
        }}
        onDragStop={handleDragStop}
        dragHandleClassName="drag-handle"
        enableResizing={false}
        bounds="parent"
        className="pointer-events-auto"
        style={{
          display: "flex",
          borderRadius: "30px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          minWidth: "120px",
        }}
      >
        {minimizedFeatures.map((featureId, index) => (
          <MinimizedFeature key={`minimized-${featureId}`} featureId={featureId} />
        ))}
      </Rnd>
    </div>
    // </BodyPortal>
  );
};
