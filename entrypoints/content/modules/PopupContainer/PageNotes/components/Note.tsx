import React from "react";
import styled from "styled-components";
import { Popconfirm } from "antd";
import { FiEdit2, FiTrash2, FiCrosshair, FiEye, FiEyeOff } from "react-icons/fi";
import { renderNoteMarkup } from "../utils/noteMarkup";
import { Note as NoteType, ColorPalette } from "@entrypoints/shared/types/notes";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { findMatchingLocation } from "@entrypoints/background/services/notes.ts";
import { describeNoteLocations } from "@entrypoints/background/services/noteScope.ts";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { tokens } from "@entrypoints/shared/styles/tokens";

const Card = styled.article<{ $color: string; $hidden: boolean }>`
  position: relative;
  margin-bottom: 8px;
  padding: 8px 8px 8px 12px;
  border: 1px solid ${tokens.color.border};
  border-left: 4px solid ${(p) => p.$color};
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.surface};
  opacity: ${(p) => (p.$hidden ? 0.65 : 1)};
  cursor: pointer;
  transition: box-shadow 150ms ease;

  &:hover {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  &:focus {
    background: ${tokens.color.primaryBg};
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h4`
  margin: 2px 0 2px;
  font-size: ${tokens.font.size.md}px;
  font-weight: 600;
  color: ${tokens.color.text};
  overflow-wrap: anywhere;
`;

const Text = styled.div`
  font-size: ${tokens.font.size.sm}px;
  line-height: 1.45;
  color: ${tokens.color.textSecondary};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Actions = styled.div`
  display: flex;
  gap: 2px;
  flex-shrink: 0;

  svg {
    width: 15px;
    height: 15px;
  }
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textMuted};

  span:first-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:last-child {
    flex-shrink: 0;
  }
`;

type NoteProps = {
  note: NoteType;
  colorPalette: ColorPalette[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
};

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const Note: React.FC<NoteProps> = ({ note, colorPalette, onEdit, onDelete, onToggleVisibility }) => {
  const highlightOverlay = useHighlightOverlay();

  const color = colorPalette.find((palette) => palette.id === note.colorId)?.value || "#F59E0B";
  const matchingLocation = findMatchingLocation(note, window.location.hostname, window.location.href);
  const elementXPath = matchingLocation?.elementXPath || (note as any).elementXPath;
  const isHidden = note.isVisible === false;
  const where = describeNoteLocations(note);

  // Clicks on the action buttons must not open the editor
  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <Card
      $color={color}
      $hidden={isHidden}
      tabIndex={0}
      aria-label={`Note ${note.title || note.content.slice(0, 40)}. Press Enter to edit.`}
      onClick={() => onEdit(note.id)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && event.key === "Enter") onEdit(note.id);
      }}
    >
      <TopRow>
        <Body>
          {note.title && <Title>{note.title}</Title>}
          <Text>{note.content ? renderNoteMarkup(note.content) : "No text"}</Text>
        </Body>
        <Actions onClick={stop} onKeyDown={stop}>
          <IconButton
            size={26}
            label={isHidden ? "Show the sticky note" : "Hide the sticky note"}
            active={isHidden}
            onClick={() => onToggleVisibility(note.id)}
          >
            {isHidden ? <FiEyeOff /> : <FiEye />}
          </IconButton>
          {elementXPath && (
            <IconButton size={26} label="Highlight the element it is attached to" onClick={() => highlightOverlay.startHighlight(elementXPath)}>
              <FiCrosshair />
            </IconButton>
          )}
          <IconButton size={26} label="Edit note" onClick={() => onEdit(note.id)}>
            <FiEdit2 />
          </IconButton>
          <Popconfirm
            title="Delete this note?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            placement="left"
            getPopupContainer={(trigger) => trigger.parentElement || trigger}
            onConfirm={() => onDelete(note.id)}
          >
            <IconButton size={26} label="Delete note">
              <FiTrash2 />
            </IconButton>
          </Popconfirm>
        </Actions>
      </TopRow>
      <Meta>
        <span title={where}>
          {where}
          {isHidden ? " · hidden" : ""}
        </span>
        <span>{formatDate(note.updatedAt)}</span>
      </Meta>
    </Card>
  );
};
