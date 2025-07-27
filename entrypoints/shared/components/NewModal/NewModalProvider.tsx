import * as React from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { windowResizeForModal } from "../ModalDraggable/store/draggableModalSlice";

// Helper function to get window dimensions
const getWindowSize = () => ({
  width: typeof window !== "undefined" ? window.innerWidth : 0,
  height: typeof window !== "undefined" ? window.innerHeight : 0,
});

export const NewModalProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window !== "object") {
      return;
    }

    const onResize = () => {
      dispatch(windowResizeForModal(getWindowSize()));
    };

    window.addEventListener("resize", onResize);

    // Initialize on mount
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, [dispatch]);

  return <>{children}</>;
};