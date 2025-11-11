import React, { useMemo } from 'react';

interface Note {
  content: string;
  updatedAt: number;
}

interface NotesSearchProps {
  notes: Record<string, Note>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (url: string) => void;
  onDeleteNote: (url: string) => void;
}

export const NotesSearch: React.FC<NotesSearchProps> = ({
  notes,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onDeleteNote
}) => {
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const results: Array<{url: string; note: Note; matches: string[]}> = [];

    Object.entries(notes).forEach(([url, note]) => {
      const matches: string[] = [];
      
      // Search in URL
      if (url.toLowerCase().includes(query)) {
        matches.push('URL');
      }
      
      // Search in content
      if (note.content.toLowerCase().includes(query)) {
        matches.push('Content');
      }
      
      if (matches.length > 0) {
        results.push({ url, note, matches });
      }
    });

    // Sort by relevance (content matches first, then by date)
    return results.sort((a, b) => {
      const aContentMatch = a.matches.includes('Content');
      const bContentMatch = b.matches.includes('Content');
      
      if (aContentMatch && !bContentMatch) return -1;
      if (!aContentMatch && bContentMatch) return 1;
      
      return b.note.updatedAt - a.note.updatedAt;
    });
  }, [notes, searchQuery]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index}>{part}</mark> : 
        part
    );
  };

  const getContentSnippet = (content: string, query: string, maxLength: number = 150) => {
    if (!query.trim()) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, queryIndex + query.length + 50);
    const snippet = content.substring(start, end);
    
    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
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
    <div className="notes-search">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search notes by content or URL..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
        {searchQuery && (
          <button 
            className="clear-search"
            onClick={() => onSearchChange('')}
          >
            ×
          </button>
        )}
      </div>

      {searchQuery && (
        <div className="search-results">
          <div className="search-results-header">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} 
            {searchQuery && ` for "${searchQuery}"`}
          </div>

          {searchResults.length === 0 ? (
            <div className="no-results">
              <p>No notes found matching your search.</p>
            </div>
          ) : (
            <div className="search-results-list">
              {searchResults.map(({ url, note, matches }) => (
                <div key={url} className="search-result-item">
                  <div className="search-result-header">
                    <div className="search-result-url">
                      {highlightText(formatUrl(url), searchQuery)}
                    </div>
                    <div className="search-result-matches">
                      {matches.map(match => (
                        <span key={match} className="match-badge">
                          {match}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="search-result-content">
                    {highlightText(getContentSnippet(note.content, searchQuery), searchQuery)}
                  </div>
                  
                  <div className="search-result-meta">
                    <span className="search-result-date">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="search-result-actions">
                      <button 
                        className="view-btn"
                        onClick={() => onSelectNote(url)}
                      >
                        View
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searchQuery && (
        <div className="search-placeholder">
          <p>Enter a search term to find notes by content or URL.</p>
        </div>
      )}
    </div>
  );
};
