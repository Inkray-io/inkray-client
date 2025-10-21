export interface OnboardingStep {
  id: string
  label: string
  title: string
  description: string
  image: string
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    label: 'Features',
    title: 'Write. Publish. Own.',
    description: 'Publish essays, mint your work as collectibles, and build a community that holds stake in your ideas.',
    image: '/onboarding.png'
  },
  {
    id: 'ownership',
    label: 'Ownership',
    title: 'True Digital Ownership',
    description: 'Your content is permanently stored on the blockchain. You own it forever, not just a platform account.',
    image: '/onboarding.png'
  },
  {
    id: 'community',
    label: 'Community',
    title: 'Build Your Community',
    description: 'Readers can subscribe, tip, and collect your work as NFTs. Create lasting connections with your audience.',
    image: '/onboarding.png'
  }
]

export const ONBOARDING_CONFIG = {
  localStorageKey: 'inkray-onboarding-completed',
  steps: onboardingSteps
} as const