"use client"

import { ChevronRight } from 'lucide-react';

/** Shared header for the right-sidebar widget cards: title + "View all ›". */
export function WidgetHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-black text-[15px]">{title}</h3>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-primary text-xs font-medium hover:underline"
        >
          View all
          <ChevronRight className="size-3.5" />
        </button>
      )}
    </div>
  );
}
