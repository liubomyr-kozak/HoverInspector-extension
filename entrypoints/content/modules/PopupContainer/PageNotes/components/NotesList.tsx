import React, { useMemo } from "react";
import {
  IconSearch,
  IconX,
  IconPlus,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconDownload,
  IconUpload,
} from "@tabler/icons-react";
import styled from "styled-components";
import { Button } from "antd";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { EmptyState } from "@entrypoints/shared/components/EmptyState";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { Note as NoteComponent } from "./Note";
import { Note as NoteType, NoteGroup, ColorPalette } from "@entrypoints/shared/types/notes";
import { DEFAULT_NOTE_COLORS, NotesListFilter } from "@entrypoints/background/services/notes.ts";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid ${tokens.color.border};
  background: ${tokens.color.surfaceMuted};
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  height: ${tokens.control.md}px;
  padding: 0 32px 0 34px;
  border: 1px solid ${tokens.color.borderStrong};
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.surface};
  color: ${tokens.color.text};
  font-size: ${tokens.font.size.md}px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${tokens.color.primary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${tokens.color.textMuted};
  line-height: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: ${tokens.radius.sm}px;
  cursor: pointer;
  color: ${tokens.color.textMuted};

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${tokens.color.text};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const FilterSelect = styled.select`
  flex: 1;
  min-width: 0;
  height: ${tokens.control.md}px;
  padding: 0 6px;
  border: 1px solid ${tokens.color.borderStrong};
  border-radius: ${tokens.radius.md}px;
  background: ${tokens.color.surface};
  color: ${tokens.color.text};
  font-size: ${tokens.font.size.sm}px;

  &:focus {
    border-color: ${tokens.color.primary};
  }
`;

const LinkButton = styled.button`
  border: none;
  background: transparent;
  color: ${tokens.color.primary};
  font-size: ${tokens.font.size.sm}px;
  cursor: pointer;
  text-decoration: underline;
`;

const Content = styled.div`
  padding: 12px;
`;

const GroupContainer = styled.div`
  margin-bottom: 12px;
`;

const GroupHeader = styled.button`
  width: 100%;
  border: none;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 8px;
  border-radius: ${tokens.radius.md}px;
  background: #f3f4f6;
  color: ${tokens.color.text};
  cursor: pointer;

  &:hover {
    background: ${tokens.color.border};
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const GroupName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  font-size: ${tokens.font.size.sm}px;
`;

const GroupBadge = styled.span`
  background: ${tokens.color.surface};
  color: ${tokens.color.textSecondary};
  padding: 0 8px;
  border-radius: 10px;
  font-size: ${tokens.font.size.xs}px;
`;

const GroupContent = styled.div<{ $isExpanded: boolean }>`
  display: ${(props) => (props.$isExpanded ? "block" : "none")};
`;

const FILTER_LABELS: Record<NotesListFilter, string> = {
  page: "On this page",
  all: "All notes",
  everywhere: "Shown on every site",
  element: "Attached to an element",
  hidden: "Hidden sticky notes",
};

interface NotesListProps {
  /** Notes after the filter and search */
  notes: NoteType[];
  groups: NoteGroup[];
  colorPalettes?: ColorPalette[];
  searchQuery: string;
  filter: NotesListFilter;
  /** Number of notes per filter, shown in the filter menu */
  filterCounts: Record<NotesListFilter, number>;
  onFilterChange: (filter: NotesListFilter) => void;
  onToggleVisibility: (id: string) => void;
  onCreateNote: () => void;
  onEditNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateSearchQuery: (query: string) => void;
  onToggleGroup: (groupId: string) => void;
  onImportNotes: () => void;
  onExportNotes: () => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  groups,
  colorPalettes,
  searchQuery,
  filter,
  filterCounts,
  onFilterChange,
  onToggleVisibility,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onUpdateSearchQuery,
  onToggleGroup,
  onImportNotes,
  onExportNotes,
}) => {
  const noteColorPalettes = colorPalettes?.length ? colorPalettes : DEFAULT_NOTE_COLORS;

  const groupedNotes = useMemo(() => {
    const grouped: { group: NoteGroup; notes: NoteType[] }[] = [];
    const ungrouped: NoteType[] = [];

    notes.forEach((note) => {
      const group = note.groupId ? groups.find((g) => g.id === note.groupId) : undefined;
      if (!group) {
        // No group, or its group was deleted
        ungrouped.push(note);
        return;
      }
      let entry = grouped.find((g) => g.group.id === group.id);
      if (!entry) {
        entry = { group, notes: [] };
        grouped.push(entry);
      }
      entry.notes.push(note);
    });

    grouped.sort((a, b) => b.group.createdAt - a.group.createdAt);
    grouped.forEach((entry) => entry.notes.sort((a, b) => b.updatedAt - a.updatedAt));
    ungrouped.sort((a, b) => b.updatedAt - a.updatedAt);

    return { grouped, ungrouped };
  }, [notes, groups]);

  const renderNote = (note: NoteType) => (
    <NoteComponent
      key={note.id}
      note={note}
      colorPalette={noteColorPalettes}
      onEdit={onEditNote}
      onDelete={onDeleteNote}
      onToggleVisibility={onToggleVisibility}
    />
  );

  const hasSearch = !!searchQuery.trim();

  const emptyState =
    filterCounts.all === 0 ? (
      <EmptyState icon={<IconFolder />} title="No notes yet" description='Add your first note with the "Add note" button.' />
    ) : hasSearch ? (
      <EmptyState
        icon={<IconSearch />}
        title="No matching notes"
        description={filter === "all" ? "Try another search." : `Nothing in "${FILTER_LABELS[filter]}" matches.`}
        action={
          filter !== "all" ? (
            <LinkButton type="button" onClick={() => onFilterChange("all")}>
              Search all notes
            </LinkButton>
          ) : undefined
        }
      />
    ) : (
      <EmptyState
        icon={<IconFolder />}
        title={filter === "page" ? "No notes on this page" : `No notes: ${FILTER_LABELS[filter].toLowerCase()}`}
        description={filter === "page" ? "Notes for other pages are under All notes." : undefined}
        action={
          <LinkButton type="button" onClick={() => onFilterChange("all")}>
            Show all notes ({filterCounts.all})
          </LinkButton>
        }
      />
    );

  return (
    <Container>
      <Header>
        <Toolbar>
          <SearchContainer>
            <SearchIcon>
              <IconSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search notes"
              aria-label="Search notes"
              value={searchQuery}
              onChange={(e) => onUpdateSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <ClearButton type="button" aria-label="Clear search" title="Clear search" onClick={() => onUpdateSearchQuery("")}>
                <IconX />
              </ClearButton>
            )}
          </SearchContainer>

          <Button type="primary" icon={<IconPlus size={16} />} onClick={onCreateNote}>
            Add note
          </Button>
        </Toolbar>
        <Toolbar>
          <FilterSelect
            aria-label="Which notes to show"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as NotesListFilter)}
          >
            {(Object.keys(FILTER_LABELS) as NotesListFilter[]).map((value) => (
              <option key={value} value={value}>
                {FILTER_LABELS[value]} ({filterCounts[value]})
              </option>
            ))}
          </FilterSelect>
          <IconButton type="button" label="Import notes from a JSON file" onClick={onImportNotes} size={32}>
            <IconUpload />
          </IconButton>
          <IconButton
            type="button"
            label="Export all notes to a JSON file"
            onClick={onExportNotes}
            disabled={filterCounts.all === 0}
            size={32}
          >
            <IconDownload />
          </IconButton>
        </Toolbar>
      </Header>

      <Content>
        {notes.length === 0 ? (
          emptyState
        ) : (
          <>
            {groupedNotes.grouped.map(({ group, notes: groupNotes }) => (
              <GroupContainer key={group.id}>
                <GroupHeader type="button" aria-expanded={!!group.isExpanded} onClick={() => onToggleGroup(group.id)}>
                  {group.isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                  <GroupName>{group.name}</GroupName>
                  <GroupBadge>{groupNotes.length}</GroupBadge>
                </GroupHeader>
                <GroupContent $isExpanded={group.isExpanded}>{groupNotes.map(renderNote)}</GroupContent>
              </GroupContainer>
            ))}
            {groupedNotes.ungrouped.map(renderNote)}
          </>
        )}
      </Content>
    </Container>
  );
};
