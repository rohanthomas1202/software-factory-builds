'use client';

import React, { useState } from 'react';
import { Check, Clock, ChefHat, AlertCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Instruction {
  id: string;
  step: number;
  description: string;
  time?: number; // in minutes
  tips?: string[];
}

interface InstructionListProps {
  instructions: Instruction[];
  showTimers?: boolean;
  showCheckboxes?: boolean;
  className?: string;
}

export function InstructionList({
  instructions,
  showTimers = false,
  showCheckboxes = false,
  className,
}: InstructionListProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [activeTimers, setActiveTimers] = useState<Map<number, number>>(new Map());

  const handleStepCheck = (step: number) => {
    const newChecked = new Set(checkedSteps);
    if (newChecked.has(step)) {
      newChecked.delete(step);
    } else {
      newChecked.add(step);
    }
    setCheckedSteps(newChecked);
  };

  const startTimer = (step: number, duration: number) => {
    if (activeTimers.has(step)) return;

    const endTime = Date.now() + duration * 60 * 1000;
    setActiveTimers(new Map(activeTimers.set(step, endTime)));

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        clearInterval(timer);
        setActiveTimers(prev => {
          const newMap = new Map(prev);
          newMap.delete(step);
          return newMap;
        });

        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Timer Complete!', {
            body: `Step ${step} timer is complete.`,
            icon: '/favicon.ico',
          });
        }
      }
    }, 1000);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getRemainingTime = (endTime: number): string => {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.ceil(remaining / (60 * 1000));
    return formatTime(minutes);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <span className="font-medium text-gray-900 dark:text-white">Cooking Instructions</span>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
          {instructions.length} steps
        </Badge>
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        {instructions.map((instruction) => {
          const isChecked = checkedSteps.has(instruction.step);
          const timerEndTime = activeTimers.get(instruction.step);

          return (
            <div
              key={instruction.id}
              className={cn(
                'relative p-4 rounded-xl border transition-all',
                isChecked
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 hover:border-primary-200 dark:hover:border-primary-800'
              )}
            >
              {/* Step Number */}
              <div className="absolute -left-2 -top-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2',
                  isChecked
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-primary-500 text-primary-600 dark:bg-gray-800 dark:border-primary-400 dark:text-primary-400'
                )}>
                  {instruction.step}
                </div>
              </div>

              <div className="ml-6">
                {/* Description */}
                <p className={cn(
                  'text-gray-900 dark:text-white',
                  isChecked && 'line-through text-gray-500 dark:text-gray-400'
                )}>
                  {instruction.description}
                </p>

                {/* Time and Actions */}
                <div className="flex items-center justify-between mt-3">
                  {instruction.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(instruction.time)}
                      </span>
                      {showTimers && instruction.time > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startTimer(instruction.step, instruction.time!)}
                          disabled={!!timerEndTime}
                          className="text-xs"
                        >
                          <Timer className="w-3 h-3 mr-1" />
                          {timerEndTime ? getRemainingTime(timerEndTime) : 'Start Timer'}
                        </Button>
                      )}
                    </div>
                  )}

                  {showCheckboxes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStepCheck(instruction.step)}
                      className={cn(
                        'flex items-center gap-1',
                        isChecked && 'text-green-600 dark:text-green-400'
                      )}
                    >
                      <Check className="w-4 h-4" />
                      {isChecked ? 'Completed' : 'Mark Complete'}
                    </Button>
                  )}
                </div>

                {/* Tips */}
                {instruction.tips && instruction.tips.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Chef's Tips:
                        </span>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          {instruction.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span className="text-primary-500">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      {showCheckboxes && checkedSteps.size > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900 dark:text-white">Progress</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {checkedSteps.size} of {instructions.length} steps completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(checkedSteps.size / instructions.length) * 100}%` }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => setCheckedSteps(new Set())}
          >
            Reset Progress
          </Button>
        </div>
      )}
    </div>
  );
}