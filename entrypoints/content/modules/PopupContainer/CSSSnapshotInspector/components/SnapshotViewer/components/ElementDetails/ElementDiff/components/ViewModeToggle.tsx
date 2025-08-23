import React from "react";
import { IconEye, IconCode } from "@tabler/icons-react";
import type { ViewMode } from "../hooks/useViewMode";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  const buttonBaseClass = "px-2 py-1 rounded flex items-center gap-1";
  const activeClass = "bg-blue-100 text-blue-700 border border-blue-300";
  const inactiveClass = "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50";

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        onClick={() => onChange("computed")}
        className={`${buttonBaseClass} ${
          mode === "computed" ? activeClass : inactiveClass
        }`}
      >
        <IconEye size={12} />
        Computed
      </button>
      <button
        onClick={() => onChange("class")}
        className={`${buttonBaseClass} ${
          mode === "class" ? activeClass : inactiveClass
        }`}
      >
        <IconCode size={12} />
        Class View
      </button>
    </div>
  );
};