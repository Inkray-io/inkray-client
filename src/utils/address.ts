/**
 * Format a Sui address to display first 4 and last 4 characters
 * @param address - The full Sui address
 * @returns Formatted address like "0x1234...5678"
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 8) {
    return address
  }
  
  // Ensure address starts with 0x
  const cleanAddress = address.startsWith('0x') ? address : `0x${address}`
  
  if (cleanAddress.length <= 10) {
    return cleanAddress
  }
  
  return `${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`
}

/**
 * Validate if a string is a valid Sui address
 * @param address - The address to validate
 * @returns true if valid Sui address format
 */
export const isValidSuiAddress = (address: string): boolean => {
  if (!address) return false
  
  // Remove 0x prefix if present
  const cleanAddress = address.replace(/^0x/, '')
  
  // Sui addresses are typically 64 characters (32 bytes) hex
  // But can be shorter (will be padded)
  return /^[0-9a-fA-F]{1,64}$/.test(cleanAddress)
}

/**
 * Get display name for user - prioritizes SuiNS name over formatted address
 * @param suiNSName - The resolved SuiNS name
 * @param address - The wallet address
 * @returns Object with primary and secondary display text
 */
export const getDisplayName = (suiNSName: string, address: string) => {
  if (suiNSName) {
    return {
      primary: suiNSName,
      secondary: formatAddress(address)
    }
  }
  
  return {
    primary: formatAddress(address),
    secondary: null
  }
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-999999px'
    
    document.body.prepend(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
    } catch (error) {
      console.error('Failed to copy text:', error)
      throw error
    } finally {
      textArea.remove()
    }
  }
}