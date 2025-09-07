import { useState, useEffect } from 'react';

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

const STORAGE_KEY = 'notes-app-data';

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

// Sample notes for initial demo
const sampleNotes: Note[] = [
  {
    id: '1',
    title: 'Project Meeting Notes',
    content: `# Project Kickoff Meeting

## Attendees
- Sarah Johnson (PM)
- Mike Chen (Dev Lead)
- Lisa Park (Designer)

## Key Points
- **Timeline**: 6 weeks for MVP
- **Budget**: $50,000 approved
- **Tech Stack**: React, Node.js, PostgreSQL

## Action Items
- [ ] Set up development environment
- [ ] Create wireframes
- [ ] Schedule weekly check-ins`,
    color: '#3b82f6',
    location: 'Conference Room A',
    category: 'Meeting Notes',
    createdAt: new Date(2024, 11, 1, 10, 0),
    updatedAt: new Date(2024, 11, 1, 11, 30)
  },
  {
    id: '2',
    title: 'Weekend Trip Planning',
    content: `Planning a weekend getaway to the mountains!

**Things to pack:**
- Hiking boots
- Camera
- Snacks
- First aid kit

**Places to visit:**
- Mountain View Trail
- Lake Serenity
- Old Mill Restaurant

Weather forecast looks great - sunny and 72°F!`,
    color: '#10b981',
    location: 'Home',
    category: 'Weekend Plans',
    createdAt: new Date(2024, 11, 2, 14, 15),
    updatedAt: new Date(2024, 11, 3, 9, 20)
  },
  {
    id: '3',
    title: 'Blog Ideas',
    content: `Content ideas for the tech blog:

1. **"Building Scalable React Apps"**
   - Component architecture
   - State management patterns
   - Performance optimization

2. **"The Future of Web Development"**
   - WebAssembly trends
   - AI integration
   - New frameworks

3. **"Developer Productivity Tips"**
   - VS Code extensions
   - Terminal shortcuts
   - Workflow automation`,
    color: '#f59e0b',
    category: 'Blog Post Ideas',
    createdAt: new Date(2024, 11, 4, 16, 45),
    updatedAt: new Date(2024, 11, 4, 17, 10)
  }
];

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const notesWithDates = parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        setNotes(notesWithDates);
      } else {
        // Initialize with sample notes
        setNotes(sampleNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes(sampleNotes);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const createNote = (category: string = 'Things to do'): Note => {
    // Add location context for "Page Notes" category
    const locationContext = category === 'Page Notes' ? window.location.href : undefined;
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: category === 'Page Notes' ? 'Page Note' : '',
      content: category === 'Page Notes' ? `Note created from: ${window.location.href}\n\n` : '',
      color: '#3b82f6',
      location: locationContext,
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    );
    saveNotes(updatedNotes);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
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