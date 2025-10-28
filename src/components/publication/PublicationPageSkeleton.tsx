import { Skeleton } from "@/components/ui/skeleton"
import { FeedPostSkeleton } from "@/components/feed/FeedPostSkeleton"
import { AppLayout } from "@/components/layout/AppLayout"

/**
 * Skeleton loader for the publication page
 * Displays a skeleton for the publication header and article feed
 */
export function PublicationPageSkeleton() {
  return (
    <AppLayout currentPage="publication" showRightSidebar={false}>
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Publication Header Skeleton */}
        <div>
          {/* Cover image skeleton */}
          <div className="relative h-40 sm:h-60 rounded-tl-2xl rounded-tr-2xl overflow-hidden">
            <Skeleton className="w-full h-full rounded-none" />

            {/* Avatar overlapping the cover */}
            <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-6 pb-2.5">
              <div className="flex items-end justify-between">
                <Skeleton className="w-20 h-20 sm:w-25 sm:h-25 rounded-full" />
                <Skeleton className="w-11 h-9 rounded-md" />
              </div>
            </div>
          </div>

          {/* Publication Info Section Skeleton */}
          <div className="px-5 pb-6 pt-6">
            {/* Header with name and buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-48 max-w-full" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex gap-3">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>

            {/* Subscriber Stats Skeleton */}
            <div className="flex gap-3 items-start mt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Articles Feed Skeleton */}
        <div className="pt-6 pb-10 border-t border-gray-200 space-y-6 px-4 sm:px-6">
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </div>
      </div>
    </AppLayout>
  )
}
