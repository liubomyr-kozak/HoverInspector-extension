import React, { ReactNode } from "react";
import { IconSettings } from "@tabler/icons-react";

interface SettingsButtonProps {
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * A reusable settings button component with consistent styling
 *
 * @param icon - Optional custom icon (defaults to IconSettings)
 * @param onClick - Optional click handler
 * @param className - Optional additional classes
 */
export const SettingsButton: React.FC<SettingsButtonProps> = ({ icon = <IconSettings size={18} /> }) => {
  return <span className={`cursor-pointer text-gray-500 hover:text-gray-700 transition-colors ml-auto`}>{icon}</span>;
};

export default SettingsButton;