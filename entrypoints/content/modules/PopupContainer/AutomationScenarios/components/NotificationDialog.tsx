import React from "react";

interface NotificationDialogProps {
  message: string;
}

/**
 * React component for notification dialog content
 * Used with react-toastify to provide proper React component rendering
 * This is similar to ConfirmationDialog but without buttons and with auto-close functionality
 */
export const NotificationDialog: React.FC<NotificationDialogProps> = ({ message }) => {
  return (
    <div className="font-sans w-full">
      <div className="text-sm leading-relaxed text-gray-700">{message}</div>
    </div>
  );
};