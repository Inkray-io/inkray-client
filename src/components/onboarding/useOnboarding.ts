"use client"

import { useState, useEffect, useCallback } from "react"
import { ONBOARDING_CONFIG, type OnboardingStep } from "./onboarding-config"

interface UseOnboardingReturn {
  isOpen: boolean
  currentStep: number
  currentStepData: OnboardingStep | null
  totalSteps: number
  isLastStep: boolean
  nextStep: () => void
  skipOnboarding: () => void
  closeOnboarding: () => void
  isHydrated: boolean
}

function getOnboardingStatus(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  
  try {
    return localStorage.getItem(ONBOARDING_CONFIG.localStorageKey) === 'true'
  } catch (error) {
    console.warn("Failed to read onboarding status from localStorage:", error)
    return false
  }
}

function setOnboardingCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_CONFIG.localStorageKey, 'true')
  } catch (error) {
    console.warn("Failed to save onboarding status to localStorage:", error)
  }
}

export function useOnboarding(): UseOnboardingReturn {
  const [isCompleted, setIsCompleted] = useState<boolean>(() => getOnboardingStatus())
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isHydrated, setIsHydrated] = useState(false)
  
  const steps = ONBOARDING_CONFIG.steps
  const totalSteps = steps.length
  const isLastStep = currentStep === totalSteps - 1
  const currentStepData = steps[currentStep] || null
  
  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Recheck localStorage after hydration to ensure correct state
  useEffect(() => {
    if (isHydrated) {
      setIsCompleted(getOnboardingStatus())
    }
  }, [isHydrated])

  const nextStep = useCallback(() => {
    if (isLastStep) {
      // Complete onboarding if on last step
      setOnboardingCompleted()
      setIsCompleted(true)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [isLastStep])

  const skipOnboarding = useCallback(() => {
    setOnboardingCompleted()
    setIsCompleted(true)
  }, [])

  const closeOnboarding = useCallback(() => {
    setOnboardingCompleted()
    setIsCompleted(true)
  }, [])

  return {
    isOpen: isHydrated && !isCompleted,
    currentStep,
    currentStepData,
    totalSteps,
    isLastStep,
    nextStep,
    skipOnboarding,
    closeOnboarding,
    isHydrated
  }
}