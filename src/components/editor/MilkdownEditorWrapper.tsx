"use client"

import React from 'react'
import { MilkdownProvider } from '@milkdown/react'

interface MilkdownEditorWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper component that provides Milkdown context to child components.
 * This should wrap any component that uses Milkdown editor functionality.
 */
export function MilkdownEditorWrapper({ children }: MilkdownEditorWrapperProps) {
  return (
    <MilkdownProvider>
      {children}
    </MilkdownProvider>
  )
}