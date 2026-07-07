'use client';
import { useAuth } from "@/contexts/AuthContext";
import useDraftMode from "@/hooks/useDraftMode";
import { useRouter } from "next/navigation";
import { useArticleCreation, useToast } from "@/hooks";
import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { ArticleEditorRef } from "@/components/editor/ArticleEditor";

// The Milkdown editor is ~400kB of JS — load it only when the create page
// actually renders, with a lightweight placeholder while it downloads.
const ArticleEditor = dynamic(
  () => import("@/components/editor/ArticleEditorLazy"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[320px] rounded-xl border border-gray-100 bg-gray-50/50 animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading editor…</span>
      </div>
    ),
  },
);
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Trash2, CalendarClock, X, MoreHorizontal, Lock, LockOpen, Sparkles, Check } from "lucide-react";
import { HiDocumentText } from "react-icons/hi2";
import { MilkdownEditorWrapper } from "@/components/editor/MilkdownEditorWrapper";
import { getPlainTextFromMarkdown } from "@/lib/utils/markdown";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScheduleModal } from "@/components/article/ScheduleModal";

// Calculate reading time from word count (average 200 words per minute)
function calculateReadingTime(plainText: string): number {
  if (!plainText) return 0
  const words = plainText.split(/\s+/).filter(word => word.length > 0)
  return Math.ceil(words.length / 200) || 0
}

function countWords(plainText: string): number {
  if (!plainText) return 0
  return plainText.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Lightweight overflow menu for secondary draft actions (lock/clear).
 * Keeps the primary action bar focused on Schedule + Publish.
 */
function OverflowMenu({ children }: { children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-gray-500 hover:text-gray-700"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="size-4" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 bg-white p-1 shadow-lg z-40"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export default function ArticleCreationPage() {
  const { account } = useAuth();
  const {
    draftId,
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
    setEditLock,
    schedulingDraft,
    scheduleDraft,
    cancellingSchedule,
    cancelSchedule,
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
  const [ contentInitialized, setContentInitialized ] = useState(false)
  const [ isWaitingForRedirect, setIsWaitingForRedirect ] = useState(false)
  const [ clearDialogOpen, setClearDialogOpen ] = useState(false)
  const [ scheduleModalOpen, setScheduleModalOpen ] = useState(false)

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
    if (draft && !contentInitialized) {
      if (draft.title) {
        setTitle(draft.title);
      }
      if (draft.content) {
        setContent(draft.content);
      }
      setContentInitialized(true);
    }
  }, [ draft, contentInitialized ]);


  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please fill in both title and content to publish.",
        variant: "destructive",
      })
      return
    }

    if (!wordsInBounds) {
      toast({
        title: wordCount < MIN_WORDS ? "Article too short" : "Article too long",
        description:
          wordCount < MIN_WORDS
            ? `Articles need at least ${MIN_WORDS} words — you have ${wordCount}.`
            : `Articles can be at most ${MAX_WORDS.toLocaleString()} words — you have ${wordCount.toLocaleString()}.`,
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
      setContentInitialized(false)
      editorRef.current?.clearTemporaryImages()
    }
    // Clear the guard on the next tick — autosave is allowed again after that.
    setTimeout(() => { skipAutosaveRef.current = false }, 50)
  }
  const handleClearDraftClick = () => {
    setClearDialogOpen(true)
  }

  const handleConfirmClearDraft = async () => {
    await destroyDraft()
    setClearDialogOpen(false)
  }

  const handleSchedule = async (date: Date) => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please fill in both title and content to schedule.",
        variant: "destructive",
      })
      return
    }

    if (!wordsInBounds) {
      toast({
        title: wordCount < MIN_WORDS ? "Article too short" : "Article too long",
        description:
          wordCount < MIN_WORDS
            ? `Articles need at least ${MIN_WORDS} words — you have ${wordCount}.`
            : `Articles can be at most ${MAX_WORDS.toLocaleString()} words — you have ${wordCount.toLocaleString()}.`,
        variant: "destructive",
      })
      return
    }

    const success = await scheduleDraft(date);
    if (success) {
      setScheduleModalOpen(false);
      toast({
        title: "Article Scheduled!",
        description: `Your article will be published on ${date.toLocaleString()}.`,
      });
    } else {
      toast({
        title: "Scheduling Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleCancelSchedule = async () => {
    const success = await cancelSchedule();
    if (success) {
      toast({
        title: "Schedule Cancelled",
        description: "Your article is no longer scheduled for publishing.",
      });
    } else {
      toast({
        title: "Failed to Cancel",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  // Format scheduled time for display
  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const plainText = getPlainTextFromMarkdown(content)
  const wordCount = countWords(plainText)
  const readingTime = calculateReadingTime(plainText)
  const isOwner = !!(account && draft && account.id === draft.authorId)
  const isBusy = isProcessing || isWaitingForRedirect
  const MIN_WORDS = 100
  const MAX_WORDS = 10000
  const wordsInBounds = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS
  const canPublish = !!title.trim() && !!content.trim() && wordsInBounds

  return (
      <>
        {/* A11y page heading — visual hero is the title input below */}
        <h1 className="sr-only">Create article</h1>

        {/* Sticky action bar — stays reachable at any scroll depth */}
        <div className="sticky top-20 lg:top-24 z-30 mb-5 rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5">
            {/* Save / draft status */}
            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-500">
              <span className="hidden sm:inline font-medium text-gray-700">Draft</span>
              <span className="hidden sm:block h-3.5 w-px bg-gray-200" />
              {savingDraft ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-400">
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving…
                  </span>
              ) : lastSavedAt ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-400">
                    <Check className="size-3.5 text-emerald-500" />
                    <span className="truncate">Saved {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  </span>
              ) : (
                  <span className="text-gray-400">Not saved yet</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isOwner && (
                  draft?.scheduledPublishAt ? (
                      <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 pl-2.5 pr-1 py-1">
                        <CalendarClock className="size-4 text-amber-600" />
                        <span className="hidden sm:inline text-xs font-medium text-amber-700">
                          {formatScheduledTime(draft.scheduledPublishAt)}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setScheduleModalOpen(true)}
                                disabled={schedulingDraft}
                                className="size-6 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                            >
                              <CalendarClock className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit schedule</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelSchedule}
                                disabled={cancellingSchedule}
                                className="size-6 text-amber-600 hover:text-red-600 hover:bg-red-50"
                            >
                              {cancellingSchedule ? (
                                  <Loader2 className="size-3 animate-spin" />
                              ) : (
                                  <X className="size-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Cancel schedule</TooltipContent>
                        </Tooltip>
                      </div>
                  ) : (
                      <Button
                          variant="outline"
                          onClick={() => setScheduleModalOpen(true)}
                          disabled={schedulingDraft || !canPublish}
                          className="gap-2 min-h-[38px]"
                      >
                        {schedulingDraft ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <CalendarClock className="size-4" />
                        )}
                        <span className="hidden sm:inline">Schedule</span>
                      </Button>
                  )
              )}

              {isOwner && (
                  <Button
                      onClick={handlePublish}
                      disabled={isBusy || !canPublish || !!draft?.scheduledPublishAt}
                      className="bg-primary hover:bg-primary/90 text-white gap-2 disabled:opacity-50 min-h-[38px]"
                  >
                    {isBusy ? (
                        <>
                          <Loader2 className="size-4 animate-spin"/>
                          {isWaitingForRedirect ? 'Publishing…' : uploadProgress > 0 ? `Uploading… ${uploadProgress}%` : 'Processing…'}
                        </>
                    ) : (
                        <>
                          <HiDocumentText className="size-4"/>
                          Publish
                        </>
                    )}
                  </Button>
              )}

              {isOwner && (
                  <OverflowMenu>
                    {(close) => (
                        <>
                          <button
                              role="menuitem"
                              onClick={async () => {
                                close()
                                const newAllow = !draft!.allowDraftEditing;
                                const ok = await setEditLock(newAllow);
                                if (ok) {
                                  toast({
                                    title: 'Draft updated',
                                    description: newAllow ? 'Editing allowed for this draft.' : 'Editing locked for this draft.'
                                  })
                                }
                              }}
                              disabled={settingEditLock}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {settingEditLock ? (
                                <Loader2 className="size-4 animate-spin text-gray-400" />
                            ) : draft!.allowDraftEditing ? (
                                <Lock className="size-4 text-gray-400" />
                            ) : (
                                <LockOpen className="size-4 text-gray-400" />
                            )}
                            {draft!.allowDraftEditing ? 'Lock editing' : 'Allow editing'}
                          </button>
                          <button
                              role="menuitem"
                              onClick={() => { close(); handleClearDraftClick() }}
                              disabled={deletingDraft}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingDraft ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            Clear draft
                          </button>
                        </>
                    )}
                  </OverflowMenu>
              )}
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
            <div
                className="mb-5 p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3">
              <AlertCircle
                  className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"/>
              <div className="flex-1">
                <p className="text-red-800 text-sm font-medium mb-1">
                  Publishing error
                </p>
                <p className="text-red-700 text-sm">
                  {error}
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-100 p-0 h-auto"
                >
                  Dismiss
                </Button>
              </div>
            </div>
        )}

        {/* Writing canvas — centered to a comfortable measure */}
        <div className="bg-white rounded-2xl">
          <div className="mx-auto max-w-[880px] px-5 sm:px-8 md:px-10 pt-8 sm:pt-10">
            {/* Title — the visual hero */}
            <input
                type="text"
                placeholder="Article title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl sm:text-4xl font-bold leading-tight tracking-tight border-none outline-none bg-transparent placeholder-gray-300 text-black focus:outline-none"
            />

            <div className="h-px bg-gray-100 my-6" />

            {/* Content editor */}
            {((draft && contentInitialized) || (!draftId && !loadingDraft)) && (
                <MilkdownEditorWrapper>
                  <ArticleEditor
                      editorRef={editorRef}
                      initialValue={content}
                      onChange={setContent}
                      onImageUpload={uploadDraftImage}
                      onImageDeleted={(imageId: string) => {deleteDraftImage(imageId)}}
                      computeDraftImageURL={(url) => computeImageDraftUrl(url)}
                      placeholder="Start writing… Type “/” to add images, code, and more."
                      className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px]"
                  />
                </MilkdownEditorWrapper>
            )}
          </div>

          {/* Footer meta — quiet, always under the canvas */}
          <div className="mx-auto max-w-[880px] px-5 sm:px-8 md:px-10 pb-8 sm:pb-10">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 pt-5 text-xs text-gray-400">
              <span className={!wordsInBounds && wordCount > 0 ? 'text-amber-600 font-medium' : undefined}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
                {wordCount > 0 && wordCount < MIN_WORDS && ` — ${MIN_WORDS - wordCount} more to publish (min ${MIN_WORDS})`}
                {wordCount > MAX_WORDS && ` — over the ${MAX_WORDS.toLocaleString()}-word limit`}
              </span>
              <span aria-hidden="true">·</span>
              <span>~{readingTime} min read</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3" />
                AI adds a summary, tags &amp; category on publish
              </span>
            </div>
          </div>
        </div>
        <ConfirmationDialog
            open={clearDialogOpen}
            onOpenChange={setClearDialogOpen}
            title="Clear Draft"
            description="Are you sure you want to clear this draft? All content will be permanently deleted."
            confirmLabel="Clear Draft"
            onConfirm={handleConfirmClearDraft}
            isLoading={deletingDraft}
            variant="destructive"
        />
        <ScheduleModal
            open={scheduleModalOpen}
            onOpenChange={setScheduleModalOpen}
            onSchedule={handleSchedule}
            isLoading={schedulingDraft}
        />
      </>
  );
};
