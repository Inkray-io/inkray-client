/**
 * Suggested prompts for the chat interface
 */

export const suggestedPrompts = [
  {
    label: "Create publication",
    prompt: "How do I create a publication on Inkray?",
  },
  {
    label: "Walrus storage",
    prompt: "What is Walrus storage and how does it work?",
  },
  {
    label: "Monetization",
    prompt: "How does article monetization work on Inkray?",
  },
  {
    label: "NFT mints",
    prompt: "What are NFT mints and how do readers collect articles?",
  },
  {
    label: "Connect wallet",
    prompt: "How do I connect my Sui wallet to Inkray?",
  },
  {
    label: "Content gating",
    prompt: "How do I gate my articles for paying subscribers?",
  },
];

/**
 * Get random suggested prompts
 * @param count Number of prompts to return
 */
export function getRandomPrompts(count: number = 3): typeof suggestedPrompts {
  const shuffled = [...suggestedPrompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
