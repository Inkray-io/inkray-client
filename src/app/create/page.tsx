"use client"

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout'
import { ArticleEditor } from '@/components/editor/ArticleEditor'
import { Button } from '@/components/ui/button'
import { HiDocumentText, HiEye, HiCloudArrowUp } from 'react-icons/hi2'
import { RequireAuth } from '@/components/auth/RequireAuth'

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
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save draft to localStorage
  useEffect(() => {
    if (title || content) {
      const draft = {
        title,
        content,
        lastModified: new Date().toISOString()
      }
      
      localStorage.setItem('inkray-article-draft', JSON.stringify(draft))
      setLastSaved(new Date())
    }
  }, [title, content])

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('inkray-article-draft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setTitle(draft.title || '')
        setContent(draft.content || '')
        setLastSaved(new Date(draft.lastModified))
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [])

  const handleSaveDraft = async () => {
    setIsSaving(true)
    
    // Simulate saving (replace with actual API call later)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const draft = {
      title,
      content,
      lastModified: new Date().toISOString()
    }
    
    localStorage.setItem('inkray-article-draft', JSON.stringify(draft))
    setLastSaved(new Date())
    setIsSaving(false)
  }

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please add a title and content before publishing.')
      return
    }

    // Placeholder for publishing logic
    alert('Publishing functionality will be implemented later!')
  }

  const clearDraft = () => {
    if (confirm('Are you sure you want to clear this draft?')) {
      localStorage.removeItem('inkray-article-draft')
      setTitle('')
      setContent('')
      setLastSaved(null)
    }
  }

  return (
    <RequireAuth redirectTo="/">
      <AppLayout currentPage="create">
      <div className="max-w-4xl mx-auto space-y-6">
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
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <HiEye className="size-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="gap-2"
              >
                <HiCloudArrowUp className="size-4" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                onClick={handlePublish}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <HiDocumentText className="size-4" />
                Publish
              </Button>
            </div>
          </div>

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
        </div>

        {/* Editor/Preview Container */}
        <div className="bg-white rounded-2xl p-6">
          {showPreview ? (
            /* Preview Mode */
            <div>
              <h2 className="text-xl font-semibold mb-4 text-black">Preview</h2>
              <div className="prose max-w-none">
                <h1 className="text-3xl font-bold mb-4">{title || 'Untitled Article'}</h1>
                <div 
                  className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: content.replace(/\n/g, '<br>') 
                  }}
                />
              </div>
            </div>
          ) : (
            /* Editor Mode */
            <ArticleEditor
              initialValue={content}
              onChange={setContent}
              placeholder="Start writing your article..."
              className="min-h-[600px]"
            />
          )}
        </div>

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
    </RequireAuth>
  )
}