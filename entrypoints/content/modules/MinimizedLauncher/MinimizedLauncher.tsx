import React, { useEffect, useRef, useState } from "react";
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

  const rndRef = useRef<Rnd | null>(null);
  // Re-render on window resize (and once the pill is measured) so the clamp below uses current sizes
  const [, setLayoutTick] = useState(0);
  useEffect(() => {
    const onResize = () => setLayoutTick((tick) => tick + 1);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [minimizedFeatures.length]);

  const pill = rndRef.current?.getSelfElement();
  const pillWidth = pill?.offsetWidth || 160;
  const pillHeight = pill?.offsetHeight || 56;

  const handleDragStop = (e: any, d: { x: number; y: number }) => {
    dispatch(onChangeMinimizedLauncherPosition.getPayload({ x: d.x, y: d.y }));
  };

  return (
    // <BodyPortal containerId="hover-inspector-porta-minimized-launcher">
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10000 }}>
      <Rnd
        ref={rndRef}
        // A position saved in a wider window (or a window made smaller) would leave the pill off-screen
        position={{
          x: Math.max(0, Math.min(minimizedPosition.x, window.innerWidth - pillWidth)),
          y: Math.max(0, Math.min(minimizedPosition.y, window.innerHeight - pillHeight)),
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
