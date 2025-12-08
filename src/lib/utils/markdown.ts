// Utility function to extract plain text from markdown
export function getPlainTextFromMarkdown(markdown: string): string {
  if (!markdown) return ''

  return markdown
      // Remove headers (# ## ###)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic (**text** *text* __text__ _text_)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove links [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove inline code `code`
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks ```code```
      .replace(/```[\s\S]*?```/g, '')
      // Remove blockquotes > text
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules ---
      .replace(/^---+$/gm, '')
      // Remove extra whitespace and newlines
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      .trim()
}
