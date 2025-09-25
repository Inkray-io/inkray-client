"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { ArticleEditor, ArticleEditorRef } from '@/components/editor/ArticleEditor'
import { MilkdownEditorWrapper } from '@/components/editor/MilkdownEditorWrapper'
import { Button } from '@/components/ui/button'
import { CategorySelector } from '@/components/ui/category-selector'
import { SummaryInput } from '@/components/ui/summary-input'
import { HiDocumentText } from 'react-icons/hi2'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequirePublication } from '@/components/auth/RequirePublication'
import { useArticleCreation } from '@/hooks/useArticleCreation'
import { useCategories } from '@/hooks/useCategories'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { getCachedDraft, setCachedDraft, clearDraftCache } from '@/lib/cache-manager'
import { TemporaryImage } from '@/types/article'

// Utility function to extract plain text from markdown
function getPlainTextFromMarkdown(markdown: string): string {
  if (!markdown) return ''

  return markdown
    // Remove headers (# ## ###)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic (**text** *text* __text__ _text_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code `code`
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks ```code```
    .replace(/```[\s\S]*?```/g, '')
    // Remove blockquotes > text
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules ---
    .replace(/^---+$/gm, '')
    // Remove extra whitespace and newlines
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+|\s+$/g, '')
    .trim()
}

// Calculate reading time from word count (average 200 words per minute)
function calculateReadingTime(plainText: string): number {
  if (!plainText) return 0
  const words = plainText.split(/\s+/).filter(word => word.length > 0)
  return Math.ceil(words.length / 200) || 0
}

export default function CreateArticlePage() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    createAndPublishArticle,
    isProcessing,
    uploadProgress,
    error,
    clearError
  } = useArticleCreation()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [gated, setGated] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [tempImages, setTempImages] = useState<TemporaryImage[]>([])

  // Editor ref to access temporary images
  const editorRef = useRef<ArticleEditorRef>(null)

  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()

  // Auto-save draft to localStorage
  useEffect(() => {
    if (title || content || summary || categoryId) {
      const draft = {
        title,
        content,
        summary,
        categoryId,
        gated
      }

      setCachedDraft(draft)
      setLastSaved(new Date())
    }
  }, [title, content, summary, categoryId, gated])

  // Load saved draft on mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = getCachedDraft()
        if (draft) {
          setTitle(draft.title || '')
          setContent(draft.content || '')
          setSummary(draft.summary || '')
          setCategoryId(draft.categoryId || '')
          setGated(draft.gated || false)
          setLastSaved(new Date(draft.timestamp))
        }
      } catch {
        // Failed to load draft - continue without it
      }
    }

    loadDraft()
  }, [])

  const handlePublish = async () => {
    if (!title.trim() || !content.trim() || !summary.trim() || !categoryId) {
      toast({
        title: "Missing Content",
        description: "Please fill in all required fields: title, content, summary, and category.",
        variant: "destructive",
      })
      return
    }

    if (summary.length < 10) {
      toast({
        title: "Summary Too Short",
        description: "Summary must be at least 10 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      clearError()

      // Get temporary images from editor
      const currentTempImages = editorRef.current?.getTemporaryImages() || []

      const result = await createAndPublishArticle(
        title.trim(), 
        content.trim(), 
        summary.trim(), 
        categoryId, 
        [], // existing media files
        gated, 
        currentTempImages // temporary images from editor
      )

      // Clear draft and temporary images on successful publish
      clearDraftCache()
      editorRef.current?.clearTemporaryImages()
      setTempImages([])

      toast({
        title: "Article Published!",
        description: `Your article "${title}" has been published successfully.`,
      })

      // Navigate to the published article (wait 5s for blockchain event processing)
      setTimeout(() => {
        router.push(`/article?id=${result.slug}`)
      }, 5000)

    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearDraft = () => {
    if (confirm('Are you sure you want to clear this draft?')) {
      clearDraftCache()
      setTitle('')
      setContent('')
      setSummary('')
      setCategoryId('')
      setGated(false)
      setLastSaved(null)
    }
  }

  return (
    <RequireAuth redirectTo="/">
      <RequirePublication redirectTo="/create-publication">
        <AppLayout currentPage="create">
          <div className="mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-black">Create Article</h1>
                  <p className="text-gray-600 mt-1">Write and publish your story</p>
                </div>

                <div className="flex items-center gap-3">
                  {lastSaved && (
                    <span className="text-sm text-gray-500">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}

                  <Button
                    onClick={handlePublish}
                    disabled={isProcessing || !title.trim() || !content.trim() || !summary.trim() || !categoryId}
                    className="bg-primary hover:bg-primary/90 text-white gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <HiDocumentText className="size-4" />
                        Publish
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-1">
                      Publishing Error
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-800 p-0 h-auto"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Article title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-400 text-black"
                />
              </div>

              {/* Summary and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <SummaryInput
                    value={summary}
                    onChange={setSummary}
                    placeholder="Write a brief summary or headline for your article..."
                    label="Summary"
                    maxLength={280}
                    minLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  {categoriesError ? (
                    <div className="text-red-600 text-sm">
                      Failed to load categories: {categoriesError}
                    </div>
                  ) : (
                    <CategorySelector
                      value={categoryId}
                      onValueChange={setCategoryId}
                      categories={categories}
                      placeholder={categoriesLoading ? "Loading categories..." : "Select a category..."}
                      disabled={categoriesLoading}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Editor Container */}
            <div className="bg-white rounded-2xl p-6">
              <MilkdownEditorWrapper>
                <ArticleEditor
                  ref={editorRef}
                  initialValue={content}
                  onChange={setContent}
                  onTempImagesChange={setTempImages}
                  placeholder="Start writing your article..."
                  className="min-h-[600px]"
                />
              </MilkdownEditorWrapper>
            </div>

            {/* Image Upload Status */}
            {tempImages.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <HiDocumentText className="size-4" />
                  <span className="text-sm font-medium">
                    {tempImages.length} image{tempImages.length > 1 ? 's' : ''} ready for upload
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Images will be uploaded when you publish the article
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {getPlainTextFromMarkdown(content).length} characters
                  </span>
                  <span className="text-sm text-gray-500">
                    ~{calculateReadingTime(getPlainTextFromMarkdown(content))} min read
                  </span>
                </div>

                <Button
                  variant="ghost"
                  onClick={clearDraft}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear Draft
                </Button>
              </div>
            </div>
          </div>
        </AppLayout>
      </RequirePublication>
    </RequireAuth>
  )
}