import { Button } from './ui/button';
import { MapPin, Globe, X, Check, LayoutGrid } from 'lucide-react';
import type { NoteAttachment } from '../hooks/useReduxNotes';

interface LocationPickerProps {
  attachment: NoteAttachment;
  // Description of the current attachment (e.g. "example.com/page")
  location?: string;
  // The saved attachment the location describes
  savedAttachment?: NoteAttachment;
  onChange: (attachment: NoteAttachment) => void;
}

const OPTIONS: { value: NoteAttachment; label: string; description: string; icon: typeof MapPin }[] = [
  { value: 'page', label: 'This page', description: 'Sticky note on this page only', icon: MapPin },
  { value: 'site', label: 'This site', description: 'Sticky note on every page of this site', icon: LayoutGrid },
  { value: 'everywhere', label: 'Everywhere', description: 'Sticky note on every page of every site', icon: Globe },
  { value: 'none', label: 'Notes list only', description: 'Not shown on pages', icon: X },
];

/**
 * Chooses where the note is shown on web pages (stored as the note's page locations)
 */
export function LocationPicker({ attachment, location, savedAttachment, onChange }: LocationPickerProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium m-0">Show on</h4>
      {attachment === savedAttachment && attachment !== 'none' && location && (
        <p className="text-xs text-muted-foreground m-0 truncate" title={location}>
          Shown on {location}
        </p>
      )}
      <div className="space-y-1">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = attachment === option.value;
          return (
            <Button
              key={option.value}
              variant="ghost"
              onClick={() => onChange(option.value)}
              className={`w-full h-auto justify-start gap-3 py-2 ${isSelected ? 'bg-accent' : ''}`}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground font-normal whitespace-normal">{option.description}</div>
              </div>
              {isSelected && <Check className="h-4 w-4" />}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
