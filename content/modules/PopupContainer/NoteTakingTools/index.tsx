import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notesActionsSlice } from '../../../../store/slices/notesSlice';
import { NoteEditor } from './components/NoteEditor';
import { NotesList } from './components/NotesList';
import { NotesSearch } from './components/NotesSearch';
import './NoteTakingTools.css';

export type NoteTakingView = 'editor' | 'list' | 'search';

export const NoteTakingTools: React.FC = () => {
  const dispatch = useDispatch();
  const notes = useSelector((state: any) => state.notes);
  const currentUrl = useSelector((state: any) => state.tabs?.currentUrl || window.location.href);
  const [activeView, setActiveView] = useState<NoteTakingView>('editor');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load notes on component mount
    dispatch(notesActionsSlice.actions.loadNotes());
  }, [dispatch]);

  const currentNote = notes.notes?.[currentUrl];

  const handleSaveNote = (content: string) => {
    dispatch(notesActionsSlice.actions.setNote({
      url: currentUrl,
      content,
      updatedAt: Date.now()
    }));
  };

  const handleDeleteNote = (url?: string) => {
    const targetUrl = url || currentUrl;
    dispatch(notesActionsSlice.actions.deleteNote({ url: targetUrl }));
  };

  const handleClearAllNotes = () => {
    dispatch(notesActionsSlice.actions.clearNotes());
  };

  return (
    <div className="note-taking-tools">
      <div className="note-taking-header">
        <h3>Note Taking Tools</h3>
        <div className="view-selector">
          <button 
            className={activeView === 'editor' ? 'active' : ''}
            onClick={() => setActiveView('editor')}
          >
            Editor
          </button>
          <button 
            className={activeView === 'list' ? 'active' : ''}
            onClick={() => setActiveView('list')}
          >
            All Notes
          </button>
          <button 
            className={activeView === 'search' ? 'active' : ''}
            onClick={() => setActiveView('search')}
          >
            Search
          </button>
        </div>
      </div>

      <div className="note-taking-content">
        {activeView === 'editor' && (
          <NoteEditor
            note={currentNote}
            onSave={handleSaveNote}
            onDelete={() => handleDeleteNote()}
            currentUrl={currentUrl}
          />
        )}
        
        {activeView === 'list' && (
          <NotesList
            notes={notes.notes || {}}
            onDeleteNote={handleDeleteNote}
            onSelectNote={(url) => {
              // Navigate to editor view for the selected note
              setActiveView('editor');
              // You might want to update current URL context here
            }}
          />
        )}
        
        {activeView === 'search' && (
          <NotesSearch
            notes={notes.notes || {}}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectNote={(url) => setActiveView('editor')}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </div>

      {activeView === 'list' && Object.keys(notes.notes || {}).length > 0 && (
        <div className="note-taking-actions">
          <button 
            className="clear-all-btn"
            onClick={handleClearAllNotes}
          >
            Clear All Notes
          </button>
        </div>
      )}
    </div>
  );
};
