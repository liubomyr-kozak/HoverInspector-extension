import React from "react";
import { IconEdit, IconTrash, IconPin, IconGripVertical } from "@tabler/icons-react";
import styled from "styled-components";
import { Note as NoteType, ColorPalette } from "@entrypoints/shared/types/notes";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";

const NoteContainer = styled.div<{ $color?: string; $isSelected: boolean }>`
  background: ${props => props.$color || '#fef3c7'};
  border: 2px solid ${props => props.$isSelected ? '#3b82f6' : 'transparent'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NoteTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex: 1;
`;

const NoteActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${NoteContainer}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const NoteContent = styled.div`
  color: #4b5563;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;


const NoteMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
`;

const DragHandle = styled.div`
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.2s;

  ${NoteContainer}:hover & {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

interface NoteProps {
  note: NoteType;
  isSelected: boolean;
  colorPalette: ColorPalette[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
}

export const Note: React.FC<NoteProps> = ({
  note,
  isSelected,
  colorPalette,
  onEdit,
  onDelete,
  onSelect,
  onPin,
}) => {
  const highlightOverlay = useHighlightOverlay();
  
  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number = 0.85): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse r, g, b values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Map colorId to actual color value with rgba opacity
  const hexColor = colorPalette.find(color => color.id === note.colorId)?.value || '#fef3c7';
  const noteColor = hexToRgba(hexColor, 0.85);

  // Handle highlighting attached DOM element when note is hovered
  const handleMouseEnter = () => {
    if (note.elementXPath) {
      highlightOverlay.startHighlight(note.elementXPath, 'note');
    }
  };

  const handleMouseLeave = () => {
    if (note.elementXPath) {
      highlightOverlay.stopHighlight();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPinned = !!note.coordinates || !!note.elementXPath;

  return (
    <NoteContainer
      $color={noteColor}
      $isSelected={isSelected}
      onClick={() => onSelect(note.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <DragHandle>
        <IconGripVertical />
      </DragHandle>

      <NoteHeader>
        <NoteTitle>{note.title || 'Untitled Note'}</NoteTitle>

        <NoteActions>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              onPin(note.id);
            }}
            title={isPinned ? "Unpin note" : "Pin note to page"}
            style={{ 
              background: isPinned ? 'rgba(59, 130, 246, 0.1)' : undefined,
              color: isPinned ? '#3b82f6' : undefined 
            }}
          >
            <IconPin />
          </ActionButton>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note.id);
            }}
            title="Edit note"
          >
            <IconEdit />
          </ActionButton>
          <ActionButton
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this note?')) {
                onDelete(note.id);
              }
            }}
            title="Delete note"
          >
            <IconTrash />
          </ActionButton>
        </NoteActions>
      </NoteHeader>

      <NoteContent>{note.content || 'No content'}</NoteContent>

      <NoteMeta>
        <span>{note.domain}</span>
        <span>{formatDate(note.updatedAt)}</span>
      </NoteMeta>
    </NoteContainer>
  );
};