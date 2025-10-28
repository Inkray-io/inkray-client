"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ArticleSkeletonLoaderProps {
  className?: string
}

export function ArticleSkeletonLoader({ className }: ArticleSkeletonLoaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Author Section Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar skeleton */}
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            {/* Author name skeleton */}
            <Skeleton className="h-4 w-24" />
            {/* Date and metadata skeleton */}
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Action buttons skeleton */}
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Title and Summary Section */}
      <div className="space-y-4">
        {/* Title skeleton - multiple lines for responsive title */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
        </div>

        {/* Summary skeleton - 2-3 lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Content Section Skeleton */}
      <div className="space-y-4">
        {/* Paragraph 1 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Paragraph 2 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Subheading */}
        <Skeleton className="h-6 w-2/3 mt-6" />

        {/* Paragraph 3 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Paragraph 4 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Subheading 2 */}
        <Skeleton className="h-6 w-1/2 mt-6" />

        {/* Paragraph 5 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  )
}
