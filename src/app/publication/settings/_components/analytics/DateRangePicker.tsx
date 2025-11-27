"use client";

import { useState, useEffect, useRef } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { HiChevronLeft, HiChevronRight, HiXMark } from "react-icons/hi2";
import "react-day-picker/style.css";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<DateRange | undefined>(
    startDate && endDate ? { from: startDate, to: endDate } : undefined
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selected?.from && selected?.to) {
      onRangeChange(selected.from, selected.to);
    }
  }, [selected, onRangeChange]);

  const displayText = selected?.from
    ? selected.to
      ? `${format(selected.from, "MMM d, yyyy")} - ${format(selected.to, "MMM d, yyyy")}`
      : format(selected.from, "MMM d, yyyy")
    : "Select date range";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-all duration-200",
          "bg-background hover:bg-muted/50",
          isOpen
            ? "border-foreground/20 ring-2 ring-foreground/10"
            : "border-border"
        )}
      >
        <span className={cn(
          "transition-colors",
          selected?.from ? "text-foreground" : "text-muted-foreground"
        )}>
          {displayText}
        </span>
        {selected?.from && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelected(undefined);
              onRangeChange(undefined, undefined);
            }}
            className="ml-1 p-0.5 rounded hover:bg-muted transition-colors"
          >
            <HiXMark className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-2 z-50",
            "bg-background border border-border rounded-xl shadow-xl",
            "p-4 animate-in fade-in-0 zoom-in-95 duration-200"
          )}
        >
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={setSelected}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            showOutsideDays
            classNames={{
              root: "text-foreground",
              months: "flex flex-col sm:flex-row gap-4",
              month: "space-y-4",
              month_caption: "flex justify-center items-center h-9",
              caption_label: "text-sm font-semibold text-foreground",
              nav: "flex items-center gap-1",
              button_previous: cn(
                "absolute left-1 top-0",
                "size-8 flex items-center justify-center rounded-md",
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              ),
              button_next: cn(
                "absolute right-1 top-0",
                "size-8 flex items-center justify-center rounded-md",
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              ),
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "w-9 text-xs font-medium text-muted-foreground text-center",
              week: "flex mt-1",
              day: cn(
                "size-9 text-sm p-0 relative",
                "flex items-center justify-center",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              ),
              day_button: cn(
                "size-9 rounded-md transition-colors",
                "hover:bg-muted"
              ),
              selected: "bg-foreground text-background hover:bg-foreground/90 rounded-md",
              today: "bg-muted font-semibold",
              outside: "text-muted-foreground/50",
              disabled: "text-muted-foreground/30 cursor-not-allowed",
              range_start: "rounded-l-md rounded-r-none",
              range_end: "rounded-r-md rounded-l-none",
              range_middle: "rounded-none bg-muted/50",
              hidden: "invisible",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <HiChevronLeft className="size-4" />
                ) : (
                  <HiChevronRight className="size-4" />
                ),
            }}
          />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {selected?.from && selected?.to && (
                <>
                  {Math.ceil(
                    (selected.to.getTime() - selected.from.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{" "}
                  days selected
                </>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
