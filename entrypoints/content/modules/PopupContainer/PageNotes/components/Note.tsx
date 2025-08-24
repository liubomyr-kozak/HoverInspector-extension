import React, { useState, useRef } from "react";
import { IconEdit, IconTrash, IconPin, IconGripVertical } from "@tabler/icons-react";
import styled from "styled-components";
import { Note as NoteType } from "@entrypoints/shared/types/notes";

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

const EditableInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  outline: none;
  border-bottom: 1px solid #d1d5db;

  &:focus {
    border-bottom-color: #3b82f6;
  }
`;

const EditableTextarea = styled.textarea`
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #4b5563;
  resize: vertical;
  min-height: 60px;
  outline: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px;

  &:focus {
    border-color: #3b82f6;
  }
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
  onEdit: (id: string, updates: Partial<NoteType>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
}

export const Note: React.FC<NoteProps> = ({
  note,
  isSelected,
  onEdit,
  onDelete,
  onSelect,
  onPin,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title || '');
  const [editContent, setEditContent] = useState(note.content || '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    if (editTitle.trim() || editContent.trim()) {
      onEdit(note.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
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
      $color={note.color}
      $isSelected={isSelected}
      onClick={() => onSelect(note.id)}
    >
      <DragHandle>
        <IconGripVertical />
      </DragHandle>

      <NoteHeader>
        {isEditing ? (
          <EditableInput
            ref={titleInputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="Note title..."
          />
        ) : (
          <NoteTitle>{note.title || 'Untitled Note'}</NoteTitle>
        )}

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
              handleEdit();
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

      {isEditing ? (
        <EditableTextarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Note content..."
          autoFocus={!titleInputRef.current}
        />
      ) : (
        <NoteContent>{note.content || 'No content'}</NoteContent>
      )}

      <NoteMeta>
        <span>{note.domain}</span>
        <span>{formatDate(note.updatedAt)}</span>
      </NoteMeta>
    </NoteContainer>
  );
};