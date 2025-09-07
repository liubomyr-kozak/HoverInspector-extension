import { useState } from 'react';
import { Button } from './ui/button';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const predefinedColors = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6b7280', // Gray
  '#1f2937', // Dark Gray
  '#7c3aed', // Violet
  '#0891b2', // Light Blue
  '#dc2626', // Dark Red
  '#059669', // Dark Green
  '#d97706', // Dark Yellow
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-3">Choose a color</h4>
        <div className="grid grid-cols-4 gap-2">
          {predefinedColors.map((presetColor) => (
            <Button
              key={presetColor}
              className="w-8 h-8 p-0 rounded-full border-2 border-transparent hover:border-border"
              style={{ backgroundColor: presetColor }}
              onClick={() => onChange(presetColor)}
              variant="ghost"
            >
              {color === presetColor && (
                <Check className="w-4 h-4 text-white drop-shadow" />
              )}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3">Custom color</h4>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-8 rounded border border-border cursor-pointer"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(customColor)}
            className="flex-1"
          >
            Apply Custom Color
          </Button>
        </div>
      </div>

      <div className="pt-2 border-t">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border border-border" 
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-muted-foreground">Current: {color}</span>
        </div>
      </div>
    </div>
  );
}