import React, { useMemo } from "react";
import {
  IconSearch,
  IconX,
  IconPlus,
  IconEye,
  IconEyeOff,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconDownload,
  IconUpload,
} from "@tabler/icons-react";
import styled from "styled-components";
import { Note as NoteComponent } from "./Note";
import { Note as NoteType, NoteGroup, NotesState, ColorPalette } from "@entrypoints/shared/types/notes";

import { DEFAULT_NOTE_COLORS } from "@entrypoints/background/services/notes.ts";

// Default color palette with IDs
const DEFAULT_COLORS: ColorPalette[] = DEFAULT_NOTE_COLORS;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 400px;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 12px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FilterControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const FilterToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "#d1d5db")};
  background: ${(props) => (props.$active ? "rgba(59, 130, 246, 0.1)" : "white")};
  color: ${(props) => (props.$active ? "#3b82f6" : "#6b7280")};
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const AddNoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #10b981;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: rgba(16, 185, 129, 0.2);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ImportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: rgba(245, 158, 11, 0.2);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ScopeToggle = styled.div`
  display: inline-flex;
  margin-top: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
`;

const ScopeButton = styled.button<{ $active: boolean }>`
  padding: 4px 10px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  background: ${(props) => (props.$active ? "#3b82f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#6b7280")};

  & + & {
    border-left: 1px solid #d1d5db;
  }
`;

const LinkButton = styled.button`
  margin-top: 12px;
  border: none;
  background: transparent;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Content = styled.div``;

const GroupContainer = styled.div`
  margin-bottom: 16px;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const GroupName = styled.span`
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  flex: 1;
`;

const GroupBadge = styled.span`
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
`;

const GroupContent = styled.div<{ $isExpanded: boolean }>`
  display: ${(props) => (props.$isExpanded ? "block" : "none")};
  margin-left: 16px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
`;

const EmptyIcon = styled.div`
  margin-bottom: 12px;
  svg {
    width: 48px;
    height: 48px;
  }
`;

const EmptyTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

interface NotesListProps {
  notesState: NotesState;
  // Number of notes before the page filter is applied
  totalNotesCount: number;
  showAllPages: boolean;
  onShowAllPagesChange: (showAll: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onCreateNote: () => void;
  onEditNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onSelectNote: (id: string) => void;
  onUpdateSearchQuery: (query: string) => void;
  onToggleGroup: (groupId: string) => void;
  onImportNotes: () => void;
  onExportNotes: () => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notesState,
  totalNotesCount,
  showAllPages,
  onShowAllPagesChange,
  onToggleVisibility,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onSelectNote,
  onUpdateSearchQuery,
  onToggleGroup,
  onImportNotes,
  onExportNotes,
}) => {
  const noteColorPalettes = useMemo(
    () => (notesState.colorPalettes?.length ? notesState.colorPalettes : DEFAULT_COLORS),
    [notesState.colorPalettes],
  );

  const filteredNotes = useMemo(() => {
    let notes = notesState.notes;

    // Filter by search query
    if (notesState.searchQuery?.trim()) {
      const query = notesState.searchQuery.toLowerCase();
      notes = notes.filter(
        (note) =>
          (note.title || "").toLowerCase().includes(query) || (note.content || "").toLowerCase().includes(query),
      );
    }

    return notes;
  }, [notesState.notes, notesState.searchQuery]);

  const groupedNotes = useMemo(() => {
    const grouped: { group: NoteGroup | null; notes: NoteType[] }[] = [];
    const ungroupedNotes: NoteType[] = [];

    // Separate grouped and ungrouped notes
    filteredNotes.forEach((note) => {
      if (note.groupId) {
        const group = notesState.groups.find((g) => g.id === note.groupId);
        if (group) {
          let groupEntry = grouped.find((g) => g.group?.id === note.groupId);
          if (!groupEntry) {
            groupEntry = { group, notes: [] };
            grouped.push(groupEntry);
          }
          groupEntry.notes.push(note);
        } else {
          // Group doesn't exist, treat as ungrouped
          ungroupedNotes.push(note);
        }
      } else {
        ungroupedNotes.push(note);
      }
    });

    // Sort groups by creation date
    grouped.sort((a, b) => b.group!.createdAt - a.group!.createdAt);

    // Sort notes within each group
    grouped.forEach((groupEntry) => {
      groupEntry.notes.sort((a, b) => b.updatedAt - a.updatedAt);
    });

    // Sort ungrouped notes
    ungroupedNotes.sort((a, b) => b.updatedAt - a.updatedAt);

    return { grouped, ungrouped: ungroupedNotes };
  }, [filteredNotes, notesState.groups]);

  const totalNotes = filteredNotes.length;
  const hasNotes = totalNotesCount > 0;
  const hasNotesInScope = notesState.notes.length > 0;

  return (
    <Container>
      <Header>
        <SearchContainer>
          <SearchIcon>
            <IconSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search notes..."
            value={notesState.searchQuery || ""}
            onChange={(e) => onUpdateSearchQuery(e.target.value)}
          />
          {notesState.searchQuery && (
            <ClearButton onClick={() => onUpdateSearchQuery("")}>
              <IconX />
            </ClearButton>
          )}
        </SearchContainer>

        <FilterControls>
          <ButtonGroup>
            <ImportButton onClick={onImportNotes}>
              <IconUpload />
              Import
            </ImportButton>
            <ExportButton onClick={onExportNotes}>
              <IconDownload />
              Export
            </ExportButton>
          </ButtonGroup>
          <AddNoteButton onClick={onCreateNote}>
            <IconPlus />
            Add Note
          </AddNoteButton>
        </FilterControls>

        <ScopeToggle role="group" aria-label="Which notes to show">
          <ScopeButton type="button" $active={!showAllPages} onClick={() => onShowAllPagesChange(false)}>
            This page
          </ScopeButton>
          <ScopeButton type="button" $active={showAllPages} onClick={() => onShowAllPagesChange(true)}>
            All pages ({totalNotesCount})
          </ScopeButton>
        </ScopeToggle>
      </Header>

      <Content>
        {!hasNotes ? (
          <EmptyState>
            <EmptyIcon>
              <IconFolder />
            </EmptyIcon>
            <EmptyTitle>No notes yet</EmptyTitle>
            <EmptyDescription>Create your first note by clicking the "Add Note" button above.</EmptyDescription>
          </EmptyState>
        ) : !hasNotesInScope ? (
          <EmptyState>
            <EmptyIcon>
              <IconFolder />
            </EmptyIcon>
            <EmptyTitle>No notes on this page</EmptyTitle>
            <EmptyDescription>Notes attached to other pages are hidden here.</EmptyDescription>
            <LinkButton type="button" onClick={() => onShowAllPagesChange(true)}>
              Show notes from all pages
            </LinkButton>
          </EmptyState>
        ) : totalNotes === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <IconSearch />
            </EmptyIcon>
            <EmptyTitle>No matching notes</EmptyTitle>
            <EmptyDescription>Try adjusting your search query or filter settings.</EmptyDescription>
          </EmptyState>
        ) : (
          <>
            {/* Render grouped notes */}
            {groupedNotes.grouped.map(({ group, notes }) => (
              <GroupContainer key={group!.id}>
                <GroupHeader onClick={() => onToggleGroup(group!.id)}>
                  {group!.isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                  <GroupName>{group!.name}</GroupName>
                  <GroupBadge>{notes.length}</GroupBadge>
                </GroupHeader>
                <GroupContent $isExpanded={group!.isExpanded}>
                  {notes.map((note) => (
                    <NoteComponent
                      key={note.id}
                      note={note}
                      isSelected={note.id === notesState.selectedNoteId}
                      colorPalette={noteColorPalettes}
                      onEdit={onEditNote}
                      onDelete={onDeleteNote}
                      onSelect={onSelectNote}
                      onToggleVisibility={onToggleVisibility}
                    />
                  ))}
                </GroupContent>
              </GroupContainer>
            ))}

            {/* Render ungrouped notes */}
            {groupedNotes.ungrouped.length > 0 && (
              <div>
                {groupedNotes.ungrouped.map((note) => (
                  <NoteComponent
                    key={note.id}
                    note={note}
                    isSelected={note.id === notesState.selectedNoteId}
                    colorPalette={noteColorPalettes}
                    onEdit={onEditNote}
                    onDelete={onDeleteNote}
                    onSelect={onSelectNote}
                    onToggleVisibility={onToggleVisibility}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Content>
    </Container>
  );
};
