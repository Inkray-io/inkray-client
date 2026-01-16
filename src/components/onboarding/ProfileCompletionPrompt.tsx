"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"
import { ProfileEditModal } from "@/components/profile/ProfileEditModal"
import { useProfileCompletion } from "./useProfileCompletion"

export function ProfileCompletionPrompt() {
  const { account, isAuthenticated } = useAuth()
  const { shouldShow, complete, skip, isHydrated } = useProfileCompletion()

  // Fetch full profile data (includes description, skills, socialAccounts)
  const { profile, refresh } = useProfile(account?.publicKey)

  // Don't render until hydrated to prevent SSR mismatch
  if (!isHydrated) {
    return null
  }

  // Don't show if user is not authenticated
  if (!isAuthenticated || !account) {
    return null
  }

  const handleSuccess = () => {
    refresh() // Refresh profile data
    complete() // Mark prompt as completed
  }

  return (
    <ProfileEditModal
      isOpen={shouldShow}
      onClose={skip}
      profile={profile}
      onSuccess={handleSuccess}
      title="Complete Your Profile"
      subtitle="Help others discover you by adding some details to your profile."
      showSkipButton
      onSkip={skip}
    />
  )
}
