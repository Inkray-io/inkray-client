import { Skeleton } from "@/components/ui/skeleton"

export function RelatedArticleSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden h-full flex flex-col">
      {/* Cover Image skeleton */}
      <Skeleton className="aspect-16/10 w-full rounded-none" />

      {/* Content skeleton */}
      <div className="p-3 flex flex-col flex-1">
        {/* Title skeleton */}
        <div className="space-y-1.5 mb-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Meta skeleton - pushed to bottom */}
        <div className="mt-auto">
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}
