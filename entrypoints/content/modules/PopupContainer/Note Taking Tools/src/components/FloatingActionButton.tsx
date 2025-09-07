import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Folder,
  MapPin,
  Tag,
  Zap
} from 'lucide-react';

interface FloatingActionButtonProps {
  onNewNote: (category?: string) => void;
  selectedCategory: string;
}

const quickCategories = [
  { name: 'Things to do', icon: Calendar, color: '#3b82f6' },
  { name: 'Meeting Notes', icon: Folder, color: '#10b981' },
  { name: 'Weekend Plans', icon: Calendar, color: '#f59e0b' },
  { name: 'Work Tasks this Month', icon: Tag, color: '#8b5cf6' },
  { name: 'Blog Post Ideas', icon: FileText, color: '#ec4899' },
  { name: 'Vacation Ideas', icon: MapPin, color: '#06b6d4' },
];

export function FloatingActionButton({ onNewNote, selectedCategory }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickNote = (category: string) => {
    onNewNote(category);
    setIsOpen(false);
  };

  const handleNewNote = () => {
    const category = selectedCategory === 'All Notes' ? 'Things to do' : selectedCategory;
    onNewNote(category);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
          >
            <Plus className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="end" 
          side="top" 
          className="w-80 p-4 mb-4 shadow-xl border-0 bg-card/95 backdrop-blur-sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>

            <Button
              onClick={handleNewNote}
              className="w-full justify-start gap-3 h-12 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              variant="ghost"
            >
              <Plus className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">New Note</div>
                <div className="text-xs text-muted-foreground">
                  Add to {selectedCategory}
                </div>
              </div>
            </Button>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Categories</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.name}
                      onClick={() => handleQuickNote(category.name)}
                      variant="ghost"
                      className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-accent/50 border border-transparent hover:border-border/50"
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">
                        {category.name}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // Add functionality for page context note
                  onNewNote('Page Notes');
                  setIsOpen(false);
                }}
              >
                <FileText className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Add Note to Page</div>
                  <div className="text-xs text-muted-foreground">
                    Context-aware note
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}