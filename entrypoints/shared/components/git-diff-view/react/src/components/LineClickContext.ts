import { createContext, useContext } from "react";
import type { SplitSide } from "@git-diff-view/core";

export interface LineClickHandler {
  (lineNumber: number, side: SplitSide, event: React.MouseEvent<HTMLElement>): void;
}

export interface LineClickContextValue {
  onLineClick?: LineClickHandler;
}

export const LineClickContext = createContext<LineClickContextValue>({});

LineClickContext.displayName = "LineClickContext";

export const useLineClickContext = () => useContext(LineClickContext);