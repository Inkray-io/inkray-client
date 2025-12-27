export type OnboardingStepType = 'static' | 'topic-selection' | 'recommendations'

export interface OnboardingStep {
  id: string
  type: OnboardingStepType
  label: string
  title?: string
  description?: string
  image?: string
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'static',
    label: 'Features',
    title: 'Write. Publish. Own.',
    description: 'Publish essays, mint your work as collectibles, and build a community that holds stake in your ideas.',
    image: '/onboarding.png'
  },
  {
    id: 'ownership',
    type: 'static',
    label: 'Ownership',
    title: 'True Digital Ownership',
    description: 'Your content is permanently stored on the blockchain. You own it forever, not just a platform account.',
    image: '/onboarding.png'
  },
  {
    id: 'community',
    type: 'static',
    label: 'Community',
    title: 'Build Your Community',
    description: 'Readers can subscribe, tip, and collect your work as NFTs. Create lasting connections with your audience.',
    image: '/onboarding.png'
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
  }
]

export const ONBOARDING_CONFIG = {
  localStorageKey: 'inkray-onboarding-completed',
  steps: onboardingSteps,
  maxTopicSelections: 3,
} as const