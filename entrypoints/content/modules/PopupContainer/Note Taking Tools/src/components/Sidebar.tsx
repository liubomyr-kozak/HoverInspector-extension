import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Search, 
  FileText, 
  Folder,
  MapPin,
  Calendar,
  Tag,
  ChevronLeft,
  Menu
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  location?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SidebarProps {
  notes: Note[];
  activeNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  onNewNote: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ 
  notes, 
  activeNoteId, 
  onNoteSelect, 
  onNewNote,
  selectedCategory,
  onCategorySelect,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'All Notes', icon: FileText, count: notes.length },
    { name: 'Things to do', icon: Calendar, count: notes.filter(n => n.category === 'Things to do').length },
    { name: 'Meeting Notes', icon: Folder, count: notes.filter(n => n.category === 'Meeting Notes').length },
    { name: 'Weekend Plans', icon: Calendar, count: notes.filter(n => n.category === 'Weekend Plans').length },
    { name: 'Work Tasks this Month', icon: Tag, count: notes.filter(n => n.category === 'Work Tasks this Month').length },
    { name: 'Blog Post Ideas', icon: FileText, count: notes.filter(n => n.category === 'Blog Post Ideas').length },
    { name: 'Vacation Ideas', icon: MapPin, count: notes.filter(n => n.category === 'Vacation Ideas').length },
    { name: 'Interesting Sites', icon: FileText, count: notes.filter(n => n.category === 'Interesting Sites').length },
    { name: 'Books to Read', icon: FileText, count: notes.filter(n => n.category === 'Books to Read').length },
  ];

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Notes' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);

  if (isCollapsed) {
    return (
      <div className="w-16 bg-background border-r border-border h-full flex flex-col">
        {/* Collapsed Header */}
        <div className="p-4 space-y-4">
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={onNewNote} 
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Collapsed Categories */}
        <div className="px-4 pb-4">
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.name;
                
                return (
                  <Button
                    key={category.name}
                    variant="ghost"
                    size="sm"
                    className={`w-8 h-8 p-0 ${
                      isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                    }`}
                    onClick={() => onCategorySelect(category.name)}
                    title={category.name}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Collapsed Notes List */}
        <div className="flex-1 overflow-hidden px-4">
          <ScrollArea className="flex-1">
            <div className="space-y-2 py-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`w-8 h-8 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center ${
                    activeNoteId === note.id 
                      ? 'bg-accent shadow-sm' 
                      : 'bg-muted/50 hover:bg-muted hover:shadow-sm'
                  }`}
                  onClick={() => onNoteSelect(note.id)}
                  title={note.title || 'Untitled'}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: note.color }}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-background border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-foreground" />
            <span className="text-xl font-semibold">Notes</span>
          </div>
          {selectedCategory !== 'All Notes' && (
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button 
          onClick={onNewNote} 
          className="w-full justify-start gap-3 h-11 bg-muted hover:bg-muted/80"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-muted border-0"
          />
        </div>
      </div>

      {/* Current Category Header */}
      {selectedCategory !== 'All Notes' && selectedCategoryData && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
            <selectedCategoryData.icon className="h-5 w-5 text-accent-foreground" />
            <div className="flex-1">
              <h3 className="font-medium text-accent-foreground">{selectedCategory}</h3>
              <p className="text-sm text-muted-foreground">{filteredNotes.length} notes</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories - only show when All Notes is selected */}
      {selectedCategory === 'All Notes' && (
        <>
          <div className="px-6 pb-4">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Categories</h3>
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.name;
                  
                  return (
                    <Button
                      key={category.name}
                      variant="ghost"
                      className={`w-full justify-between p-3 h-auto text-left ${
                        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                      }`}
                      onClick={() => onCategorySelect(category.name)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{category.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground font-normal">{category.count}</span>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <Separator />
        </>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-hidden">
        <div className="px-6 py-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {selectedCategory === 'All Notes' ? `${selectedCategory} (${filteredNotes.length})` : 'Notes'}
          </h3>
        </div>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 pb-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeNoteId === note.id 
                    ? 'bg-accent shadow-sm' 
                    : 'bg-muted/50 hover:bg-muted hover:shadow-sm'
                }`}
                onClick={() => onNoteSelect(note.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: note.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate mb-1">
                      {note.title || 'Untitled'}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {note.content || 'No content'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{formatDate(note.updatedAt)}</span>
                  {note.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-20 font-medium">{note.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredNotes.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <div className="space-y-2">
                  <p className="font-medium">{searchQuery ? 'No notes match your search' : 'No notes yet'}</p>
                  {!searchQuery && (
                    <p className="text-xs">Click "New Note" to get started</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}