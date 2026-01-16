"use client"

import { usePublication } from "@/hooks/usePublication"
import { PublicationEditModal } from "./PublicationEditModal"
import { usePublicationCompletion } from "./usePublicationCompletion"

export function PublicationCompletionPrompt() {
  const { shouldShow, complete, skip, publicationId, isHydrated } = usePublicationCompletion()

  // Fetch full publication data
  const { publication, refresh, isLoading } = usePublication(publicationId || '')

  // Don't render until hydrated to prevent SSR mismatch
  if (!isHydrated) {
    return null
  }

  // Don't show if conditions aren't met
  if (!shouldShow || !publicationId) {
    return null
  }

  // Wait for publication data to load
  if (isLoading || !publication) {
    return null
  }

  const handleSuccess = () => {
    refresh() // Refresh publication data
    complete() // Mark prompt as completed
  }

  return (
    <PublicationEditModal
      isOpen={shouldShow}
      onClose={skip}
      publication={publication}
      onSuccess={handleSuccess}
      title="Complete Your Publication"
      subtitle="Add details to help readers discover your publication."
      showSkipButton
      onSkip={skip}
    />
  )
}
