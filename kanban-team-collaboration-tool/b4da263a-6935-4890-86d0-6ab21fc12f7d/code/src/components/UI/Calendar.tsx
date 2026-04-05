'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/UI/Button';

export interface CalendarProps {
  className?: string;
  classNames?: {
    months?: string;
    month?: string;
    caption?: string;
    caption_label?: string;
    nav?: string;
    nav_button?: string;
    nav_button_previous?: string;
    nav_button_next?: string;
    table?: string;
    head_row?: string;
    head_cell?: string;
    row?: string;
    cell?: string;
    day?: string;
    day_selected?: string;
    day_today?: string;
    day_outside?: string;
    day_disabled?: string;
    day_range_middle?: string;
    day_hidden?: string;
  };
  showOutsideDays?: boolean;
  mode?: 'single' | 'range' | 'multiple';
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  fixedWeeks?: boolean;
  fromDate?: Date;
  toDate?: Date;
  locale?: Locale;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function areDatesEqual(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date: Date) {
  const today = new Date();
  return areDatesEqual(date, today);
}

function isDateDisabled(date: Date, disabled?: (date: Date) => boolean) {
  if (!disabled) return false;
  return disabled(date);
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode = 'single',
  selected,
  onSelect,
  disabled,
  initialFocus = false,
  fixedWeeks = false,
  fromDate,
  toDate,
  locale,
  ...props
}: CalendarProps & React.HTMLAttributes<HTMLDivElement>) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear());

  const today = new Date();

  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(selected.getMonth());
      setCurrentYear(selected.getFullYear());
    }
  }, [selected]);

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date, disabled)) return;
    
    if (mode === 'single') {
      if (selected && areDatesEqual(date, selected)) {
        onSelect?.(undefined);
      } else {
        onSelect?.(date);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  // Add days from previous month
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
    currentWeek.push(date);
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    currentWeek.push(date);
    
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  }

  // Add days from next month to complete the last week
  if (currentWeek.length > 0) {
    let nextMonthDay = 1;
    while (currentWeek.length < 7) {
      const date = new Date(currentYear, currentMonth + 1, nextMonthDay);
      currentWeek.push(date);
      nextMonthDay++;
    }
    weeks.push([...currentWeek]);
  }

  // Add extra weeks if fixedWeeks is true
  if (fixedWeeks && weeks.length < 6) {
    let lastDate = weeks[weeks.length - 1][6];
    while (weeks.length < 6) {
      const newWeek: Date[] = [];
      for (let i = 0; i < 7; i++) {
        lastDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1);
        newWeek.push(lastDate);
      }
      weeks.push(newWeek);
    }
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'h-7 w-7 p-0 opacity-50 hover:opacity-100'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </button>
          
          <div className="text-sm font-medium">
            {monthNames[currentMonth]} {currentYear}
          </div>
          
          <button
            type="button"
            onClick={handleNextMonth}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'h-7 w-7 p-0 opacity-50 hover:opacity-100'
            )}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-muted-foreground text-center text-xs font-medium"
            >
              {day}
            </div>
          ))}
          
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((date, dayIndex) => {
                const isCurrentMonth = date.getMonth() === currentMonth;
                const isSelected = selected && areDatesEqual(date, selected);
                const isDisabled = isDateDisabled(date, disabled);
                const isTodayDate = isToday(date);
                
                return (
                  <button
                    key={dayIndex}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    disabled={isDisabled}
                    className={cn(
                      'relative h-9 w-9 rounded-md text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      !isCurrentMonth && 'text-muted-foreground opacity-50',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                      isTodayDate && !isSelected && 'border border-primary',
                      isDisabled && 'pointer-events-none opacity-50',
                      'flex items-center justify-center'
                    )}
                  >
                    {date.getDate()}
                    {isTodayDate && !isSelected && (
                      <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}