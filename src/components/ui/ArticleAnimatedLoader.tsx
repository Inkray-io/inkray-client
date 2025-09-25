"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Lock, Download, Database, Wallet, CheckCircle } from "lucide-react"

type LoadingStage = 'idle' | 'metadata' | 'content' | 'decrypting' | 'waiting-wallet'

interface ArticleAnimatedLoaderProps {
  currentStage: LoadingStage
  isEncrypted?: boolean
  className?: string
  speed?: number
}

interface StageConfig {
  messages: string[]
  color: string
  bgColor: string
  icon: React.ReactNode
  completedMessage: string
}

export function ArticleAnimatedLoader({ 
  currentStage, 
  isEncrypted = false, 
  className, 
  speed = 80 
}: ArticleAnimatedLoaderProps) {
  const [displayLines, setDisplayLines] = useState<string[]>([])
  const [completedStages, setCompletedStages] = useState<LoadingStage[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const scrambleChars = "!@#$%^&*()_+-=[]{}|;:,.<>?~`"
  const alphaChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  // Stage configurations with context-aware messages
  const stageConfigs: Record<LoadingStage, StageConfig> = {
    idle: {
      messages: ["System ready..."],
      color: "text-gray-400",
      bgColor: "bg-gray-100",
      icon: <CheckCircle className="h-4 w-4" />,
      completedMessage: "System ready"
    },
    metadata: {
      messages: [
        "Initializing article request...",
        "Connecting to Inkray backend...",
        "Fetching article metadata...",
        "Validating publication access..."
      ],
      color: "text-blue-400",
      bgColor: "bg-blue-50",
      icon: <Database className="h-4 w-4" />,
      completedMessage: "Metadata loaded successfully"
    },
    content: {
      messages: isEncrypted ? [
        "Connecting to Walrus network...",
        "Locating encrypted content blob...",
        "Downloading from decentralized storage...",
        "Preparing encrypted data for decryption..."
      ] : [
        "Connecting to Walrus network...",
        "Locating content blob...",
        "Downloading from decentralized storage...",
        "Processing article content..."
      ],
      color: "text-purple-400",
      bgColor: "bg-purple-50",
      icon: <Download className="h-4 w-4" />,
      completedMessage: "Content downloaded from Walrus"
    },
    decrypting: {
      messages: [
        "Establishing Seal IBE session...",
        "Authenticating with key servers...",
        "Decrypting with Identity-Based Encryption...",
        "Validating BCS data integrity...",
        "Processing decrypted content..."
      ],
      color: "text-orange-400",
      bgColor: "bg-orange-50",
      icon: <Lock className="h-4 w-4" />,
      completedMessage: "Content decrypted successfully"
    },
    'waiting-wallet': {
      messages: [
        "Wallet authentication required...",
        "Please connect your wallet...",
        "Waiting for wallet connection...",
        "Signature required for decryption..."
      ],
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      icon: <Wallet className="h-4 w-4" />,
      completedMessage: "Wallet connected"
    }
  }

  const getRandomChar = () => {
    const chars = Math.random() > 0.7 ? alphaChars : scrambleChars
    return chars[Math.floor(Math.random() * chars.length)]
  }

  const scrambleText = (text: string, revealedCount: number) => {
    return text
      .split("")
      .map((char, index) => {
        if (index < revealedCount) {
          return char // Already revealed
        } else if (char === " ") {
          return " " // Keep spaces
        } else {
          return getRandomChar() // Scramble unrevealed characters
        }
      })
      .join("")
  }

  const stageOrder: LoadingStage[] = ['metadata', 'content', 'decrypting', 'waiting-wallet']
  const getCurrentStageIndex = () => stageOrder.indexOf(currentStage)
  const currentStageConfig = stageConfigs[currentStage]

  // Update completed stages when current stage changes
  useEffect(() => {
    const currentIndex = getCurrentStageIndex()
    if (currentIndex >= 0) {
      const newCompletedStages = stageOrder.slice(0, currentIndex)
      setCompletedStages(newCompletedStages)
    }
    setCurrentMessageIndex(0) // Reset message index when stage changes
  }, [currentStage])

  // Cycle through messages for current stage
  useEffect(() => {
    if (currentStage === 'idle' || !currentStageConfig) return

    const messages = currentStageConfig.messages
    const cycleInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000) // Change message every 2 seconds

    return () => clearInterval(cycleInterval)
  }, [currentStage, currentStageConfig])

  // Handle text scrambling animation
  useEffect(() => {
    if (currentStage === 'idle') {
      setDisplayLines([stageConfigs.idle.completedMessage])
      return
    }

    let revealedChars = 0
    const currentMessage = currentStageConfig.messages[currentMessageIndex]

    const updateDisplay = () => {
      const newLines: string[] = []

      // Add completed stages (fully revealed, green)
      completedStages.forEach(stage => {
        newLines.push(stageConfigs[stage].completedMessage)
      })

      // Add current stage (scrambling animation)
      if (currentStageConfig) {
        newLines.push(scrambleText(currentMessage, revealedChars))
      }

      setDisplayLines(newLines)
    }

    // Reveal characters gradually
    const revealInterval = setInterval(() => {
      if (revealedChars < currentMessage.length) {
        revealedChars++
        updateDisplay()
      } else {
        // Once fully revealed, keep scrambling unrevealed parts of other potential messages
        updateDisplay()
      }
    }, speed)

    // Continuous scrambling for unrevealed parts
    const scrambleInterval = setInterval(() => {
      updateDisplay()
    }, 50)

    return () => {
      clearInterval(revealInterval)
      clearInterval(scrambleInterval)
    }
  }, [currentStage, currentStageConfig, currentMessageIndex, completedStages, speed, scrambleText, stageConfigs])

  if (currentStage === 'idle' && completedStages.length === 0) {
    return null // Don't show anything when idle and no progress made
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-gray-200", className)}>
      <div className="bg-gray-50/80 px-6 py-4">
        {/* Compact header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-1.5 rounded-lg bg-white border", currentStageConfig?.color.replace('text-', 'border-'))}>
            {currentStageConfig?.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-700">Loading Article</span>
              {isEncrypted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  <Lock className="h-3 w-3" />
                  Encrypted
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compact animated loading line */}
        <div className="font-mono text-sm">
          {displayLines.map((line, index) => {
            const isCompleted = index < completedStages.length
            const isCurrent = index === completedStages.length
            
            return (
              <div
                key={`${index}-${line.substring(0, 10)}`}
                className={cn(
                  "transition-all duration-200 flex items-center gap-2 py-1",
                  isCompleted && "text-green-600",
                  isCurrent && currentStageConfig?.color,
                  !isCompleted && !isCurrent && "text-gray-400"
                )}
              >
                {/* Compact status indicator */}
                {isCompleted ? (
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="h-3 w-3 flex-shrink-0">
                    <div className="w-full h-full border-2 border-current border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" />
                )}
                
                {/* Text content */}
                <span className="flex-1 truncate">{line}</span>
                
                {/* Subtle cursor for current line */}
                {isCurrent && (
                  <div className="w-1 h-3 bg-current opacity-60 animate-pulse flex-shrink-0 rounded-full" />
                )}
              </div>
            )
          })}
        </div>

        {/* Compact footer status */}
        {currentStage === 'waiting-wallet' && (
          <div className="flex items-center gap-2 text-yellow-700 text-xs mt-3 pt-3 border-t border-yellow-200 bg-yellow-50 -mx-6 px-6 py-2">
            <Wallet className="h-3 w-3" />
            <span>Connect your wallet to decrypt this content</span>
          </div>
        )}
      </div>
    </div>
  )
}