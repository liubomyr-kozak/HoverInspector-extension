import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, FileText, Folder, Globe, Zap } from 'lucide-react';
import type { NoteGroup } from '@entrypoints/shared/types/notes';
import type { NoteAttachment } from '../hooks/useReduxNotes';
import { ALL_NOTES, UNCATEGORIZED_ID } from './Sidebar';

interface FloatingActionButtonProps {
  onNewNote: (groupId?: string, attachment?: NoteAttachment) => void;
  selectedCategory: string;
  groups: NoteGroup[];
}

// How many categories are offered as quick actions
const QUICK_CATEGORY_COUNT = 6;

export function FloatingActionButton({ onNewNote, selectedCategory, groups }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedCategory);
  const quickCategories = groups.slice(0, QUICK_CATEGORY_COUNT);

  const createNote = (groupId?: string, attachment?: NoteAttachment) => {
    onNewNote(groupId, attachment);
    setIsOpen(false);
  };

  return (
    // Positioned inside the tool (not the page viewport) so it stays in the panel
    <div className="absolute bottom-3 right-3 z-10">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="w-12 h-12 p-0 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            aria-label="Quick actions"
          >
            <Plus className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-72 p-3 shadow-xl bg-card/95">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm m-0">Quick Actions</h3>
            </div>

            <Button
              onClick={() => createNote(selectedGroup?.id)}
              className="w-full justify-start gap-3 h-auto py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              variant="ghost"
            >
              <Plus className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">New Note</div>
                <div className="text-xs text-muted-foreground">
                  {selectedGroup
                    ? `Add to ${selectedGroup.name}`
                    : selectedCategory === ALL_NOTES || selectedCategory === UNCATEGORIZED_ID
                      ? 'Without a category'
                      : ''}
                </div>
              </div>
            </Button>

            {quickCategories.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground m-0">Add to category</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickCategories.map((group) => (
                    <Button
                      key={group.id}
                      onClick={() => createNote(group.id)}
                      variant="ghost"
                      className="h-auto px-2 py-2 justify-start gap-2 border border-border/50 hover:border-border"
                    >
                      <Folder className="h-4 w-4 flex-shrink-0" style={{ color: group.color }} />
                      <span className="text-xs font-medium truncate">{group.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 text-muted-foreground hover:text-foreground"
                onClick={() => createNote(selectedGroup?.id, 'page')}
              >
                <FileText className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Add Note to Page</div>
                  <div className="text-xs text-muted-foreground">Shown as a sticky note on this page</div>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 text-muted-foreground hover:text-foreground"
                onClick={() => createNote(selectedGroup?.id, 'global')}
              >
                <Globe className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Add Note to All Pages</div>
                  <div className="text-xs text-muted-foreground">Shown as a sticky note everywhere</div>
                </div>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
