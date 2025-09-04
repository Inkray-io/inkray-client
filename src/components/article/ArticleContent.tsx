"use client"

import { useState } from "react"

interface ArticleContentProps {
  title?: string
  description?: string
  body?: string
  expandable?: boolean
}

export function ArticleContent({ title, description, body, expandable = false }: ArticleContentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!title && !description && !body) {
    return null
  }

  // Split body into paragraphs if it's a long text
  const paragraphs = body ? body.split('\n\n') : []

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="space-y-4">
        {title && (
          <h1 className="text-3xl lg:text-4xl font-bold text-black leading-tight">
            {title}
          </h1>
        )}
        
        {description && (
          <p className="text-lg text-black/80 leading-relaxed">
            {description}
          </p>
        )}
        
        {body && (
          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => {
              // Show first 2 paragraphs, then show/hide based on expanded state
              const shouldShow = index < 2 || isExpanded
              
              if (!shouldShow) return null
              
              return (
                <p key={index} className="text-black/90 leading-relaxed">
                  {paragraph}
                </p>
              )
            })}
            
            {expandable && paragraphs.length > 2 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary font-medium hover:underline focus:outline-none"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}