"use client"

import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import { Milkdown, useEditor } from '@milkdown/react'
import { Crepe } from '@milkdown/crepe'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { TemporaryImageManager } from '@/lib/services/TemporaryImageManager'
import { validateImageFile } from '@/lib/utils/imageValidation'
import { TemporaryImage } from '@/types/article'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '../../styles/milkdown.css'

interface ArticleEditorProps {
  initialValue?: string
  onChange?: (markdown: string) => void
  onTempImagesChange?: (images: TemporaryImage[]) => void
  placeholder?: string
  className?: string
}

export interface ArticleEditorRef {
  getTemporaryImages: () => TemporaryImage[]
  clearTemporaryImages: () => void
}

export const ArticleEditor = forwardRef<ArticleEditorRef, ArticleEditorProps>(({
  initialValue = '',
  onChange,
  onTempImagesChange,
  placeholder = 'Start writing your article...',
  className = ''
}, ref) => {
  // Use ref to store callbacks to prevent re-initialization
  const onChangeRef = useRef(onChange)
  const onTempImagesChangeRef = useRef(onTempImagesChange)
  onChangeRef.current = onChange
  onTempImagesChangeRef.current = onTempImagesChange

  // Create temporary image manager instance
  const tempImageManager = useRef(new TemporaryImageManager())

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getTemporaryImages: () => tempImageManager.current.getAllImages(),
    clearTemporaryImages: () => {
      tempImageManager.current.clear()
      if (onTempImagesChangeRef.current) {
        onTempImagesChangeRef.current([])
      }
    }
  }))

  // Configure editor using the official useEditor hook with minimal dependencies
  useEditor((root) => {
    // Create Crepe instance with features configured upfront
    const crepe = new Crepe({
      root,
      defaultValue: initialValue,
      features: {
        // Enable core features
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.ListItem]: true,
        [Crepe.Feature.LinkTooltip]: true,
        [Crepe.Feature.ImageBlock]: true,
        [Crepe.Feature.BlockEdit]: true,
        [Crepe.Feature.Cursor]: true,
      },
      featureConfigs: {
        [Crepe.Feature.ImageBlock]: {
          onUpload: async (file: File) => {
            console.log(`Processing image: ${file.name}`)

            // Validate the image file
            const validation = validateImageFile(file)
            if (!validation.isValid) {
              throw new Error(validation.errors.join(', '))
            }

            // Add to temporary storage and return FINAL URL that stays in markdown
            const finalUrl = tempImageManager.current.addImage(file)

            // Notify parent component about temp images change
            if (onTempImagesChangeRef.current) {
              const allImages = tempImageManager.current.getAllImages()
              onTempImagesChangeRef.current(allImages)
            }

            // Simulate upload delay for UX
            await new Promise(resolve => setTimeout(resolve, 500))

            // Return the final URL - this URL will remain in the markdown permanently
            // Example: "http://localhost:3000/articles/media/media0"
            console.log(`Generated URL: ${finalUrl}`)
            return finalUrl
          },
          blockCaptionPlaceholderText: placeholder || 'Add image caption...',
        },
      },
    })

    // Add listener plugin for markdown change events
    const editor = crepe.editor.use(listener)

    // Configure listener for change events
    editor.config((ctx) => {
      const listenerManager = ctx.get(listenerCtx)
      listenerManager.markdownUpdated((_, markdown: string) => {
        if (onChangeRef.current) {
          console.log(markdown)
          onChangeRef.current(markdown)
        }
      })
    })

    return editor
  }) // Remove dependencies to prevent re-initialization

  // Return the official Milkdown component
  return (
    <div className={`milkdown-editor ${className}`}>
      <div className="min-h-[500px] w-full">
        <Milkdown />
      </div>
    </div>
  )
})

ArticleEditor.displayName = 'ArticleEditor'