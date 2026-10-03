import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createNote as createNoteAction,
  updateNote as updateNoteAction,
  deleteNote as deleteNoteAction,
  getAllNotes,
  createNoteGroup,
  createColorPalette,
} from '@entrypoints/background/store/notesActionsSlice';
import { DEFAULT_NOTE_COLORS } from '@entrypoints/background/services/notes';
import { triggerRefresh } from '@entrypoints/content/store/notes/notes.slice';
import { Note as StoredNote, NoteGroup, NoteLocation, ColorPalette } from '@entrypoints/shared/types/notes';
import {
  NoteScope,
  buildLocations,
  describeNoteLocations,
  getNoteScope,
  getPageContext,
  getScopeForm,
} from '@entrypoints/background/services/noteScope';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  getFreeNotePosition,
} from '@entrypoints/content/modules/PopupContainer/PageNotes/VisibleNotesProvider/notePosition';

// Where a note is shown as a sticky note: the same choice Page Notes offers (see noteScope.ts)
export type NoteAttachment = NoteScope;

// Note shape used by the Note Taking Tools components
export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  colorId?: string;
  // Human readable description of the attachment (e.g. "localhost/page2.html")
  location?: string;
  attachment: NoteAttachment;
  // Category = note group
  category: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteUpdates {
  title?: string;
  content?: string;
  color?: string;
  attachment?: NoteAttachment;
  groupId?: string | null;
}

export const UNCATEGORIZED = 'Uncategorized';
const DEFAULT_COLOR_ID = 'blue';

const getAttachment = (note: StoredNote): NoteAttachment => getNoteScope(note, getPageContext());

const describeLocation = (note: StoredNote): string | undefined =>
  getAttachment(note) === 'none' ? undefined : describeNoteLocations(note);

/**
 * Stored locations for a scope. An existing note keeps its own site, extra URL patterns, element and
 * position; a note that gets onto a page for the first time is placed in view, clear of other stickies.
 */
const toLocations = (attachment: NoteAttachment, existing?: StoredNote): NoteLocation[] => {
  const context = getPageContext();
  const locations = buildLocations({ ...getScopeForm(existing ?? null, context), scope: attachment }, context);
  const [primary, ...rest] = locations;
  if (!primary || primary.coordinates || primary.elementXPath) return locations;
  const position = getFreeNotePosition(DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT);
  return [{ ...primary, coordinates: { ...position, width: DEFAULT_NOTE_WIDTH, height: DEFAULT_NOTE_HEIGHT } }, ...rest];
};

/**
 * Note Taking Tools data, backed by the background `notes` slice (shared with Page Notes)
 */
export function useReduxNotes() {
  const dispatch = useDispatch();
  const { refreshTrigger } = useSelector((state: any) => state?.notes || { refreshTrigger: 0 });
  const [loading, setLoading] = useState(true);
  const [storedNotes, setStoredNotes] = useState<StoredNote[]>([]);
  const [groups, setGroups] = useState<NoteGroup[]>([]);
  const [palettes, setPalettes] = useState<ColorPalette[]>(DEFAULT_NOTE_COLORS);

  const loadNotes = useCallback(async () => {
    try {
      const data = await getAllNotes();
      setStoredNotes(data?.notes || []);
      setGroups(data?.groups || []);
      setPalettes(data?.colorPalettes?.length ? data.colorPalettes : DEFAULT_NOTE_COLORS);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount and whenever notes change elsewhere (Page Notes, sticky notes)
  useEffect(() => {
    loadNotes();
  }, [loadNotes, refreshTrigger]);

  const notes = useMemo<Note[]>(
    () =>
      storedNotes.map((note) => {
        const group = groups.find((g) => g.id === note.groupId);
        return {
          id: note.id,
          title: note.title || '',
          content: note.content || '',
          colorId: note.colorId,
          color: palettes.find((palette) => palette.id === note.colorId)?.value || DEFAULT_NOTE_COLORS[0].value,
          location: describeLocation(note),
          attachment: getAttachment(note),
          category: group?.name || UNCATEGORIZED,
          groupId: group?.id,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        };
      }),
    [storedNotes, groups, palettes],
  );

  // Other views (Page Notes list, sticky notes) reload on this
  const notifyChange = useCallback(() => dispatch(triggerRefresh()), [dispatch]);

  // Finds the palette entry for a color value, creating a custom one when needed
  const resolveColorId = useCallback(
    async (color: string): Promise<string> => {
      const existing = palettes.find((palette) => palette.value.toLowerCase() === color.toLowerCase());
      if (existing) return existing.id;
      const created = await createColorPalette({ data: { value: color, name: `Custom ${color}` } as ColorPalette });
      setPalettes((prev) => [...prev, created]);
      return created.id;
    },
    [palettes],
  );

  const createNote = useCallback(
    async (data: NoteUpdates): Promise<string> => {
      const created = await createNoteAction({
        title: data.title || '',
        content: data.content || '',
        groupId: data.groupId || undefined,
        colorId: data.color ? await resolveColorId(data.color) : DEFAULT_COLOR_ID,
        locations: toLocations(data.attachment || 'none'),
        isVisible: true,
      });
      setStoredNotes((prev) => [...prev, created]);
      notifyChange();
      return created.id;
    },
    [resolveColorId, notifyChange],
  );

  const updateNote = useCallback(
    async (id: string, updates: NoteUpdates) => {
      const existing = storedNotes.find((note) => note.id === id);
      if (!existing) return;

      const storedUpdates: Partial<StoredNote> = {};
      if (updates.title !== undefined && updates.title !== existing.title) storedUpdates.title = updates.title;
      if (updates.content !== undefined && updates.content !== existing.content) storedUpdates.content = updates.content;
      if (updates.groupId !== undefined && (updates.groupId || undefined) !== existing.groupId) {
        storedUpdates.groupId = updates.groupId || undefined;
      }
      if (updates.color !== undefined) {
        const colorId = await resolveColorId(updates.color);
        if (colorId !== existing.colorId) storedUpdates.colorId = colorId;
      }
      if (updates.attachment !== undefined && updates.attachment !== getAttachment(existing)) {
        storedUpdates.locations = toLocations(updates.attachment, existing);
      }
      if (Object.keys(storedUpdates).length === 0) return;

      const updated = await updateNoteAction({ id, updates: storedUpdates });
      if (updated) {
        setStoredNotes((prev) => prev.map((note) => (note.id === id ? updated : note)));
        notifyChange();
      }
    },
    [storedNotes, resolveColorId, notifyChange],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await deleteNoteAction(id);
      setStoredNotes((prev) => prev.filter((note) => note.id !== id));
      notifyChange();
    },
    [notifyChange],
  );

  const createCategory = useCallback(
    async (name: string): Promise<NoteGroup> => {
      const group = await createNoteGroup({ data: { name, color: '#6B7280' } });
      setGroups((prev) => [...prev, group]);
      notifyChange();
      return group;
    },
    [notifyChange],
  );

  const getNote = useCallback((id: string): Note | undefined => notes.find((note) => note.id === id), [notes]);

  return {
    notes,
    groups,
    palettes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    createCategory,
    getNote,
  };
}
