export type OnboardingStepType = 'static' | 'topic-selection' | 'recommendations'

export interface OnboardingStepBullet {
  title: string
  description: string
}

export interface OnboardingStep {
  id: string
  type: OnboardingStepType
  label: string
  title?: string
  description?: string
  image?: string
  bullets?: OnboardingStepBullet[]
}

/**
 * Three steps, not five: one welcome (the pitch, condensed), then two steps
 * that actually set the account up (topics → follows). Getting to a personal
 * feed fast beats a longer tour — the persistent Getting Started checklist on
 * the feed carries the rest (profile, first reactions, first article).
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'static',
    label: 'Welcome to Inkray',
    title: 'Write. Publish. Own.',
    description: 'A publishing home where your words stay yours.',
    bullets: [
      {
        title: 'Permanent & unblockable',
        description: 'Your posts live on Sui and Walrus — no one can take them down.',
      },
      {
        title: 'Paid directly',
        description: 'Subscriptions, tips, and collectible articles land in your wallet.',
      },
      {
        title: 'Your audience, not a feed',
        description: 'Readers follow you, not an algorithm.',
      },
    ],
  },
  {
    id: 'topic-selection',
    type: 'topic-selection',
    label: 'Topics',
  },
  {
    id: 'recommendations',
    type: 'recommendations',
    label: 'Follow',
  },
]

export const ONBOARDING_CONFIG = {
  localStorageKey: 'inkray-onboarding-completed',
  steps: onboardingSteps,
  maxTopicSelections: 3,
} as const
