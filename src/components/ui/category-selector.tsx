"use client"

import * as React from "react"
import { Select } from "./select"

export interface Category {
  id: string
  slug: string
  name: string
}

interface CategorySelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  categories: Category[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function CategorySelector({
  value,
  onValueChange,
  categories,
  placeholder = "Select a category...",
  disabled = false,
  required = false
}: CategorySelectorProps) {
  return (
    <Select
      value={value || ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      required={required}
      className="w-full"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </Select>
  )
}