"use client"

import { cn } from "@/lib/utils"
import { FontSizeLevel, FONT_SIZE_MAP } from "@/hooks/useReaderSettings"

interface FontSizeSliderProps {
  value: FontSizeLevel
  onChange: (level: FontSizeLevel) => void
}

const LEVELS: FontSizeLevel[] = [0, 1, 2, 3, 4]

export function FontSizeSlider({ value, onChange }: FontSizeSliderProps) {
  const fillPercentage = (value / 4) * 100
  const currentFontSize = FONT_SIZE_MAP[value]

  return (
    <div className="w-full">
      <div className="flex items-center gap-4">
        {/* Small A */}
        <span className="text-[11px] font-semibold text-gray-400 w-5 text-center select-none">
          A
        </span>

        {/* Track Container */}
        <div className="flex-1 h-11 flex items-center">
          <div className="relative w-full h-1 bg-gray-200 rounded-full">
            {/* Filled Track */}
            <div
              className="absolute left-0 top-0 h-1 bg-primary rounded-full transition-all duration-150"
              style={{ width: `${fillPercentage}%` }}
            />

            {/* Ticks */}
            <div className="absolute inset-0 flex justify-between items-center">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange(level)}
                  className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
                  aria-label={`Font size ${FONT_SIZE_MAP[level]}px`}
                >
                  <div
                    className={cn(
                      "rounded-full transition-all duration-150 border-2 border-white",
                      level <= value ? "bg-primary" : "bg-gray-300",
                      level === value
                        ? "w-5 h-5 shadow-md shadow-primary/30"
                        : "w-3 h-3 hover:scale-110"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Large A */}
        <span className="text-[17px] font-semibold text-gray-400 w-5 text-center select-none">
          A
        </span>
      </div>

      {/* Preview */}
      <div className="mt-3 text-center">
        <span
          className="text-gray-500 font-medium transition-all duration-150"
          style={{ fontSize: currentFontSize }}
        >
          {currentFontSize}px
        </span>
      </div>
    </div>
  )
}
