"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { OnboardingStep } from "./OnboardingStep"
import { TopicSelector } from "./TopicSelector"
import { PublicationRecommendations } from "./PublicationRecommendations"
import { useOnboarding } from "./useOnboarding"
import { useTopics } from "@/hooks/useTopics"
import { useRecommendedPublications } from "@/hooks/useRecommendedPublications"
import { ONBOARDING_CONFIG } from "./onboarding-config"

export function OnboardingModal() {
  const {
    isOpen,
    currentStep,
    currentStepData,
    totalSteps,
    isLastStep,
    nextStep,
    skipOnboarding,
    isHydrated,
    selectedTopics,
    setSelectedTopics,
    canContinue,
  } = useOnboarding()

  const { topics, isLoading: topicsLoading } = useTopics()
  const {
    publications,
    isFallback,
    isLoading: recommendationsLoading,
    fetchRecommendations,
  } = useRecommendedPublications()

  // Fetch recommendations when entering recommendations step
  useEffect(() => {
    if (currentStepData?.type === "recommendations" && selectedTopics.length > 0) {
      fetchRecommendations(selectedTopics, 10)
    }
  }, [currentStepData?.type, selectedTopics, fetchRecommendations])

  // Don't render until hydrated to prevent SSR mismatch
  if (!isHydrated) {
    return null
  }

  const renderStepContent = () => {
    if (!currentStepData) return null

    switch (currentStepData.type) {
      case "static":
        return (
          <OnboardingStep
            step={currentStepData}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        )
      case "topic-selection":
        return (
          <TopicSelector
            topics={topics}
            selectedTopics={selectedTopics}
            onSelectionChange={setSelectedTopics}
            maxSelections={ONBOARDING_CONFIG.maxTopicSelections}
            isLoading={topicsLoading}
          />
        )
      case "recommendations":
        return (
          <PublicationRecommendations
            publications={publications}
            isFallback={isFallback}
            isLoading={recommendationsLoading}
          />
        )
      default:
        return null
    }
  }

  const getButtonText = () => {
    if (isLastStep) return "Get Started"
    if (currentStepData?.type === "topic-selection") return "Continue"
    return "Next"
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-lg w-full mx-auto p-8 max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {currentStepData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderStepContent()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t">
          <Button
            variant="ghost"
            onClick={skipOnboarding}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canContinue}
            className="min-w-24"
          >
            {getButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}