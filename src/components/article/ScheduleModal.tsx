'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Sun,
  Sunset,
  Calendar,
  CalendarClock,
  Loader2,
} from 'lucide-react';

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date) => void;
  isLoading?: boolean;
}

interface QuickOption {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  getDate: () => Date;
}

// Helper to get next occurrence of a weekday
function getNextWeekday(targetDay: number, hour: number, minute: number = 0): Date {
  const now = new Date();
  const result = new Date(now);
  const currentDay = now.getDay();

  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }

  result.setDate(now.getDate() + daysUntilTarget);
  result.setHours(hour, minute, 0, 0);
  return result;
}

// Helper to get tomorrow at a specific time
function getTomorrowAt(hour: number, minute: number = 0): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);
  return tomorrow;
}

// Helper to get time from now
function getTimeFromNow(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

// Format time for display - compact version
function formatScheduleTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format time for display - short version for cards
function formatShortTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get user's timezone abbreviation
function getTimezoneAbbr(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function ScheduleModal({
  open,
  onOpenChange,
  onSchedule,
  isLoading = false,
}: ScheduleModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const timezone = useMemo(() => getTimezoneAbbr(), []);

  const quickOptions: QuickOption[] = useMemo(() => [
    {
      id: 'in-1-hour',
      label: 'In 1 hour',
      sublabel: formatShortTime(getTimeFromNow(1)),
      icon: <Clock className="size-4" />,
      getDate: () => getTimeFromNow(1),
    },
    {
      id: 'tomorrow-morning',
      label: 'Tomorrow AM',
      sublabel: formatShortTime(getTomorrowAt(9)),
      icon: <Sun className="size-4" />,
      getDate: () => getTomorrowAt(9),
    },
    {
      id: 'tomorrow-evening',
      label: 'Tomorrow PM',
      sublabel: formatShortTime(getTomorrowAt(18)),
      icon: <Sunset className="size-4" />,
      getDate: () => getTomorrowAt(18),
    },
    {
      id: 'this-weekend',
      label: 'Weekend',
      sublabel: formatShortTime(getNextWeekday(6, 10)),
      icon: <Calendar className="size-4" />,
      getDate: () => getNextWeekday(6, 10),
    },
    {
      id: 'next-monday',
      label: 'Monday',
      sublabel: formatShortTime(getNextWeekday(1, 9)),
      icon: <CalendarClock className="size-4" />,
      getDate: () => getNextWeekday(1, 9),
    },
  ], []);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    // Clear custom fields when selecting a quick option
    setCustomDate('');
    setCustomTime('');
  };

  const handleCustomChange = (date: string, time: string) => {
    setCustomDate(date);
    setCustomTime(time);
    // Clear quick option selection when using custom
    if (date || time) {
      setSelectedOption(null);
    }
  };

  const handleConfirm = () => {
    let scheduledDate: Date;

    if (customDate && customTime) {
      scheduledDate = new Date(`${customDate}T${customTime}`);
    } else if (selectedOption) {
      const option = quickOptions.find(o => o.id === selectedOption);
      if (option) {
        scheduledDate = option.getDate();
      } else {
        return;
      }
    } else {
      return;
    }

    onSchedule(scheduledDate);
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedOption(null);
      setCustomDate('');
      setCustomTime('');
      onOpenChange(false);
    }
  };

  const isCustomSelected = customDate && customTime;
  const isValidSelection = selectedOption || isCustomSelected;

  // Get minimum date for custom picker (must be in the future)
  const minDate = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Get the selected date for preview
  const selectedDate = useMemo(() => {
    if (isCustomSelected) {
      return new Date(`${customDate}T${customTime}`);
    }
    if (selectedOption) {
      const option = quickOptions.find(o => o.id === selectedOption);
      return option?.getDate();
    }
    return null;
  }, [selectedOption, customDate, customTime, isCustomSelected, quickOptions]);

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : handleClose}>
      <DialogContent
        showCloseButton={!isLoading}
        className="sm:max-w-[400px] p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-transparent to-transparent" />
          <DialogHeader className="relative">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Schedule post
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Choose when your article goes live
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-5 pb-4">
          {/* Quick Options Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {quickOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isLoading}
                className={`
                  relative flex flex-col items-center p-3 rounded-xl border transition-all duration-150
                  ${selectedOption === option.id
                    ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-400/20'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/80'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className={`
                  flex items-center justify-center size-8 rounded-lg mb-1.5
                  ${selectedOption === option.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }
                  transition-colors duration-150
                `}>
                  {option.icon}
                </div>
                <span className={`
                  text-xs font-medium leading-tight text-center
                  ${selectedOption === option.id ? 'text-amber-900' : 'text-gray-700'}
                `}>
                  {option.label}
                </span>
                <span className={`
                  text-[10px] leading-tight text-center mt-0.5
                  ${selectedOption === option.id ? 'text-amber-600' : 'text-gray-400'}
                `}>
                  {option.sublabel}
                </span>
              </button>
            ))}
          </div>

          {/* Divider with "or" */}
          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or pick a time</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Custom Date/Time */}
          <div className={`
            grid grid-cols-2 gap-3 p-3 rounded-xl border transition-all duration-150
            ${isCustomSelected
              ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/20'
              : 'border-gray-100 bg-gray-50/50'
            }
          `}>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => handleCustomChange(e.target.value, customTime)}
                min={minDate}
                className={`
                  w-full px-2.5 py-2 text-sm border rounded-lg bg-white
                  focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                  transition-all
                  ${isCustomSelected ? 'border-amber-300' : 'border-gray-200'}
                `}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => handleCustomChange(customDate, e.target.value)}
                className={`
                  w-full px-2.5 py-2 text-sm border rounded-lg bg-white
                  focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                  transition-all
                  ${isCustomSelected ? 'border-amber-300' : 'border-gray-200'}
                `}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Selected time preview */}
          {selectedDate && (
            <div className="mt-3 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800">
                <span className="text-amber-600">Publishing:</span>{' '}
                <span className="font-medium">{formatScheduleTime(selectedDate)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/30">
          <p className="text-[10px] text-gray-400 mb-3 text-center">
            Times shown in {timezone}
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none text-sm h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !isValidSelection}
              className="flex-1 sm:flex-none min-w-[120px] text-sm h-9"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarClock className="size-3.5" />
                  Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
