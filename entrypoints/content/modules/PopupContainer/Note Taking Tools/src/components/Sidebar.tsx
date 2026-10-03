import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Search, MapPin, Globe, FolderPlus } from 'lucide-react';
import type { Note } from '../hooks/useReduxNotes';
import type { NoteGroup } from '@entrypoints/shared/types/notes';

export const ALL_NOTES = '__all__';
export const UNCATEGORIZED_ID = '__uncategorized__';

interface SidebarProps {
  notes: Note[];
  groups: NoteGroup[];
  onNoteSelect: (noteId: string) => void;
  onNewNote: () => void;
  // ALL_NOTES, UNCATEGORIZED_ID or a group id
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onCreateCategory: (name: string) => void;
}

/**
 * Notes list with search and categories (note groups)
 */
export function Sidebar({
  notes,
  groups,
  onNoteSelect,
  onNewNote,
  selectedCategory,
  onCategorySelect,
  onCreateCategory,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  const uncategorizedCount = notes.filter((n) => !n.groupId).length;
  const categories = [
    { id: ALL_NOTES, name: 'All Notes', count: notes.length },
    ...groups.map((group) => ({
      id: group.id,
      name: group.name,
      count: notes.filter((n) => n.groupId === group.id).length,
    })),
    ...(groups.length > 0 && uncategorizedCount > 0
      ? [{ id: UNCATEGORIZED_ID, name: 'Uncategorized', count: uncategorizedCount }]
      : []),
  ];

  const query = searchQuery.toLowerCase();
  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch = note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === ALL_NOTES ||
        (selectedCategory === UNCATEGORIZED_ID ? !note.groupId : note.groupId === selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const submitCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    onCreateCategory(name);
    setNewCategory('');
    setIsCategoryFormOpen(false);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Search and new note */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted border-0"
          />
        </div>
        <Button onClick={onNewNote} size="sm" className="h-9 gap-1.5" title="New note">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategorySelect(category.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              <span className="max-w-[120px] truncate">{category.name}</span>
              <span className={isSelected ? 'opacity-70' : 'text-muted-foreground'}>{category.count}</span>
            </button>
          );
        })}

        <Popover open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
              title="New category"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              Category
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitCategory();
              }}
            >
              <Input
                autoFocus
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-8"
              />
              <Button type="submit" size="sm" disabled={!newCategory.trim()}>
                Add
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {/* Notes List */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-20">
        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              role="button"
              tabIndex={0}
              className="p-3 rounded-xl cursor-pointer transition-all duration-200 bg-muted/50 hover:bg-muted"
              onClick={() => onNoteSelect(note.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onNoteSelect(note.id);
              }}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: note.color }} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate m-0">{note.title || 'Untitled'}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed m-0">
                    {note.content || 'No content'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium whitespace-nowrap">{formatDate(note.updatedAt)}</span>
                <span className="truncate">{note.category}</span>
                {note.location && (
                  <div className="flex items-center gap-1 min-w-0">
                    {note.attachment === 'global' ? (
                      <Globe className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span className="truncate max-w-[110px] font-medium">{note.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-10">
              <p className="font-medium m-0">{searchQuery ? 'No notes match your search' : 'No notes yet'}</p>
              {!searchQuery && <p className="text-xs mt-1">Click "New" to get started</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
