"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { TopicConfig } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TopicSelectorProps {
  topics: TopicConfig[]
  selectedTopics: string[]
  onSelectionChange: (selected: string[]) => void
  maxSelections?: number
  isLoading?: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const chipVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
}

export function TopicSelector({
  topics,
  selectedTopics,
  onSelectionChange,
  maxSelections = 3,
  isLoading = false,
}: TopicSelectorProps) {
  const isMaxReached = selectedTopics.length >= maxSelections

  const handleToggle = (slug: string) => {
    if (selectedTopics.includes(slug)) {
      onSelectionChange(selectedTopics.filter((s) => s !== slug))
    } else if (!isMaxReached) {
      onSelectionChange([...selectedTopics, slug])
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="h-6 w-24 bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-muted animate-pulse rounded-xl"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          What interests you?
        </h2>
        <p className="text-muted-foreground text-sm">
          Select up to {maxSelections} topics to personalize your feed
        </p>
      </div>

      {/* Selection counter */}
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50"
        animate={{
          scale: selectedTopics.length > 0 ? [1, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-sm text-muted-foreground">Selected:</span>
        <span
          className={cn(
            "text-sm font-medium tabular-nums transition-colors",
            selectedTopics.length === maxSelections
              ? "text-primary"
              : "text-foreground"
          )}
        >
          {selectedTopics.length}/{maxSelections}
        </span>
      </motion.div>

      {/* Topics grid */}
      <motion.div
        className="grid grid-cols-2 gap-3 w-full max-w-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {topics.map((topic) => {
          const isSelected = selectedTopics.includes(topic.slug)
          const isDisabled = isMaxReached && !isSelected

          return (
            <motion.button
              key={topic.slug}
              variants={chipVariants}
              onClick={() => handleToggle(topic.slug)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02 } : undefined}
              whileTap={!isDisabled ? { scale: 0.98 } : undefined}
              className={cn(
                "relative flex items-center justify-between gap-2 px-4 py-3 rounded-xl",
                "border-2 transition-all duration-200 ease-out",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : isDisabled
                    ? "border-muted bg-muted/30 opacity-50 cursor-not-allowed"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isSelected
                    ? "text-primary"
                    : isDisabled
                      ? "text-muted-foreground"
                      : "text-foreground"
                )}
              >
                {topic.name}
              </span>

              {/* Check indicator */}
              <motion.div
                initial={false}
                animate={{
                  scale: isSelected ? 1 : 0,
                  opacity: isSelected ? 1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-primary"
              >
                <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Hint text */}
      {selectedTopics.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground text-center"
        >
          Pick topics to see relevant publications
        </motion.p>
      )}

      {selectedTopics.length === maxSelections && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-primary text-center font-medium"
        >
          Great choices! Continue when ready
        </motion.p>
      )}
    </div>
  )
}
