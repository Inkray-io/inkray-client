"use client"

import React, { useRef } from 'react'
import { Milkdown, useEditor } from '@milkdown/react'
import { Crepe } from '@milkdown/crepe'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '../../styles/milkdown.css'

interface ArticleEditorProps {
  initialValue?: string
  onChange?: (markdown: string) => void
  placeholder?: string
  className?: string
}

export function ArticleEditor({
  initialValue = '',
  onChange,
  placeholder = 'Start writing your article...',
  className = ''
}: ArticleEditorProps) {
  // Use ref to store callbacks to prevent re-initialization
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Configure editor using the official useEditor hook with minimal dependencies
  useEditor((root) => {
    // Create basic Crepe instance first
    const crepe = new Crepe({
      root,
      defaultValue: initialValue,
      features: {
        // Enable core features - simplified to avoid schema conflicts
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.ListItem]: true,
        [Crepe.Feature.LinkTooltip]: true,
        [Crepe.Feature.ImageBlock]: true,
        [Crepe.Feature.BlockEdit]: true,
        [Crepe.Feature.Cursor]: true,
      },
    })

    // Add listener plugin first
    crepe.editor.use(listener)

    // Then configure after plugins are added
    crepe.editor.config((ctx) => {
      // Configure listener for change events using the ref
      const listenerManager = ctx.get(listenerCtx)
      listenerManager.markdownUpdated((_, markdown) => {
        if (onChangeRef.current) {
          onChangeRef.current(markdown)
        }
      })

      // Configure ImageBlock feature with upload functionality
      ctx.update(Crepe.Feature.ImageBlock, () => ({
        onUpload: async (file: File) => {
          // TODO: Implement actual image upload to your storage service
          console.log(`Uploading file: ${file.name}`)
          
          // For now, create a local URL for preview
          // In production, you would upload to your storage and return the URL
          const url = URL.createObjectURL(file)
          
          // Simulate upload delay
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          return url
        },
        captionPlaceholderText: placeholder || 'Add image caption...',
      }))
    })

    return crepe.editor
  }) // Remove dependencies to prevent re-initialization

  // Return the official Milkdown component
  return (
    <div className={`milkdown-editor ${className}`}>
      <div className="min-h-[500px] w-full">
        <Milkdown />
      </div>
    </div>
  )
}