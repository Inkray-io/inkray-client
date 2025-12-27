"use client"

import { Sun, Moon, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReaderTheme } from "@/hooks/useReaderSettings"

interface ThemeToggleProps {
  value: ReaderTheme
  onChange: (theme: ReaderTheme) => void
}

const THEMES: { key: ReaderTheme; label: string; Icon: typeof Sun }[] = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'sepia', label: 'Sepia', Icon: BookOpen },
]

export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
      {THEMES.map(({ key, label, Icon }) => {
        const isActive = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-lg transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive
                ? "bg-white shadow-sm"
                : "hover:bg-gray-200/50"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 transition-colors duration-200",
                isActive ? "text-primary" : "text-gray-400"
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              className={cn(
                "text-[13px] transition-all duration-200",
                isActive
                  ? "font-semibold text-gray-900"
                  : "font-medium text-gray-500"
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
