'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Calendar } from '@/components/ui/Calendar'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Calendar as CalendarIcon, Clock, X, Check } from 'lucide-react'
import { format, addDays, isToday, isTomorrow, isPast } from 'date-fns'

interface DueDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
  disabled?: boolean
  showTime?: boolean
}

export function DueDatePicker({ 
  value, 
  onChange, 
  className, 
  disabled,
  showTime = false 
}: DueDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(value || undefined)
  const [time, setTime] = useState<string>(value ? format(value, 'HH:mm') : '')
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      setDate(value)
      setTime(format(value, 'HH:mm'))
    } else {
      setDate(undefined)
      setTime('')
    }
  }, [value])

  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'Next Week', date: addDays(new Date(), 7) },
    { label: 'Next Month', date: addDays(new Date(), 30) },
  ]

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    
    if (selectedDate && showTime && time) {
      const [hours, minutes] = time.split(':').map(Number)
      selectedDate.setHours(hours || 0, minutes || 0)
    }
    
    if (selectedDate) {
      onChange(selectedDate)
      if (!showTime) {
        setIsOpen(false)
      }
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    
    if (date && newTime) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours || 0, minutes || 0)
      onChange(newDate)
    }
  }

  const handleClear = () => {
    setDate(undefined)
    setTime('')
    onChange(null)
    setIsOpen(false)
  }

  const handleApply = () => {
    if (date) {
      if (showTime && time) {
        const [hours, minutes] = time.split(':').map(Number)
        const newDate = new Date(date)
        newDate.setHours(hours || 0, minutes || 0)
        onChange(newDate)
      } else {
        onChange(date)
      }
    }
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (!value) return 'Set due date...'
    
    if (isToday(value)) return 'Today'
    if (isTomorrow(value)) return 'Tomorrow'
    
    return format(value, showTime ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy')
  }

  const getStatusColor = () => {
    if (!value) return 'default'
    
    if (isPast(value)) return 'destructive'
    if (isToday(value)) return 'warning'
    if (isTomorrow(value)) return 'warning'
    
    return 'success'
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start gap-2',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{getDisplayText()}</span>
            {value && (
              <Badge variant={getStatusColor()} className="ml-auto">
                {isPast(value) ? 'Overdue' : isToday(value) ? 'Today' : isTomorrow(value) ? 'Tomorrow' : 'Upcoming'}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {quickDates.map((quickDate) => (
                  <Button
                    key={quickDate.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateSelect(quickDate.date)}
                    className={cn(
                      'justify-start',
                      date && isToday(quickDate.date) === isToday(date) && 'bg-accent'
                    )}
                  >
                    {quickDate.label}
                  </Button>
                ))}
              </div>

              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                className="rounded-md border"
              />

              {showTime && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <Input
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={!value}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  disabled={!date}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}