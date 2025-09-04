import { createContext, useContext } from "react";
export const DiffWidgetContext = createContext(null);
DiffWidgetContext.displayName = "DiffWidgetContext";
export const useDiffWidgetContext = () => useContext(DiffWidgetContext);
