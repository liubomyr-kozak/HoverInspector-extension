import React, { useState, useEffect } from 'react';

interface NoteEditorProps {
  note?: { content: string; updatedAt: number };
  onSave: (content: string) => void;
  onDelete: () => void;
  currentUrl: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onDelete,
  currentUrl
}) => {
  const [content, setContent] = useState(note?.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    note?.updatedAt ? new Date(note.updatedAt) : null
  );

  useEffect(() => {
    setContent(note?.content || '');
    setLastSaved(note?.updatedAt ? new Date(note.updatedAt) : null);
  }, [note]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
      setLastSaved(new Date());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setContent(note?.content || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <div className="note-url">
          <span className="url-label">Page:</span>
          <span className="url-value" title={currentUrl}>
            {formatUrl(currentUrl)}
          </span>
        </div>
        {lastSaved && (
          <div className="last-saved">
            Last saved: {lastSaved.toLocaleString()}
          </div>
        )}
      </div>

      <div className="note-editor-body">
        <textarea
          className="note-textarea"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setIsEditing(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Start writing your note for this page..."
          rows={10}
        />
      </div>

      <div className="note-editor-actions">
        <button 
          className="save-btn primary"
          onClick={handleSave}
          disabled={!content.trim() || !isEditing}
        >
          Save Note (Ctrl+S)
        </button>
        
        {isEditing && (
          <button 
            className="cancel-btn"
            onClick={handleCancel}
          >
            Cancel (Esc)
          </button>
        )}
        
        {note && (
          <button 
            className="delete-btn danger"
            onClick={() => {
              if (confirm('Are you sure you want to delete this note?')) {
                onDelete();
              }
            }}
          >
            Delete Note
          </button>
        )}
      </div>

      <div className="note-editor-stats">
        <span>Characters: {content.length}</span>
        <span>Words: {content.trim().split(/\s+/).filter(w => w).length}</span>
      </div>
    </div>
  );
};
