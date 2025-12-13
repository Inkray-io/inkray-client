/**
 * Suggested prompts for the chat interface
 */

export const suggestedPrompts = [
  {
    label: "What's new on Sui?",
    prompt: "What's new on Sui?",
  },
  {
    label: "What is Move?",
    prompt: "What is Move?",
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
