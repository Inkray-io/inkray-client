"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { SearchBox, Hits, useInstantSearch, Configure } from "react-instantsearch"
import { InstantSearchNext } from "react-instantsearch-nextjs"
import { HiMagnifyingGlass, HiXMark, HiDocumentText, HiUserGroup, HiSparkles, HiCheckBadge } from "react-icons/hi2"
import { searchClient, ARTICLES_INDEX, PUBLICATIONS_INDEX, isAlgoliaConfigured, type ArticleHit, type PublicationHit } from "@/lib/algolia"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { AddressDisplay } from "@/components/ui/AddressDisplay"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SearchTab = "articles" | "publications"

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("articles")
  const router = useRouter()

  const handleResultClick = useCallback((type: "article" | "publication", id: string) => {
    onOpenChange(false)
    if (type === "article") {
      router.push(ROUTES.ARTICLE_WITH_ID(id))
    } else {
      router.push(ROUTES.PUBLICATION_WITH_ID(id))
    }
  }, [router, onOpenChange])

  if (!isAlgoliaConfigured() || !searchClient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm bg-black/60" />
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-background/95 backdrop-blur-xl"
            aria-describedby={undefined}
          >
            <VisuallyHidden.Root>
              <DialogTitle>Search</DialogTitle>
            </VisuallyHidden.Root>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <HiMagnifyingGlass className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Search Not Available</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Search is not configured. Please set up Algolia environment variables.
              </p>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    )
  }

  const currentIndex = activeTab === "articles" ? ARTICLES_INDEX : PUBLICATIONS_INDEX

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/60" />
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-background/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Search articles and publications</DialogTitle>
          </VisuallyHidden.Root>
          <InstantSearchNext
            key={currentIndex}
            searchClient={searchClient}
            indexName={currentIndex}
            future={{ preserveSharedStateOnUnmount: true }}
          >
            <Configure hitsPerPage={8} />

            {/* Search Header */}
            <div className="relative border-b border-border/50">
              <div className="flex items-center px-4 py-3">
                <HiMagnifyingGlass className="size-5 text-muted-foreground shrink-0" />
                <SearchBox
                  placeholder="Search articles and publications..."
                  classNames={{
                    root: "flex-1",
                    form: "relative",
                    input: "w-full bg-transparent border-0 px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0",
                    submit: "hidden",
                    reset: "hidden",
                    loadingIndicator: "hidden",
                  }}
                  autoFocus
                />
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">ESC</kbd>
                  <span>to close</span>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="sm:hidden p-1.5 hover:bg-muted rounded-md transition-colors"
                >
                  <HiXMark className="size-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setActiveTab("articles")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                  activeTab === "articles"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HiDocumentText className="size-4" />
                Articles
                {activeTab === "articles" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("publications")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                  activeTab === "publications"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HiUserGroup className="size-4" />
                Publications
                {activeTab === "publications" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto max-h-[calc(85vh-140px)] min-h-[300px]">
              <SearchResults
                tab={activeTab}
                onResultClick={handleResultClick}
              />
            </div>
          </InstantSearchNext>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

interface SearchResultsProps {
  tab: SearchTab
  onResultClick: (type: "article" | "publication", id: string) => void
}

function SearchResults({ tab, onResultClick }: SearchResultsProps) {
  const { status, results } = useInstantSearch()

  if (status === "loading" || status === "stalled") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground">Searching...</p>
      </div>
    )
  }

  if (!results?.query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <HiMagnifyingGlass className="size-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground text-sm">
          Start typing to search {tab}
        </p>
      </div>
    )
  }

  if (results.nbHits === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <HiDocumentText className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-medium mb-1">No results found</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          No {tab} match your search. Try different keywords.
        </p>
      </div>
    )
  }

  return (
    <Hits
      hitComponent={({ hit }) => (
        tab === "articles"
          ? <ArticleHitComponent hit={hit as unknown as ArticleHit} onClick={onResultClick} />
          : <PublicationHitComponent hit={hit as unknown as PublicationHit} onClick={onResultClick} />
      )}
      classNames={{
        root: "divide-y divide-border/50",
        list: "divide-y divide-border/50",
        item: "",
      }}
    />
  )
}

interface ArticleHitComponentProps {
  hit: ArticleHit
  onClick: (type: "article" | "publication", id: string) => void
}

function ArticleHitComponent({ hit, onClick }: ArticleHitComponentProps) {
  return (
    <button
      onClick={() => onClick("article", hit.slug)}
      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
            <HiDocumentText className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {hit.title}
            </h4>
            {hit.gating > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                <HiSparkles className="size-3" />
                Gated
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
            {hit.summary}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {hit.author ? (
              <AddressDisplay
                address={hit.author}
                variant="compact"
                textSize="text-[11px]"
                className="font-mono"
              />
            ) : (
              <span className="font-mono">Unknown</span>
            )}
            <span className="size-1 rounded-full bg-muted-foreground/30" />
            <span>{hit.categoryName}</span>
            <span className="size-1 rounded-full bg-muted-foreground/30" />
            <span>{hit.viewCount} views</span>
          </div>
        </div>
      </div>
    </button>
  )
}

interface PublicationHitComponentProps {
  hit: PublicationHit
  onClick: (type: "article" | "publication", id: string) => void
}

function PublicationHitComponent({ hit, onClick }: PublicationHitComponentProps) {
  const displayName = hit.name || "Unnamed Publication"

  return (
    <button
      onClick={() => onClick("publication", hit.objectID)}
      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {hit.avatar ? (
            <img
              src={hit.avatar}
              alt={displayName}
              className="size-10 rounded-lg object-cover"
            />
          ) : (
            <div className="size-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {displayName}
            </h4>
            {hit.isVerified && (
              <HiCheckBadge className="size-4 text-primary shrink-0" />
            )}
          </div>
          {hit.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
              {hit.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {hit.owner ? (
              <AddressDisplay
                address={hit.owner}
                variant="compact"
                textSize="text-[11px]"
                className="font-mono"
              />
            ) : (
              <span className="font-mono">Unknown</span>
            )}
            {hit.tags && hit.tags.length > 0 && (
              <>
                <span className="size-1 rounded-full bg-muted-foreground/30" />
                <span>{hit.tags.slice(0, 2).join(", ")}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
