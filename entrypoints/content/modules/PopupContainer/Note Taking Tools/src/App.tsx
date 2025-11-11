import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { FloatingActionButton } from './components/FloatingActionButton';
import { useReduxNotes as useNotes } from './hooks/useReduxNotes';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const { notes, loading, createNote, updateNote, deleteNote, getNote } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState('All Notes');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeNote = activeNoteId ? getNote(activeNoteId) : undefined;

  const handleNewNote = (category?: string) => {
    const noteCategory = category || (selectedCategory === 'All Notes' ? 'Things to do' : selectedCategory);
    const newNote = createNote(noteCategory);
    setActiveNoteId(newNote.id);
    
    // If creating a note with a specific category, switch to that category
    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
  };

  const handleNoteSelect = (noteId: string) => {
    setActiveNoteId(noteId);
  };

  const handleNoteSave = (updates: Partial<any>) => {
    if (activeNoteId) {
      updateNote(activeNoteId, updates);
    }
  };

  const handleNoteDelete = () => {
    if (activeNoteId) {
      deleteNote(activeNoteId);
      setActiveNoteId(undefined);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setActiveNoteId(undefined);
    // Auto-collapse sidebar when selecting a specific category (not "All Notes")
    if (category !== 'All Notes') {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background antialiased relative">
      <Sidebar
        notes={notes}
        activeNoteId={activeNoteId}
        onNoteSelect={handleNoteSelect}
        onNewNote={() => handleNewNote()}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      
      <NoteEditor
        note={activeNote}
        onSave={handleNoteSave}
        onDelete={activeNote ? handleNoteDelete : undefined}
      />

      <FloatingActionButton
        onNewNote={handleNewNote}
        selectedCategory={selectedCategory}
      />

      <Toaster />
    </div>
  );
}