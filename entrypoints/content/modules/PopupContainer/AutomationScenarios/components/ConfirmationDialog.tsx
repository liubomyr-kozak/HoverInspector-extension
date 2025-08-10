import React from "react";

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * React component for confirmation dialog content
 * Used with react-toastify to provide proper React component rendering
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="font-sans w-full">
      <div className="mb-3 text-sm leading-relaxed text-gray-700">{message}</div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onConfirm}
          className="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 border-0 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};
