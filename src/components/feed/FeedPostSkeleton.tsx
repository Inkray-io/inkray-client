import { Skeleton } from "@/components/ui/skeleton"

export function FeedPostSkeleton() {
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4">
      {/* Author Header Skeleton */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Avatar skeleton */}
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex flex-col gap-1.5">
            {/* Publication name skeleton */}
            <Skeleton className="h-3 w-24" />
            {/* Author info skeleton */}
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Follow button skeleton */}
          <Skeleton className="h-7 w-16 rounded-md" />
          {/* More button skeleton */}
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-2.5">
        <div>
          {/* Title skeleton */}
          <Skeleton className="h-4 w-3/4 mb-1" />
          {/* Metadata skeleton */}
          <Skeleton className="h-2.5 w-40 mb-1.5" />
          {/* Description skeleton - 2 lines */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>

        {/* Image skeleton */}
        <Skeleton className="w-full h-[140px] sm:h-[180px] md:h-[200px] rounded-lg" />

        {/* Read more skeleton */}
        <Skeleton className="h-3 w-16" />

        {/* Engagement bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Like button skeleton */}
            <Skeleton className="h-6 w-10" />
            {/* Comment button skeleton */}
            <Skeleton className="h-6 w-10" />
            {/* Tip button skeleton */}
            <Skeleton className="h-6 w-12" />
            {/* Share buttons skeleton */}
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          {/* Views skeleton */}
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}
