"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for accessibility */
  alt?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show gradient border (for special cases like publication headers) */
  gradientBorder?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Fallback text for initials-based fallback */
  fallbackText?: string;
  /** Gradient colors for fallback background (Tailwind classes) */
  gradientColors?: string;
  /** Callback when image fails to load */
  onError?: () => void;
}

/**
 * Avatar component providing consistent avatar display across the application
 * 
 * Features:
 * - Multiple size variants (xs to 2xl)
 * - Automatic fallback to SVG placeholder when image fails
 * - Optional gradient border for special cases
 * - Proper accessibility support
 * - TypeScript support with full type safety
 */
export function Avatar({
  src,
  alt = '',
  size = 'md',
  gradientBorder = false,
  className,
  fallbackText,
  gradientColors = 'from-blue-400 to-purple-500',
  onError,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [_isLoading, _setIsLoading] = useState(true);

  // Size mappings for consistent sizing
  const sizeClasses = {
    xs: 'w-6 h-6',     // 24px
    sm: 'w-8 h-8',     // 32px  
    md: 'w-10 h-10',   // 40px
    lg: 'w-16 h-16',   // 64px
    xl: 'w-20 h-20',   // 80px (for mobile) sm:w-25 sm:h-25 (100px for desktop)
    '2xl': 'w-24 h-24' // 96px
  };

  // Responsive sizing for xl (publication header use case)
  const responsiveSizeClasses = size === 'xl' 
    ? 'w-20 h-20 sm:w-25 sm:h-25' 
    : sizeClasses[size];

  // SVG dimensions for fallback based on size
  const svgDimensions = {
    xs: { width: 24, height: 24, viewBox: '0 0 24 24' },
    sm: { width: 32, height: 32, viewBox: '0 0 32 32' },
    md: { width: 40, height: 40, viewBox: '0 0 40 40' },
    lg: { width: 64, height: 64, viewBox: '0 0 64 64' },
    xl: { width: 100, height: 100, viewBox: '0 0 100 100' },
    '2xl': { width: 96, height: 96, viewBox: '0 0 96 96' }
  };

  const dimensions = svgDimensions[size];

  const handleImageError = () => {
    setHasError(true);
    _setIsLoading(false);
    onError?.();
  };

  const handleImageLoad = () => {
    _setIsLoading(false);
  };


  // Create SVG fallback
  const createSvgFallback = () => {
    const radius = dimensions.width / 2;
    const iconScale = dimensions.width / 40; // Scale relative to default 40px size
    
    return `data:image/svg+xml,%3Csvg width='${dimensions.width}' height='${dimensions.height}' viewBox='${dimensions.viewBox}' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='${dimensions.width}' height='${dimensions.height}' rx='${radius}' fill='%23E5E7EB'/%3E%3Cpath d='M${radius} ${10 * iconScale}C${radius + 5.5228 * iconScale} ${10 * iconScale} ${radius + 10 * iconScale} ${14.4772 * iconScale} ${radius + 10 * iconScale} ${20 * iconScale}C${radius + 10 * iconScale} ${25.5228 * iconScale} ${radius + 5.5228 * iconScale} ${30 * iconScale} ${radius} ${30 * iconScale}C${radius - 5.5228 * iconScale} ${30 * iconScale} ${radius - 10 * iconScale} ${25.5228 * iconScale} ${radius - 10 * iconScale} ${20 * iconScale}C${radius - 10 * iconScale} ${14.4772 * iconScale} ${radius - 5.5228 * iconScale} ${10 * iconScale} ${radius} ${10 * iconScale}ZM${radius} ${35 * iconScale}C${radius + 14.4183 * iconScale} ${35 * iconScale} ${radius + 23 * iconScale} ${37.7614 * iconScale} ${radius + 23 * iconScale} ${42.5 * iconScale}V${52.5 * iconScale}H${radius - 23 * iconScale}V${42.5 * iconScale}C${radius - 23 * iconScale} ${37.7614 * iconScale} ${radius - 14.4183 * iconScale} ${35 * iconScale} ${radius} ${35 * iconScale}Z' fill='%239CA3AF'/%3E%3C/svg%3E`;
  };

  // Container classes
  const containerClasses = cn(
    'rounded-full overflow-hidden bg-gray-200 flex-shrink-0',
    responsiveSizeClasses,
    gradientBorder && 'bg-white p-0.5 relative',
    className
  );

  // Gradient border element (only for gradientBorder variant)
  const gradientBorderElement = gradientBorder && (
    <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
  );

  // Inner container for gradient border variant
  const innerContainerClasses = gradientBorder
    ? 'relative w-full h-full rounded-full overflow-hidden bg-gray-200'
    : undefined;

  // Image element
  const imageElement = !hasError && src && (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="lazy"
    />
  );

  // Fallback element (initials or SVG)
  const fallbackElement = (hasError || !src) && (
    <>
      {fallbackText ? (
        // Text-based fallback (initials)
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientColors} text-white font-semibold text-sm`}>
          {fallbackText}
        </div>
      ) : (
        // SVG fallback
        <img
          src={createSvgFallback()}
          alt={alt || 'Default avatar'}
          className="w-full h-full object-cover"
        />
      )}
    </>
  );

  return (
    <div className={containerClasses}>
      {gradientBorderElement}
      {gradientBorder ? (
        <div className={innerContainerClasses}>
          {imageElement}
          {fallbackElement}
        </div>
      ) : (
        <>
          {imageElement}
          {fallbackElement}
        </>
      )}
    </div>
  );
}

// Export size type for use in other components
export type AvatarSize = AvatarProps['size'];