'use client';

import { useState } from 'react';
import { Column } from '@/lib/types';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/Select';
import { Label } from '@/components/UI/Label';
import { Switch } from '@/components/UI/Switch';
import { toast } from 'react-hot-toast';
import { Palette, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

export interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  onColumnCreated: (column: Column) => void;
  existingColumns: Column[];
}

export function AddColumnModal({
  isOpen,
  onClose,
  boardId,
  onColumnCreated,
  existingColumns,
}: AddColumnModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [wipLimit, setWipLimit] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [position, setPosition] = useState<'left' | 'right' | 'after'>('right');
  const [referenceColumnId, setReferenceColumnId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = [
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', text: 'text-blue-500' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', text: 'text-green-500' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-500' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500' },
    { value: 'red', label: 'Red', bg: 'bg-red-500', text: 'text-red-500' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', text: 'text-purple-500' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500' },
    { value: 'gray', label: 'Gray', bg: 'bg-gray-500', text: 'text-gray-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          color,
          wipLimit: wipLimit ? parseInt(wipLimit) : undefined,
          isVisible,
          isLocked,
          position,
          referenceColumnId: referenceColumnId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create column');
      }

      const newColumn = await response.json();
      onColumnCreated(newColumn);
      
      toast.success('Column created successfully');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating column:', error);
      toast.error('Failed to create column');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setColor('blue');
    setWipLimit('');
    setIsVisible(true);
    setIsLocked(false);
    setPosition('right');
    setReferenceColumnId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Column"
      description="Create a new column for your Kanban board"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" required>
              Column Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., In Progress, Review, Done"
              autoFocus
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this column represents..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select color">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${colorOptions.find(c => c.value === color)?.bg}`} />
                      <span>{colorOptions.find(c => c.value === color)?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${option.bg}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="wipLimit">WIP Limit (Optional)</Label>
              <Input
                id="wipLimit"
                type="number"
                min="1"
                value={wipLimit}
                onChange={(e) => setWipLimit(e.target.value)}
                placeholder="e.g., 5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of tasks allowed in this column
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={(value: 'left' | 'right' | 'after') => setPosition(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left side (first column)</SelectItem>
                  <SelectItem value="right">Right side (last column)</SelectItem>
                  {existingColumns.length > 0 && (
                    <SelectItem value="after">After specific column</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {position === 'after' && existingColumns.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="referenceColumn">Reference Column</Label>
                <Select value={referenceColumnId} onValueChange={setReferenceColumnId}>
                  <SelectTrigger id="referenceColumn">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingColumns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colorOptions.find(c => c.value === column.color)?.bg || 'bg-gray-500'}`} />
                          <span>{column.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visible to team
                </Label>
                <p className="text-sm text-gray-500">
                  Column will be visible to all team members
                </p>
              </div>
              <Switch
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  Lock tasks
                </Label>
                <p className="text-sm text-gray-500">
                  Prevent moving tasks out of this column
                </p>
              </div>
              <Switch
                checked={isLocked}
                onCheckedChange={setIsLocked}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Column'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}