import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  AlignLeft,
  List,
  ListOrdered,
  Palette,
  MapPin,
  Smile,
  Undo,
  Redo,
  MoreHorizontal
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { LocationPicker } from './LocationPicker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

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

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Partial<Note>) => void;
  onDelete?: () => void;
}

export function NoteEditor({ note, onSave, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setLocation(note.location || '');
    } else {
      setTitle('');
      setContent('');
      setColor('#3b82f6');
      setLocation('');
    }
  }, [note]);

  const handleSave = () => {
    onSave({
      title,
      content,
      color,
      location: location || undefined,
    });
  };

  // Auto-save after changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (note && (title !== note.title || content !== note.content || color !== note.color || location !== (note.location || ''))) {
        handleSave();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, color, location, note]);

  const formatText = (format: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'orderedList':
        formattedText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  if (!note && title === '' && content === '') {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
            <Smile className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Write Your Notes ...</h2>
            <p className="text-muted-foreground leading-relaxed">
              Select a note from the sidebar or create a new one to start writing your thoughts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border px-8 py-6">
        <div className="flex items-center gap-2 mb-6">
          {/* Formatting buttons */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => formatText('bold')}
            className="p-2 hover:bg-muted"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => formatText('italic')}
            className="p-2 hover:bg-muted"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => formatText('underline')}
            className="p-2 hover:bg-muted"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => formatText('link')}
            className="p-2 hover:bg-muted"
          >
            <Link className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-3" />

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => formatText('list')}
            className="p-2 hover:bg-muted"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => formatText('orderedList')}
            className="p-2 hover:bg-muted"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-3" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
              <ColorPicker color={color} onChange={setColor} />
            </PopoverContent>
          </Popover>

          {/* Location Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
                <MapPin className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <LocationPicker location={location} onChange={setLocation} />
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
            <Smile className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="space-y-1">
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={onDelete}
                  >
                    Delete Note
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start">
                  Export
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Title input */}
        <Input
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl border-none shadow-none px-0 h-auto py-0 font-semibold placeholder:text-muted-foreground/60 bg-transparent"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 px-8 py-6">
        <Textarea
          placeholder="Write your notes here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[500px] border-none shadow-none resize-none text-base leading-7 bg-transparent placeholder:text-muted-foreground/60 p-0"
        />
      </div>

      {/* Status bar */}
      {note && (
        <div className="border-t border-border px-8 py-4 bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <span className="font-medium">
                Last saved: {new Intl.DateTimeFormat('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(note.updatedAt))}
              </span>
              
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{location}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">{content.length} characters</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}