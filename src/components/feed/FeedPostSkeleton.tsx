import { Skeleton } from "@/components/ui/skeleton"

export function FeedPostSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6">
      {/* Author Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar skeleton */}
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-2">
            {/* Publication name skeleton */}
            <Skeleton className="h-4 w-32" />
            {/* Author info skeleton */}
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Support button skeleton */}
          <Skeleton className="h-9 w-20 rounded-lg" />
          {/* More button skeleton */}
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div>
          {/* Title skeleton */}
          <Skeleton className="h-6 w-3/4 mb-2" />
          {/* Metadata skeleton */}
          <Skeleton className="h-3 w-48 mb-3" />
          {/* Description skeleton - 3 lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Image skeleton */}
        <Skeleton className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[333px] rounded-lg" />

        {/* Read more skeleton */}
        <Skeleton className="h-4 w-20" />

        {/* Engagement bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like button skeleton */}
            <Skeleton className="h-8 w-12" />
            {/* Comment button skeleton */}
            <Skeleton className="h-8 w-12" />
            {/* Tip button skeleton */}
            <Skeleton className="h-8 w-16" />
            {/* Share buttons skeleton */}
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          {/* Views skeleton */}
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}
