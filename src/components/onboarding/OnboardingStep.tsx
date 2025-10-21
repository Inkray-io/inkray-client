"use client"

import { type OnboardingStep } from "./onboarding-config"

interface OnboardingStepProps {
  step: OnboardingStep
  currentStep: number
  totalSteps: number
}

export function OnboardingStep({ step, currentStep, totalSteps }: OnboardingStepProps) {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      {/* Step indicator */}
      <div className="text-sm text-muted-foreground font-medium">
        {step.label}
      </div>

      {/* Image */}
      <div className="relative w-full max-w-md h-64 rounded-lg overflow-hidden">
        <img
          src={step.image}
          alt={step.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="space-y-3 max-w-sm">
        <h2 className="text-2xl font-semibold text-foreground">
          {step.title}
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Step dots indicator */}
      <div className="flex space-x-2 pt-4">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentStep
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  )
}