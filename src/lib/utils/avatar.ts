/**
 * Avatar utilities for database avatar handling and fallback text generation
 */

/**
 * Avatar size configurations
 */
export const AVATAR_SIZES = {
  xs: { width: 24, height: 24 },
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 64, height: 64 },
  xl: { width: 100, height: 100 },
  '2xl': { width: 96, height: 96 },
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;

/**
 * Gradient color combinations for deterministic avatar fallbacks
 */
const GRADIENT_COMBINATIONS = [
  'from-blue-400 to-purple-500',
  'from-green-400 to-teal-500', 
  'from-orange-400 to-pink-500',
  'from-purple-400 to-blue-500',
  'from-teal-400 to-green-500',
  'from-pink-400 to-orange-500',
  'from-red-400 to-purple-500',
  'from-blue-400 to-green-500',
  'from-indigo-400 to-purple-500',
  'from-emerald-400 to-cyan-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-blue-500',
] as const;

/**
 * Generate a simple hash from a string for deterministic color selection
 * 
 * @param text - Input text to hash
 * @returns Hash number
 */
function simpleHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate deterministic gradient classes based on input text
 * 
 * @param text - Name or address to generate gradient from
 * @returns Tailwind gradient classes
 */
export function generateGradientFromText(text: string): string {
  if (!text || text.trim().length === 0) {
    return GRADIENT_COMBINATIONS[0]; // Default gradient
  }
  
  const hash = simpleHash(text.toLowerCase().trim());
  const index = hash % GRADIENT_COMBINATIONS.length;
  return GRADIENT_COMBINATIONS[index];
}


/**
 * Extract initials from a name for text-based fallbacks
 * 
 * @param name - Full name or display name
 * @returns Up to 2 initials in uppercase
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '??';
  }

  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get fallback text for an address or identifier
 * For addresses, uses only the last 2 characters
 * 
 * @param identifier - Address or identifier
 * @returns Shortened, readable fallback text
 */
export function getAddressFallback(identifier: string): string {
  if (!identifier || identifier.length < 2) {
    return identifier.toUpperCase();
  }
  
  // For addresses, use only the last 2 characters
  return identifier.slice(-2).toUpperCase();
}

/**
 * Check if a string looks like an address (starts with 0x)
 * 
 * @param text - Text to check
 * @returns True if text looks like an address
 */
function isAddress(text: string): boolean {
  return Boolean(text && text.startsWith('0x') && text.length > 10);
}

/**
 * Create a simplified avatar configuration
 * Only uses database avatar or returns null (Avatar component handles fallbacks)
 * 
 * @param options - Avatar configuration options
 * @returns Avatar configuration object
 */
export function createAvatarConfig(options: {
  identifier: string;
  name?: string;
  customAvatar?: string | null;
  size?: AvatarSize;
  type?: 'user' | 'publication' | 'generic';
}): {
  src: string | null;
  alt: string;
  fallbackText: string;
  gradientColors: string;
  size: AvatarSize;
} {
  const { identifier, name, customAvatar, size = 'md', type = 'generic' } = options;
  
  // Check if the provided name is actually an address
  const isNameAnAddress = name && isAddress(name);
  const displayName = isNameAnAddress ? undefined : name;
  
  // Only use database avatar if provided and valid, otherwise let Avatar component handle fallback
  const src = customAvatar && customAvatar.trim() !== '' ? customAvatar : null;

  // Generate appropriate alt text
  const alt = displayName 
    ? `${displayName} avatar`
    : type === 'publication'
      ? 'Publication avatar'
      : type === 'user'
        ? 'User avatar'
        : 'Avatar';

  // Generate fallback text for Avatar component
  // If name is an address or no name provided, use address fallback
  const fallbackText = displayName 
    ? getInitials(displayName)
    : getAddressFallback(isNameAnAddress ? name! : identifier);

  // Generate deterministic gradient colors based on name or identifier
  const gradientSeed = displayName || (isNameAnAddress ? name! : identifier);
  const gradientColors = generateGradientFromText(gradientSeed);

  return {
    src,
    alt,
    fallbackText,
    gradientColors,
    size,
  };
}

/**
 * Create avatar configuration specifically for publications with database support
 * 
 * @param publication - Publication data from API
 * @param size - Avatar size variant
 * @returns Avatar configuration object
 */
export function createPublicationAvatarConfig(
  publication: { id: string; name: string; avatar?: string | null },
  size: AvatarSize = 'md'
): {
  src: string | null;
  alt: string;
  fallbackText: string;
  gradientColors: string;
  size: AvatarSize;
} {
  return createAvatarConfig({
    identifier: publication.id,
    name: publication.name,
    customAvatar: publication.avatar,
    type: 'publication',
    size,
  });
}

/**
 * Create avatar configuration specifically for users with database support
 * 
 * @param user - User data from API
 * @param size - Avatar size variant
 * @returns Avatar configuration object
 */
export function createUserAvatarConfig(
  user: { id?: string; publicKey?: string; name?: string; avatar?: string | null },
  size: AvatarSize = 'md'
): {
  src: string | null;
  alt: string;
  fallbackText: string;
  gradientColors: string;
  size: AvatarSize;
} {
  // Use publicKey if available, otherwise use user ID as identifier
  const identifier = user.publicKey || user.id || 'unknown';
  
  return createAvatarConfig({
    identifier,
    name: user.name,
    customAvatar: user.avatar,
    type: 'user',
    size,
  });
}

