import React, { useState } from 'react';

interface Note {
  content: string;
  updatedAt: number;
}

interface NotesListProps {
  notes: Record<string, Note>;
  onDeleteNote: (url: string) => void;
  onSelectNote: (url: string) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  onDeleteNote,
  onSelectNote
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'url'>('date');

  const noteEntries = Object.entries(notes);
  
  const sortedNotes = noteEntries.sort(([urlA, noteA], [urlB, noteB]) => {
    if (sortBy === 'date') {
      return noteB.updatedAt - noteA.updatedAt;
    } else {
      return urlA.localeCompare(urlB);
    }
  });

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname,
        path: urlObj.pathname,
        full: url
      };
    } catch {
      return {
        domain: url,
        path: '',
        full: url
      };
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (noteEntries.length === 0) {
    return (
      <div className="notes-list empty">
        <div className="empty-state">
          <h4>No notes yet</h4>
          <p>Start taking notes by switching to the Editor view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-list">
      <div className="notes-list-header">
        <h4>All Notes ({noteEntries.length})</h4>
        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'date' | 'url')}
          >
            <option value="date">Last Modified</option>
            <option value="url">URL</option>
          </select>
        </div>
      </div>

      <div className="notes-list-items">
        {sortedNotes.map(([url, note]) => {
          const urlInfo = formatUrl(url);
          
          return (
            <div key={url} className="note-item">
              <div className="note-item-header">
                <div className="note-url-info">
                  <div className="note-domain">{urlInfo.domain}</div>
                  <div className="note-path" title={urlInfo.full}>
                    {urlInfo.path}
                  </div>
                </div>
                <div className="note-date">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="note-content-preview">
                {truncateContent(note.content)}
              </div>
              
              <div className="note-item-actions">
                <button 
                  className="edit-btn"
                  onClick={() => onSelectNote(url)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => {
                    if (confirm('Delete this note?')) {
                      onDeleteNote(url);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
