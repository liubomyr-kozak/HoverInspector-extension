import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { IconEye, IconEyeOff, IconGripVertical } from "@tabler/icons-react";

import {
  DragFeatureIcon,
  DragFeatureTitle,
  DraggableItem,
  DragHandle,
  DragHandleIcon,
  EyeIconContainer,
} from "./SortableItem.styled.ts";

interface SortableItemProps {
  id: string;
  title: string;
  icon: any;
  isVisible?: boolean;
  isActive?: boolean;
  onToggleVisibility?: (id: string) => void;
  onOpen?: (id: string) => void;
}

const SortableItem = ({ 
  id, 
  title, 
  icon, 
  isVisible = true,
  isActive = false,
  onToggleVisibility,
  onOpen,
}: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const Icon = icon;
  const EyeIcon = isVisible ? IconEye : IconEyeOff;

  const handleEyeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleVisibility) {
      onToggleVisibility(id);
    }
  };

  return (
    <DraggableItem ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      {/* Reordering is pointer-only (no keyboard sensor), so the row itself is not a tab stop; its two buttons are */}
      <DragHandle {...attributes} {...listeners} role="group" aria-label={title} tabIndex={-1}>
        <DragFeatureIcon>
          {" "}
          <Icon />
        </DragFeatureIcon>
        <DragFeatureTitle
          type="button"
          onClick={() => onOpen?.(id)}
          title={isActive ? "Opened" : "Open this tool"}
          style={{ fontWeight: isActive ? 600 : undefined }}
        >
          {title}
        </DragFeatureTitle>
        <EyeIconContainer
          type="button"
          onClick={handleEyeClick}
          title={isVisible ? "Hide from toolbar" : "Show on toolbar"}
          aria-label={`${title}: ${isVisible ? "hide from toolbar" : "show on toolbar"}`}
        >
          <EyeIcon />
        </EyeIconContainer>
        <DragHandleIcon>
          <IconGripVertical />
        </DragHandleIcon>
      </DragHandle>
    </DraggableItem>
  );
};

export default SortableItem;