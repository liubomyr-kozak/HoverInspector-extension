import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronDown, FileText, Folder, Globe } from 'lucide-react';
import type { NoteGroup } from '@entrypoints/shared/types/notes';
import type { NoteAttachment } from '../hooks/useReduxNotes';

interface NewNoteMenuProps {
  onNewNote: (groupId?: string, attachment?: NoteAttachment) => void;
  selectedCategory: string;
  groups: NoteGroup[];
}

// How many categories are offered as quick targets
const QUICK_CATEGORY_COUNT = 6;

/**
 * The second half of the "New" split button: the plain button creates a note in the current category,
 * this menu creates one somewhere else (another category, or as a sticky note on the page).
 */
export function NewNoteMenu({ onNewNote, selectedCategory, groups }: NewNoteMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedCategory);
  const otherCategories = groups.filter((group) => group.id !== selectedCategory).slice(0, QUICK_CATEGORY_COUNT);

  const createNote = (groupId?: string, attachment?: NoteAttachment) => {
    onNewNote(groupId, attachment);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="h-8 w-7 px-0 rounded-l-none border-l border-primary-foreground/30" aria-label="More ways to add a note">
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-2"
            onClick={() => createNote(selectedGroup?.id, 'page')}
          >
            <FileText className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Sticky note on this page</div>
              <div className="text-xs text-muted-foreground">Shown on this page only</div>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-2"
            onClick={() => createNote(selectedGroup?.id, 'global')}
          >
            <Globe className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Sticky note on all pages</div>
              <div className="text-xs text-muted-foreground">Shown on every page</div>
            </div>
          </Button>

          {otherCategories.length > 0 && (
            <div className="border-t border-border pt-2 mt-1 space-y-1.5">
              <h4 className="px-2 text-xs font-medium text-muted-foreground m-0">New note in category</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {otherCategories.map((group) => (
                  <Button
                    key={group.id}
                    onClick={() => createNote(group.id)}
                    variant="ghost"
                    className="h-auto min-w-0 px-2 py-1.5 justify-start gap-2 border border-border/50 hover:border-border"
                  >
                    <Folder className="h-4 w-4 flex-shrink-0" style={{ color: group.color }} />
                    <span className="text-xs font-medium truncate">{group.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
