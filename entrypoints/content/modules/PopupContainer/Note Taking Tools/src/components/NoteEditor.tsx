import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Palette,
  MapPin,
  Globe,
  MoreHorizontal,
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { LocationPicker } from './LocationPicker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { ColorPalette, NoteGroup } from '@entrypoints/shared/types/notes';
import type { Note, NoteAttachment, NoteUpdates } from '../hooks/useReduxNotes';

interface NoteEditorProps {
  note: Note;
  // The note has not been saved yet (it is created once it has some text)
  isDraft: boolean;
  groups: NoteGroup[];
  palettes: ColorPalette[];
  onSave: (updates: NoteUpdates) => void;
  onDelete: () => void;
  onClose: () => void;
}

// Delay before typed changes are saved
const AUTO_SAVE_DELAY = 800;

const downloadFile = (fileName: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const toFileName = (title: string) => (title.trim() || 'note').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'note';

/**
 * Editor for one note. Mounted per note (keyed by the parent), so it owns its fields and
 * saves them automatically.
 */
export function NoteEditor({ note, isDraft, groups, palettes, onSave, onDelete, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color);
  const [attachment, setAttachment] = useState<NoteAttachment>(note.attachment);
  const [groupId, setGroupId] = useState(note.groupId || '');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedRef = useRef({ title, content, color, attachment, groupId });
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const save = () => {
    const current = { title, content, color, attachment, groupId };
    const last = lastSavedRef.current;
    if (
      current.title === last.title &&
      current.content === last.content &&
      current.color === last.color &&
      current.attachment === last.attachment &&
      current.groupId === last.groupId
    ) {
      return;
    }
    // Drafts are only created once they have some text
    if (isDraft && !title.trim() && !content.trim()) return;

    lastSavedRef.current = current;
    onSaveRef.current({ ...current, groupId: groupId || null });
  };
  const saveRef = useRef(save);
  saveRef.current = save;

  // Auto-save after changes
  useEffect(() => {
    const timer = setTimeout(() => saveRef.current(), AUTO_SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [title, content, color, attachment, groupId]);

  // Save what is left when the editor closes
  useEffect(() => () => saveRef.current(), []);

  const formatText = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

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
        formattedText = selectedText
          .split('\n')
          .map((line) => `• ${line}`)
          .join('\n');
        break;
      case 'orderedList':
        formattedText = selectedText
          .split('\n')
          .map((line, i) => `${i + 1}. ${line}`)
          .join('\n');
        break;
    }

    setContent(content.substring(0, start) + formattedText + content.substring(end));

    // Keep the cursor after the inserted text
    requestAnimationFrame(() => {
      textarea.focus();
      const position = start + formattedText.length;
      textarea.setSelectionRange(position, position);
    });
  };

  const categoryName = groups.find((group) => group.id === groupId)?.name;

  const exportMarkdown = () => {
    const lines = [`# ${title || 'Untitled'}`, ''];
    if (categoryName) lines.push(`Category: ${categoryName}`);
    if (note.location && attachment !== 'none') lines.push(`Location: ${note.location}`);
    lines.push(`Updated: ${new Date(note.updatedAt).toISOString()}`, '', content);
    downloadFile(`${toFileName(title)}.md`, lines.join('\n'), 'text/markdown');
    setIsMoreOpen(false);
  };

  const exportJson = () => {
    const data = {
      title,
      content,
      color,
      category: categoryName || null,
      location: attachment === 'none' ? null : note.location || null,
      createdAt: new Date(note.createdAt).toISOString(),
      updatedAt: new Date(note.updatedAt).toISOString(),
    };
    downloadFile(`${toFileName(title)}.json`, JSON.stringify(data, null, 2), 'application/json');
    setIsMoreOpen(false);
  };

  const toolbarButton = (format: string, label: string, Icon: typeof Bold) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => formatText(format)}
      className="h-7 w-6 p-0 hover:bg-muted"
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border pb-3 space-y-3">
        <div className="flex items-center flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              saveRef.current();
              onClose();
            }}
            className="h-7 w-6 p-0 hover:bg-muted"
            title="Back to notes"
            aria-label="Back to notes"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {toolbarButton('bold', 'Bold', Bold)}
          {toolbarButton('italic', 'Italic', Italic)}
          {toolbarButton('underline', 'Underline', Underline)}
          {toolbarButton('link', 'Link', Link)}

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {toolbarButton('list', 'Bulleted list', List)}
          {toolbarButton('orderedList', 'Numbered list', ListOrdered)}

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-6 p-0 hover:bg-muted" title="Color" aria-label="Color">
                <Palette className="h-4 w-4" style={{ color }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <ColorPicker color={color} palettes={palettes} onChange={setColor} />
            </PopoverContent>
          </Popover>

          {/* Page attachment */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 w-6 p-0 hover:bg-muted ${attachment !== 'none' ? 'text-primary' : ''}`}
                title="Show on pages"
                aria-label="Show on pages"
              >
                {attachment === 'everywhere' ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3">
              <LocationPicker attachment={attachment} location={note.location} savedAttachment={note.attachment} onChange={setAttachment} />
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          <Popover
            open={isMoreOpen}
            onOpenChange={(open) => {
              setIsMoreOpen(open);
              if (!open) setConfirmDelete(false);
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-6 p-0 hover:bg-muted" title="More" aria-label="More">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" onClick={exportMarkdown}>
                  Export as Markdown
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={exportJson}>
                  Export as JSON
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    if (isDraft || confirmDelete) {
                      setIsMoreOpen(false);
                      // Nothing left to save for a deleted note
                      lastSavedRef.current = { title, content, color, attachment, groupId };
                      onDelete();
                    } else {
                      setConfirmDelete(true);
                    }
                  }}
                >
                  {isDraft ? 'Discard Note' : confirmDelete ? 'Click to confirm' : 'Delete Note'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Title and category */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-0 text-lg border-none shadow-none px-1 -ml-1 h-auto py-0 font-semibold placeholder:text-muted-foreground/60 bg-transparent"
            autoFocus={isDraft}
          />
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="max-w-[120px] h-7 rounded-md border border-border bg-background px-1.5 text-xs text-foreground"
            aria-label="Category"
            title="Category"
          >
            <option value="">No category</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 py-3 flex">
        <Textarea
          ref={textareaRef}
          placeholder="Write your notes here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 min-h-[120px] border-none shadow-none resize-none text-sm leading-6 bg-transparent placeholder:text-muted-foreground/60 p-0"
        />
      </div>

      {/* Status bar */}
      <div className="border-t border-border pt-2">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-medium truncate">
            {isDraft
              ? 'Not saved yet'
              : `Last saved: ${new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(note.updatedAt))}`}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color }} />
            <span className="font-medium">{content.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
