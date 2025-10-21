"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { OnboardingStep } from "./OnboardingStep"
import { useOnboarding } from "./useOnboarding"

export function OnboardingModal() {
  const {
    isOpen,
    currentStep,
    currentStepData,
    totalSteps,
    isLastStep,
    nextStep,
    skipOnboarding,
    isHydrated
  } = useOnboarding()

  // Don't render until hydrated to prevent SSR mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="max-w-lg w-full mx-auto p-8"
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
              <OnboardingStep
                step={currentStepData}
                currentStep={currentStep}
                totalSteps={totalSteps}
              />
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
            className="min-w-20"
          >
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}