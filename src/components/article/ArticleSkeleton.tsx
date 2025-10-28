import { Skeleton } from "@/components/ui/skeleton"

export function ArticleSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Article Author Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar skeleton */}
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              {/* Author name skeleton */}
              <Skeleton className="h-4 w-24" />
              {/* Date and read time skeleton */}
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Action buttons skeleton */}
            <Skeleton className="w-9 h-9 rounded-md" />
            <Skeleton className="w-9 h-9 rounded-md" />
            <Skeleton className="w-9 h-9 rounded-md" />
            <Skeleton className="w-20 h-9 rounded-lg" />
          </div>
        </div>

        {/* Article Metadata Skeleton */}
        <div className="space-y-4">
          {/* Title skeleton - 2 lines */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>

          {/* Summary skeleton - 3 lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-6">
          {/* Content skeleton - multiple paragraphs */}
          <div className="space-y-4">
            {/* First paragraph */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Second paragraph */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Image placeholder */}
            <Skeleton className="h-64 w-full rounded-lg" />

            {/* Third paragraph */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
