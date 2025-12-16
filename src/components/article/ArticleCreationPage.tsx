'use client';
import { useAuth } from "@/contexts/AuthContext";
import useDraftMode from "@/hooks/useDraftMode";
import { useRouter } from "next/navigation";
import { useArticleCreation, useToast } from "@/hooks";
import { useEffect, useRef, useState } from "react";
import { ArticleEditor, ArticleEditorRef } from "@/components/editor/ArticleEditor";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { HiDocumentText } from "react-icons/hi2";
import { MilkdownEditorWrapper } from "@/components/editor/MilkdownEditorWrapper";
import { getPlainTextFromMarkdown } from "@/lib/utils/markdown";

// Calculate reading time from word count (average 200 words per minute)
function calculateReadingTime(plainText: string): number {
  if (!plainText) return 0
  const words = plainText.split(/\s+/).filter(word => word.length > 0)
  return Math.ceil(words.length / 200) || 0
}

export default function ArticleCreationPage() {
  const { account } = useAuth();
  const {
    saveDraftStateThrottled,
    uploadDraftImage,
    deleteDraftImage,
    computeImageDraftUrl,
    deleteDraft,
    lastSavedAt,
    draft,
    loadingDraft,
    savingDraft,
    deletingDraft,
    settingEditLock,
    setEditLock
  } = useDraftMode();
  const router = useRouter()
  const { toast } = useToast()
  const {
    createAndPublishArticle,
    isProcessing,
    uploadProgress,
    error,
    clearError
  } = useArticleCreation()

  const [ title, setTitle ] = useState('')
  const [ content, setContent ] = useState('')
  const [ gated ] = useState(false)
  const [ isWaitingForRedirect, setIsWaitingForRedirect ] = useState(false)

  // Prevent autosave from running when we programmatically clear editor state
  // (for example after deleting a draft). This is a short-lived guard used
  // around the clear/reset actions below.
  const skipAutosaveRef = useRef(false)

  // Editor ref to access temporary images
  const editorRef = useRef<ArticleEditorRef>(null)

  // Auto-save draft
  useEffect(() => {
    // Skip autosave when we just cleared the editor programmatically
    if (skipAutosaveRef.current) { return }

    if ((title || content) && (title !== draft?.title || content !== draft?.content)) {
      console.log('Auto-saving draft...', { title, content, draft });
      saveDraftStateThrottled(title ?? '', content ?? '');
    }
  }, [ title, content, gated, draft, saveDraftStateThrottled ])

  useEffect(() => {
    if (draft && !content && !title) {
      if (draft.title) {
        setTitle(draft.title);
      }
      if (draft.content) {
        setContent(draft.content);
      }
    }
  }, [ draft ]);


  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please fill in both title and content to publish.",
        variant: "destructive",
      })
      return
    }

    if (!draft) {
      toast({
        title: "No Draft",
        description: "Draft not found. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      clearError()

      const result = await createAndPublishArticle(
          title.trim(),
          content.trim(),
          draft.id,
          gated,
      );


      editorRef.current?.clearTemporaryImages()

      // Keep loading state during the wait period
      setIsWaitingForRedirect(true)

      // Navigate to the published article (wait 5s for blockchain event processing)
      setTimeout(() => {
        toast({
          title: "Article Published!",
          description: `Your article "${title}" has been published successfully.`,
        })
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

  const destroyDraft = async () => {
    // Set guard to prevent autosave from reacting to the state resets below.
    skipAutosaveRef.current = true
    const ok = await deleteDraft();
    if (ok) {
      // Clear local editor state so the auto-save effect won't create a new draft
      setTitle('')
      setContent('')
      editorRef.current?.clearTemporaryImages()
    }
    // Clear the guard on the next tick — autosave is allowed again after that.
    setTimeout(() => { skipAutosaveRef.current = false }, 50)
  }
  const clearDraft = () => {
    if (confirm('Are you sure you want to clear this draft?')) {
      destroyDraft()
    }
  }
  return (
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
          <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black">Create Article</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Write and publish your
                story</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {savingDraft ? (
                  <span className="text-xs text-gray-400">
                    Saving draft...
                  </span>
              ) : (
                  lastSavedAt && (
                      <span className="text-xs text-gray-400">
                        Last saved: {lastSavedAt.toLocaleTimeString()}
                      </span>
                  )
              )}
              {account && account.id === draft?.authorId && draft && (
                  <Button
                      variant="outline"
                      onClick={async () => {
                        const newAllow = !draft.allowDraftEditing;
                        const ok = await setEditLock(newAllow);
                        if (ok) {
                          toast({
                            title: 'Draft updated',
                            description: newAllow ? 'Editing allowed for this draft.' : 'Editing locked for this draft.'
                          })
                        }
                      }}
                      disabled={settingEditLock}
                      className="text-xs gap-2 min-h-[40px]"
                  >
                    {settingEditLock ? (
                        <Loader2 className="size-4 animate-spin"/>
                    ) : (
                        draft.allowDraftEditing ? 'Lock Editing' : 'Allow Editing'
                    )}
                  </Button>
              )}
              {account && account.id === draft?.authorId && (
                  <Button
                      onClick={handlePublish}
                      disabled={isProcessing || isWaitingForRedirect || !title.trim() || !content.trim()}
                      className="bg-primary hover:bg-primary/90 text-white gap-2 disabled:opacity-50 min-h-[40px] flex-1 sm:flex-initial"
                  >
                    {(isProcessing || isWaitingForRedirect) ? (
                        <>
                          <Loader2 className="size-4 animate-spin"/>
                          {isWaitingForRedirect ? 'Publishing...' : uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                        </>
                    ) : (
                        <>
                          <HiDocumentText className="size-4"/>
                          Publish
                        </>
                    )}
                  </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
              <div
                  className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
                <AlertCircle
                    className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"/>
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
        </div>

        {/* Main Editor Container - Fluid Vertical Structure */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {/* Title */}
            <div>
              <input
                  type="text"
                  placeholder="Add a Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl md:text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-400 text-black focus:outline-none"
              />
            </div>


            {/* Content Editor */}
            {(draft || (!draft && !loadingDraft)) && (
                <div>
                  <MilkdownEditorWrapper>
                    <ArticleEditor
                        ref={editorRef}
                        initialValue={content}
                        onChange={setContent}
                        onImageAdded={(image) => {uploadDraftImage(image)}}
                        onImageDeleted={(index: number) => {deleteDraftImage(index)}}
                        computeDraftImageURL={(url) => computeImageDraftUrl(url)}
                        placeholder="What's on your mind?"
                        className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px]"
                    />
                  </MilkdownEditorWrapper>
                </div>
            )}


            {/* AI Processing Note */}
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="text-sm text-purple-700">
                <strong>Note:</strong> Summary, tags, and category will be automatically
                generated by AI after publishing.
              </div>
            </div>

            {/* Footer Stats and Actions */}
            <div className="pt-6 border-t border-gray-100">
              <div
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                  <span className="text-xs text-gray-500">
                    {getPlainTextFromMarkdown(content).length} characters
                  </span>
                  <span className="text-xs text-gray-500">
                    ~{calculateReadingTime(getPlainTextFromMarkdown(content))} min read
                  </span>
                </div>

                {account && account.id === draft?.authorId && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDraft}
                        disabled={!draft || deletingDraft}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                    >
                      {deletingDraft ? 'Clearing Draft ...' : 'Clear Draft'}
                    </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
