"use client"

import { HiShieldCheck, HiBanknotes, HiUserGroup } from "react-icons/hi2"
import { type OnboardingStep } from "./onboarding-config"

interface OnboardingStepProps {
  step: OnboardingStep
  currentStep: number
  totalSteps: number
}

// One glyph per welcome bullet, in order (ownership, earnings, audience)
const BULLET_ICONS = [HiShieldCheck, HiBanknotes, HiUserGroup]

export function OnboardingStep({ step, currentStep, totalSteps }: OnboardingStepProps) {
  return (
    <div className="flex flex-col items-center space-y-5 text-center">
      {/* Step indicator */}
      <div className="text-sm text-muted-foreground font-medium">
        {step.label}
      </div>

      {/* Image */}
      {step.image && (
        <div className="relative w-full max-w-md h-40 rounded-lg overflow-hidden">
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-semibold text-foreground">
          {step.title}
        </h2>
        {step.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.description}
          </p>
        )}
      </div>

      {/* Value-prop bullets (welcome step) */}
      {step.bullets && step.bullets.length > 0 && (
        <div className="w-full max-w-sm space-y-3 text-left">
          {step.bullets.map((bullet, i) => {
            const Icon = BULLET_ICONS[i % BULLET_ICONS.length]
            return (
              <div key={bullet.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{bullet.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {bullet.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Step dots indicator */}
      <div className="flex space-x-2 pt-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
