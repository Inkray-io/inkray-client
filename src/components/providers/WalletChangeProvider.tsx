"use client";

import React from 'react';
import { useWalletChangeDetection } from '@/hooks/useWalletChangeDetection';

interface WalletChangeProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that enables wallet change detection globally
 * 
 * This component should be placed high in the component tree to ensure
 * wallet change detection works throughout the entire application.
 */
export function WalletChangeProvider({ children }: WalletChangeProviderProps) {
  // Initialize wallet change detection hook
  useWalletChangeDetection();

  // This provider doesn't need to pass any context, it just runs the detection hook
  return <>{children}</>;
}