"use client"

import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import { Milkdown, useEditor } from '@milkdown/react'
import { Crepe } from '@milkdown/crepe'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { TemporaryImageManager } from '@/lib/services/TemporaryImageManager'
import { validateImageFile } from '@/lib/utils/imageValidation'
import { TemporaryImage } from '@/types/article'
import { log } from '@/lib/utils/Logger'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '../../styles/milkdown.css'

interface ArticleEditorProps {
  initialValue?: string
  onChange?: (markdown: string) => void
  onTempImagesChange?: (images: TemporaryImage[]) => void
  onImageAdded?: (image: TemporaryImage) => void
  onImageDeleted?: (index: number) => void
  // Optional synchronous callback that can compute a draft (preview) URL
  // for non-temporary images. If provided and returns a non-empty string,
  // `proxyDomURL` will return that value for previewing inside the editor.
  computeDraftImageURL?: (originalURL: string) => string | undefined
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
  onImageAdded,
  onImageDeleted,
  computeDraftImageURL,
  placeholder = 'Start writing your article...',
  className = ''
}, ref) => {
  // Use ref to store callbacks to prevent re-initialization
  const onChangeRef = useRef(onChange)
  const onTempImagesChangeRef = useRef(onTempImagesChange)
  const onImageAddedRef = useRef(onImageAdded)
  const onImageDeletedRef = useRef(onImageDeleted)
  const computeDraftImageURLRef = useRef<((originalURL: string) => string | undefined) | undefined>(computeDraftImageURL)
  onChangeRef.current = onChange
  onTempImagesChangeRef.current = onTempImagesChange
  onImageAddedRef.current = onImageAdded
  onImageDeletedRef.current = onImageDeleted
  computeDraftImageURLRef.current = computeDraftImageURL

  // Create temporary image manager instance
  const tempImageManager = useRef(new TemporaryImageManager())

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getTemporaryImages: () => tempImageManager.current.getAllImages(),
    clearTemporaryImages: () => {
      // Notify about deletion of each temporary image before clearing
      const all = tempImageManager.current.getAllImages()
      if (onImageDeletedRef.current) {
        for (const img of all) {
          try { onImageDeletedRef.current(img.index) } catch { /* ignore callback errors */ }
        }
      }

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
            log.debug('Processing image', { fileName: file.name }, 'ArticleEditor')

            // Validate the image file
            const validation = validateImageFile(file)
            if (!validation.isValid) {
              throw new Error(validation.errors.join(', '))
            }

            // Add to temporary storage and return FINAL URL that stays in markdown
            const finalUrl = tempImageManager.current.addImage(file)

            // Get the TemporaryImage object we just added
            const addedImage = tempImageManager.current.getImageByUrl(finalUrl)

            // Notify parent component about temp images change
            if (onTempImagesChangeRef.current) {
              const allImages = tempImageManager.current.getAllImages()
              onTempImagesChangeRef.current(allImages)
            }

            // Notify single-image added callback
            if (addedImage && onImageAddedRef.current) {
              try { onImageAddedRef.current(addedImage) } catch { /* ignore callback errors */ }
            }

            // Simulate upload delay for UX
            await new Promise(resolve => setTimeout(resolve, 500))

            // Return the final URL - this URL will remain in the markdown permanently
            // Example: "http://localhost:3000/articles/media/media0"
            log.debug('Generated URL', { finalUrl }, 'ArticleEditor')
            return finalUrl
          },
          proxyDomURL: (originalURL: string) => {
            // Check if this is one of our temporary image URLs
            const blobUrl = tempImageManager.current.getBlobUrl(originalURL)
            if (blobUrl) {
              // Return blob URL for immediate preview in editor
              log.debug('Proxying URL to blob URL for preview', { originalURL }, 'ArticleEditor')
              return blobUrl
            }

            // If consumer supplied a computeDraftImageURL callback, allow it
            // to return a draft/preview URL for non-temp images. This keeps
            // preview logic extensible (for example, mapping to a CDN preview
            // or a short-lived signed URL).
            try {
              const draft = computeDraftImageURLRef.current?.(originalURL)
              if (draft) {
                return draft
              }
            } catch (err) {
              log.debug('computeDraftImageURL threw an error', { err, originalURL }, 'ArticleEditor')
            }

            // Fallback: ensure we always return a string (or Promise<string>) as
            // required by the editor's proxyDomURL contract. Returning the
            // original URL will show the actual image if nothing else applies.
            return originalURL
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
      listenerManager.markdownUpdated((_, markdown: string, prevMarkdown: string) => {
        if (onChangeRef.current) {
          onChangeRef.current(markdown)
        }

        // Detect deleted temporary images by comparing prevMarkdown -> markdown
        try {
          const extractImageUrls = (md: string | undefined): Set<string> => {
            const urls = new Set<string>()
            if (!md) return urls
            const imgRegex = /!\[.*?]\(([^)]+)\)/g
            for (const m of md.matchAll(imgRegex)) {
              if (m[1]) urls.add(m[1])
            }
            return urls
          }

          const prevUrls = extractImageUrls(prevMarkdown)
          const currUrls = extractImageUrls(markdown)

          // URLs that were present before but not now -> deleted images
          const deletedUrls: string[] = []
          for (const url of prevUrls) {
            if (!currUrls.has(url)) deletedUrls.push(url)
          }

          if (deletedUrls.length) {
            for (const url of deletedUrls) {
              const img = tempImageManager.current.getImageByUrl(url)
              if (img) {
                // remove and notify with index
                const removed = tempImageManager.current.removeImage(url)
                if (removed) {
                  log.debug('Temporary image removed from manager because it was deleted from markdown', { url }, 'ArticleEditor')
                  if (onImageDeletedRef.current) {
                    try { onImageDeletedRef.current(img.index) } catch { /* ignore callback errors */ }
                  }
                }
              } else {
                // Image not in temp manager (e.g., loaded from external source).
                // Extract index from URL. Expected format ends with /media/{index}
                try {
                  let extractedIndex: number | null = null
                  // Match URL ending with /media/{index}
                  const match = url.match(/\/media\/(\d+)$/)
                  if (match && match[1]) {
                    extractedIndex = parseInt(match[1], 10)
                  } else {
                    // Fallback: extract trailing digits from the URL
                    const trailing = url.match(/(\d+)$/)
                    if (trailing && trailing[1]) {
                      extractedIndex = parseInt(trailing[1], 10)
                    }
                  }

                  if (extractedIndex !== null && onImageDeletedRef.current) {
                    try { onImageDeletedRef.current(extractedIndex) } catch { /* ignore callback errors */ }
                  }
                } catch (err) {
                  log.debug('Failed to extract image index from deleted URL', { url, err }, 'ArticleEditor')
                }
              }
            }
            // NOTE: per request, do not call onTempImagesChangeRef for deletions here
          }
        } catch (err) {
          // Keep editor resilient if something unexpected happens
          log.error('Error while reconciling temporary images', { err }, 'ArticleEditor')
        }
      })
    })

    return editor
  }) // Remove dependencies to prevent re-initialization

  // Return the official Milkdown component
  return (
    <div className={`milkdown-editor ${className}`}>
      <div className="min-h-[500px] w-full crepe crepe-minimal">
        <Milkdown />
      </div>
    </div>
  )
})

ArticleEditor.displayName = 'ArticleEditor'
