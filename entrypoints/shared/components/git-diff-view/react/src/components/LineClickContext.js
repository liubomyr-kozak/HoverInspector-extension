import { createContext, useContext } from "react";
export const LineClickContext = createContext({});
LineClickContext.displayName = "LineClickContext";
export const useLineClickContext = () => useContext(LineClickContext);
