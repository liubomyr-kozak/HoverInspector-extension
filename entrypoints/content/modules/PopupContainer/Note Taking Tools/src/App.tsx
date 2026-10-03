import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Sidebar, ALL_NOTES, UNCATEGORIZED_ID } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { FloatingActionButton } from './components/FloatingActionButton';
import { PortalContainerContext } from './components/ui/popover';
import { useReduxNotes as useNotes, Note, NoteAttachment, NoteUpdates, UNCATEGORIZED } from './hooks/useReduxNotes';
import nttStyles from './ntt.css?inline';
import { LoadingState } from '@entrypoints/shared/components/LoadingState';

// Id of the note being written before it is saved for the first time
const DRAFT_ID = '__draft__';

// Above the extension panels (modal z-index 1000, launcher 1100)
const PORTAL_Z_INDEX = '1150';

/**
 * Creates the element popovers are portalled into: inside the extension's shadow root (so the
 * styles apply) and carrying the tool's design tokens.
 */
const usePortalContainer = (rootRef: React.RefObject<HTMLDivElement | null>) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current?.getRootNode();
    const host = root instanceof ShadowRoot ? (root.querySelector('body') ?? root) : document.body;
    const element = document.createElement('div');
    element.className = 'ntt-root ntt-portal';
    Object.assign(element.style, { position: 'fixed', top: '0', left: '0', zIndex: PORTAL_Z_INDEX });
    // Esc closes the popover only; keep it from reaching the extension's global Esc shortcut
    const stopEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.stopPropagation();
    };
    element.addEventListener('keydown', stopEscape);
    host.appendChild(element);
    setContainer(element);

    return () => {
      element.removeEventListener('keydown', stopEscape);
      element.remove();
    };
  }, [rootRef]);

  return container;
};

const reportError = (message: string) => (error: unknown) => {
  console.error(message, error);
  toast.error(`${message}: ${(error as Error)?.message || error}`);
};

export default function App() {
  const { notes, groups, palettes, loading, createNote, updateNote, deleteNote, createCategory, getNote } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string>();
  const [draft, setDraft] = useState<{ groupId?: string; attachment: NoteAttachment } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(ALL_NOTES);
  // Changes only when another note is opened, so saving a draft keeps the editor's state
  const [editorKey, setEditorKey] = useState(0);
  const creatingRef = useRef<Promise<void> | null>(null);
  const pendingUpdatesRef = useRef<NoteUpdates | null>(null);

  const activeNoteIdRef = useRef(activeNoteId);
  activeNoteIdRef.current = activeNoteId;

  const rootRef = useRef<HTMLDivElement>(null);
  const portalContainer = usePortalContainer(rootRef);

  const openEditor = (noteId: string | undefined) => {
    setActiveNoteId(noteId);
    setEditorKey((key) => key + 1);
  };

  const handleNewNote = useCallback(
    (groupId?: string, attachment: NoteAttachment = 'none') => {
      const selectedGroupId =
        selectedCategory !== ALL_NOTES && selectedCategory !== UNCATEGORIZED_ID ? selectedCategory : undefined;
      setDraft({ groupId: groupId ?? selectedGroupId, attachment });
      openEditor(DRAFT_ID);
    },
    [selectedCategory],
  );

  const handleCloseEditor = () => {
    setDraft(null);
    openEditor(undefined);
  };

  const handleNoteSave = (updates: NoteUpdates) => {
    if (!activeNoteId) return;

    if (activeNoteId !== DRAFT_ID) {
      updateNote(activeNoteId, updates).catch(reportError('Failed to save note'));
      return;
    }

    // A draft becomes a note once it has some text
    if (creatingRef.current) {
      pendingUpdatesRef.current = updates;
      return;
    }
    if (!updates.title?.trim() && !updates.content?.trim()) return;

    creatingRef.current = createNote({ groupId: draft?.groupId, attachment: draft?.attachment, ...updates })
      .then((id) => {
        // Keep editing the new note unless the editor was closed meanwhile
        if (activeNoteIdRef.current === DRAFT_ID) {
          setDraft(null);
          setActiveNoteId(id);
        }
        const pending = pendingUpdatesRef.current;
        pendingUpdatesRef.current = null;
        if (pending) return updateNote(id, pending);
      })
      .catch(reportError('Failed to create note'))
      .finally(() => {
        creatingRef.current = null;
      });
  };

  const handleNoteDelete = () => {
    if (activeNoteId && activeNoteId !== DRAFT_ID) {
      deleteNote(activeNoteId).catch(reportError('Failed to delete note'));
    }
    handleCloseEditor();
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const group = await createCategory(name);
      setSelectedCategory(group.id);
    } catch (error) {
      reportError('Failed to create category')(error);
    }
  };

  const draftGroup = groups.find((group) => group.id === draft?.groupId);
  const activeNote: Note | undefined =
    activeNoteId === DRAFT_ID && draft
      ? {
          id: DRAFT_ID,
          title: '',
          content: '',
          color: palettes[0]?.value || '#3B82F6',
          attachment: draft.attachment,
          category: draftGroup?.name || UNCATEGORIZED,
          groupId: draftGroup?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : activeNoteId
        ? getNote(activeNoteId)
        : undefined;

  // The open note was deleted elsewhere
  useEffect(() => {
    if (!loading && activeNoteId && activeNoteId !== DRAFT_ID && !getNote(activeNoteId)) {
      openEditor(undefined);
    }
  }, [loading, activeNoteId, getNote]);

  return (
    <div ref={rootRef} className="ntt-root relative h-full min-h-[240px] flex flex-col bg-background antialiased">
      <style>{nttStyles}</style>
      <PortalContainerContext.Provider value={portalContainer}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingState label="Loading notes…" />
          </div>
        ) : activeNote ? (
          <NoteEditor
            key={editorKey}
            note={activeNote}
            isDraft={activeNoteId === DRAFT_ID}
            groups={groups}
            palettes={palettes}
            onSave={handleNoteSave}
            onDelete={handleNoteDelete}
            onClose={handleCloseEditor}
          />
        ) : (
          <>
            <Sidebar
              notes={notes}
              groups={groups}
              onNoteSelect={openEditor}
              onNewNote={() => handleNewNote()}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onCreateCategory={handleCreateCategory}
            />
            <FloatingActionButton onNewNote={handleNewNote} selectedCategory={selectedCategory} groups={groups} />
          </>
        )}
      </PortalContainerContext.Provider>
    </div>
  );
}
