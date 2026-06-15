'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface LabelItem {
  name: string;
  color: string;
}

interface LabelPickerProps {
  labels: LabelItem[];
  onChange: (labels: LabelItem[]) => void;
}

const COLORS = [
  '#7c3aed', '#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#ec4899',
];

export default function LabelPicker({ labels, onChange }: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [labelName, setLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleAdd = () => {
    const name = labelName.trim();
    if (!name) return;
    onChange([...labels, { name, color: selectedColor }]);
    setLabelName('');
    setSelectedColor(COLORS[0]);
    setOpen(false);
  };

  const handleRemove = (index: number) => {
    onChange(labels.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Labels</h3>
      <div className="flex flex-wrap gap-1">
        {labels.map((label, index) => (
          <Badge
            key={index}
            style={{ backgroundColor: label.color, color: '#fff' }}
            className="flex items-center gap-1 pr-1"
          >
            {label.name}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="ml-0.5 rounded-full hover:bg-black/20"
              aria-label={`Remove label ${label.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="w-6 h-6" type="button">
              <Plus className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-3">
              <p className="text-sm font-medium">Add label</p>
              <Input
                placeholder="Label name..."
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <div className="flex items-center gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
              <Button
                type="button"
                onClick={handleAdd}
                className="w-full"
                disabled={!labelName.trim()}
              >
                Add
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
