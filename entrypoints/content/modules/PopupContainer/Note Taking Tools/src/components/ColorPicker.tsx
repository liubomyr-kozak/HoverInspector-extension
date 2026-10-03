import { useState } from 'react';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
import type { ColorPalette } from '@entrypoints/shared/types/notes';

interface ColorPickerProps {
  color: string;
  // Note colors shared with Page Notes
  palettes: ColorPalette[];
  onChange: (color: string) => void;
}

export function ColorPicker({ color, palettes, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-3 mt-0 text-sm font-medium">Choose a color</h4>
        <div className="grid grid-cols-6 gap-2">
          {palettes.map((palette) => (
            <Button
              key={palette.id}
              className="w-8 h-8 p-0 rounded-full border-2 border-transparent hover:border-border"
              style={{ backgroundColor: palette.value }}
              onClick={() => onChange(palette.value)}
              variant="ghost"
              title={palette.name}
              aria-label={palette.name}
            >
              {color.toLowerCase() === palette.value.toLowerCase() && (
                <Check className="w-4 h-4 text-white drop-shadow" />
              )}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 mt-0 text-sm font-medium">Custom color</h4>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-8 rounded border border-border cursor-pointer"
          />
          <Button variant="outline" size="sm" onClick={() => onChange(customColor)} className="flex-1">
            Apply Custom Color
          </Button>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: color }} />
          <span className="text-sm text-muted-foreground">Current: {color}</span>
        </div>
      </div>
    </div>
  );
}
