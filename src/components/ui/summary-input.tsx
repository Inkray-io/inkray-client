"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SummaryInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  label?: string
  maxLength?: number
  minLength?: number
  showOverlayCounter?: boolean
}

export function SummaryInput({
  value = "",
  onChange,
  label = "Summary",
  maxLength = 280,
  minLength = 10,
  showOverlayCounter = false,
  className,
  ...props
}: SummaryInputProps) {
  const [characterCount, setCharacterCount] = React.useState(value.length)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setCharacterCount(newValue.length)
    onChange?.(newValue)
  }

  const isOverLimit = characterCount > maxLength
  const isUnderMinimum = characterCount > 0 && characterCount < minLength

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none resize-none",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-input/30 md:text-sm",
            isOverLimit && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            isUnderMinimum && "border-amber-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20",
            showOverlayCounter && "pr-16", // Add padding for overlay counter
            className
          )}
          {...props}
        />
        
        {/* Overlay Counter */}
        {showOverlayCounter && (
          <div className="absolute bottom-1 right-1 bg-white/70 px-1.5 py-0.5 text-xs">
            <span className={cn(isOverLimit ? "text-destructive" : "text-gray-400")}>
              {characterCount}/{maxLength}
            </span>
          </div>
        )}
      </div>
      
      {/* Standard Counter and Validation (only when not using overlay) */}
      {!showOverlayCounter && (
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-gray-500">
            {isUnderMinimum && (
              <span className="text-amber-600">
                At least {minLength} characters required
              </span>
            )}
            {isOverLimit && (
              <span className="text-destructive">
                Character limit exceeded
              </span>
            )}
          </div>
          <div
            className={cn(
              "text-xs",
              isOverLimit ? "text-destructive" : "text-gray-500"
            )}
          >
            {characterCount}/{maxLength}
          </div>
        </div>
      )}
      
      {/* Validation messages for overlay mode */}
      {showOverlayCounter && (isUnderMinimum || isOverLimit) && (
        <div className="text-xs mt-1">
          {isUnderMinimum && (
            <span className="text-amber-600">
              At least {minLength} characters required
            </span>
          )}
          {isOverLimit && (
            <span className="text-destructive">
              Character limit exceeded
            </span>
          )}
        </div>
      )}
    </div>
  )
}