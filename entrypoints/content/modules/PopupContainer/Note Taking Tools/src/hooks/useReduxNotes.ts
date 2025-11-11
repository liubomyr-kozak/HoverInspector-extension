import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createNote as createNoteAction, 
  updateNote as updateNoteAction, 
  deleteNote as deleteNoteAction,
  getAllNotes,
  createNoteGroup,
  getColorPalettes
} from '@entrypoints/background/store/notesActionsSlice';
import { Note as ReduxNote, NoteLocation, AttachmentTypeEnum, CreateNotePayload, UpdateNotePayload } from '@entrypoints/shared/types/notes';

// Local Note interface (compatible with existing components)
export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  location?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const defaultCategories = [
  'Things to do',
  'Meeting Notes', 
  'Weekend Plans',
  'Work Tasks this Month',
  'Blog Post Ideas',
  'Vacation Ideas',
  'Interesting Sites',
  'Books to Read'
];

// Helper function to convert Redux Note to local Note format
const convertReduxNoteToLocal = (reduxNote: ReduxNote): Note => {
  // Extract category from groupId or use default
  const category = 'Things to do'; // We'll improve this with group mapping
  
  // Extract location from locations array
  const location = reduxNote.locations.length > 0 ? reduxNote.locations[0].url : undefined;
  
  // Extract color from colorId (simplified for now)
  const color = '#3b82f6'; // Default blue, we'll improve this with color palette mapping
  
  return {
    id: reduxNote.id,
    title: reduxNote.title,
    content: reduxNote.content,
    color,
    location,
    category,
    createdAt: new Date(reduxNote.createdAt),
    updatedAt: new Date(reduxNote.updatedAt)
  };
};

// Helper function to convert local Note to Redux format
const convertLocalNoteToRedux = (localNote: Note, currentUrl?: string): CreateNotePayload => {
  const domain = currentUrl ? new URL(currentUrl).hostname : window.location.hostname;
  const url = currentUrl || window.location.href;
  
  const location: NoteLocation = {
    attachmentType: AttachmentTypeEnum.ROUTE,
    domain,
    url,
    routePattern: url
  };
  
  return {
    title: localNote.title,
    content: localNote.content,
    domain,
    locations: [location],
    isVisible: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
};

export function useReduxNotes() {
  const dispatch = useDispatch();
  const reduxState = useSelector((state: any) => state.notes);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);

  // Convert Redux notes to local format
  useEffect(() => {
    if (reduxState && reduxState.notes) {
      const convertedNotes = reduxState.notes.map(convertReduxNoteToLocal);
      setNotes(convertedNotes);
      setLoading(false);
    }
  }, [reduxState]);

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        await dispatch(getAllNotes() as any);
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotes();
  }, [dispatch]);

  const createNote = (category: string = 'Things to do'): Note => {
    const currentUrl = window.location.href;
    const locationContext = category === 'Page Notes' ? currentUrl : undefined;
    
    const newLocalNote: Note = {
      id: Date.now().toString(),
      title: category === 'Page Notes' ? 'Page Note' : '',
      content: category === 'Page Notes' ? `Note created from: ${currentUrl}\n\n` : '',
      color: '#3b82f6',
      location: locationContext,
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Convert to Redux format and dispatch
    const reduxPayload = convertLocalNoteToRedux(newLocalNote, currentUrl);
    dispatch(createNoteAction(reduxPayload) as any);
    
    return newLocalNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    // Find the existing Redux note to get its current data
    const existingReduxNote = reduxState.notes.find((note: ReduxNote) => note.id === id);
    if (!existingReduxNote) return;

    // Convert updates to Redux format
    const reduxUpdates: Partial<ReduxNote> = {};
    
    if (updates.title !== undefined) reduxUpdates.title = updates.title;
    if (updates.content !== undefined) reduxUpdates.content = updates.content;
    if (updates.updatedAt !== undefined) reduxUpdates.updatedAt = updates.updatedAt.getTime();

    const updatePayload: UpdateNotePayload = {
      id,
      updates: reduxUpdates
    };

    dispatch(updateNoteAction(updatePayload) as any);
  };

  const deleteNote = (id: string) => {
    dispatch(deleteNoteAction(id) as any);
  };

  const getNote = (id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    getNote
  };
}