"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'

// Types
export type ReaderTheme = 'light' | 'dark' | 'sepia'
export type FontFamily = 'sans-serif' | 'serif'
export type FontSizeLevel = 0 | 1 | 2 | 3 | 4

export interface ReaderSettings {
  theme: ReaderTheme
  fontFamily: FontFamily
  fontSizeLevel: FontSizeLevel
}

export interface ReaderThemeColors {
  background: string
  card: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  primary: string
}

// Font size map: levels 0-4 map to pixel values
export const FONT_SIZE_MAP: Record<FontSizeLevel, number> = {
  0: 14,
  1: 16,
  2: 18, // Default - recommended
  3: 20,
  4: 22,
}

// Line height is 1.6x font size for better readability
export const getLineHeight = (fontSize: number): number => Math.round(fontSize * 1.6)

// Reader theme colors - only for article content
export const READER_THEME_COLORS: Record<ReaderTheme, ReaderThemeColors> = {
  light: {
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    primary: '#3B82F6',
  },
  dark: {
    background: '#1A1A1A',
    card: '#1A1A1A',
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    border: '#27272A',
    primary: '#60A5FA',
  },
  sepia: {
    background: '#FBF5E6',
    card: '#FBF5E6',
    text: '#5B4636',
    textSecondary: '#7A6855',
    textMuted: '#9A8B7A',
    border: '#E8DFD0',
    primary: '#8B6914',
  },
}

// Font family mapping for web
export const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  'sans-serif': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
}

// Default settings
export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontFamily: 'sans-serif',
  fontSizeLevel: 2, // 18px
}

const STORAGE_KEY = 'inkray-reader-settings'

// Load settings from localStorage
function loadSettings(): ReaderSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_READER_SETTINGS
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        theme: parsed.theme ?? DEFAULT_READER_SETTINGS.theme,
        fontFamily: parsed.fontFamily ?? DEFAULT_READER_SETTINGS.fontFamily,
        fontSizeLevel: parsed.fontSizeLevel ?? DEFAULT_READER_SETTINGS.fontSizeLevel,
      }
    }
  } catch (error) {
    console.error('Failed to load reader settings:', error)
  }

  return DEFAULT_READER_SETTINGS
}

// Save settings to localStorage
function saveSettings(settings: ReaderSettings): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save reader settings:', error)
  }
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    setIsLoading(false)
  }, [])

  // Actions
  const setTheme = useCallback((theme: ReaderTheme) => {
    setSettings(prev => {
      const newSettings = { ...prev, theme }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  const setFontFamily = useCallback((fontFamily: FontFamily) => {
    setSettings(prev => {
      const newSettings = { ...prev, fontFamily }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  const setFontSizeLevel = useCallback((fontSizeLevel: FontSizeLevel) => {
    setSettings(prev => {
      const newSettings = { ...prev, fontSizeLevel }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_READER_SETTINGS)
    saveSettings(DEFAULT_READER_SETTINGS)
  }, [])

  // Computed values
  const fontSize = FONT_SIZE_MAP[settings.fontSizeLevel]
  const lineHeight = getLineHeight(fontSize)
  const fontFamilyValue = FONT_FAMILY_MAP[settings.fontFamily]
  const readerThemeColors = READER_THEME_COLORS[settings.theme]

  return useMemo(() => ({
    settings,
    fontSize,
    lineHeight,
    fontFamilyValue,
    readerThemeColors,
    setTheme,
    setFontFamily,
    setFontSizeLevel,
    resetToDefaults,
    isLoading,
  }), [
    settings,
    fontSize,
    lineHeight,
    fontFamilyValue,
    readerThemeColors,
    setTheme,
    setFontFamily,
    setFontSizeLevel,
    resetToDefaults,
    isLoading,
  ])
}
