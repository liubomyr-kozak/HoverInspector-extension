import { createContext, useContext } from "react";
export const DiffViewContext = createContext(null);
DiffViewContext.displayName = "DiffViewContext";
export const useDiffViewContext = () => useContext(DiffViewContext);
