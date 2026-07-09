"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import {
  HiMagnifyingGlass,
  HiXMark,
  HiDocumentText,
  HiUserGroup,
  HiUser,
  HiSparkles,
  HiCheckBadge,
  HiEye,
} from "react-icons/hi2"
import { useSearch, MIN_SEARCH_LENGTH } from "@/hooks/useSearch"
import type {
  ArticleSearchResult,
  PublicationSearchResult,
  UserSearchResult,
} from "@/lib/api"
import { Avatar } from "@/components/ui/Avatar"
import { VerifiedBadge } from "@/components/ui/VerifiedBadge"
import {
  createPublicationAvatarConfig,
  createUserAvatarConfig,
} from "@/lib/utils/avatar"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SearchTab = "articles" | "publications" | "users"

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("articles")
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const router = useRouter()

  // Debounce keystrokes → query (250ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(value), 250)
  }, [])
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // Reset on close so reopening starts fresh
  useEffect(() => {
    if (!open) {
      setInput("")
      setQuery("")
      setActiveTab("articles")
    }
  }, [open])

  const { data, isFetching } = useSearch(query)
  const hasQuery = query.trim().length >= MIN_SEARCH_LENGTH
  const articles = data?.articles ?? []
  const publications = data?.publications ?? []
  const users = data?.users ?? []

  const handleResultClick = useCallback(
    (type: "article" | "publication" | "user", id: string) => {
      onOpenChange(false)
      if (type === "article") {
        router.push(ROUTES.ARTICLE_WITH_ID(id))
      } else if (type === "user") {
        router.push(ROUTES.PROFILE_WITH_ID(id))
      } else {
        router.push(ROUTES.PUBLICATION_WITH_ID(id))
      }
    },
    [router, onOpenChange],
  )

  const tabs: { id: SearchTab; label: string; icon: typeof HiDocumentText; count: number | null }[] = [
    {
      id: "articles",
      label: "Articles",
      icon: HiDocumentText,
      count: hasQuery && data ? articles.length : null,
    },
    {
      id: "publications",
      label: "Publications",
      icon: HiUserGroup,
      count: hasQuery && data ? publications.length : null,
    },
    {
      id: "users",
      label: "People",
      icon: HiUser,
      count: hasQuery && data ? users.length : null,
    },
  ]

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
            <DialogTitle>Search articles, publications, and people</DialogTitle>
          </VisuallyHidden.Root>

          {/* Search Header */}
          <div className="relative border-b border-border/50">
            <div className="flex items-center px-4 py-3">
              <HiMagnifyingGlass
                className={cn(
                  "size-5 shrink-0 transition-colors",
                  isFetching ? "text-primary animate-pulse" : "text-muted-foreground",
                )}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search articles, publications, people…"
                className="flex-1 w-full bg-transparent border-0 px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">ESC</kbd>
                <span>to close</span>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="sm:hidden p-1.5 hover:bg-muted rounded-md transition-colors"
                aria-label="Close search"
              >
                <HiXMark className="size-5" />
              </button>
            </div>
          </div>

          {/* Tabs — with live result counts */}
          <div className="flex border-b border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)] min-h-[300px]">
            {!hasQuery ? (
              <EmptyState
                icon={HiMagnifyingGlass}
                title="Search Inkray"
                message="Find articles by title or topic, publications by name, and people by wallet address, SuiNS name, or connected X handle."
              />
            ) : !data && isFetching ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="mt-4 text-sm text-muted-foreground">Searching…</p>
              </div>
            ) : activeTab === "articles" ? (
              articles.length === 0 ? (
                <EmptyState
                  icon={HiDocumentText}
                  title="No articles found"
                  message={`Nothing matches “${query.trim()}”. Try a different word — or check the other tabs.`}
                />
              ) : (
                <div className="divide-y divide-border/50">
                  {articles.map((hit) => (
                    <ArticleRow key={hit.articleId} hit={hit} onClick={handleResultClick} />
                  ))}
                </div>
              )
            ) : activeTab === "publications" ? (
              publications.length === 0 ? (
                <EmptyState
                  icon={HiUserGroup}
                  title="No publications found"
                  message={`Nothing matches “${query.trim()}”. Try a different name — or check the other tabs.`}
                />
              ) : (
                <div className="divide-y divide-border/50">
                  {publications.map((hit) => (
                    <PublicationRow key={hit.id} hit={hit} onClick={handleResultClick} />
                  ))}
                </div>
              )
            ) : users.length === 0 ? (
              <EmptyState
                icon={HiUser}
                title="No people found"
                message={`Nothing matches “${query.trim()}”. Search by wallet address, SuiNS name, or a connected X handle.`}
              />
            ) : (
              <div className="divide-y divide-border/50">
                {users.map((hit) => (
                  <UserRow key={hit.address} hit={hit} onClick={handleResultClick} />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: typeof HiMagnifyingGlass
  title: string
  message: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="size-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-medium mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
    </div>
  )
}

function ArticleRow({
  hit,
  onClick,
}: {
  hit: ArticleSearchResult
  onClick: (type: "article" | "publication", id: string) => void
}) {
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
          {hit.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{hit.summary}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {hit.publicationName && (
              <>
                <span className="font-medium text-foreground/70 truncate max-w-40">
                  {hit.publicationName}
                </span>
                <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0" />
              </>
            )}
            <span className="shrink-0">{hit.categoryName}</span>
            <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0" />
            <span className="flex items-center gap-1 shrink-0">
              <HiEye className="size-3" />
              {hit.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function PublicationRow({
  hit,
  onClick,
}: {
  hit: PublicationSearchResult
  onClick: (type: "article" | "publication", id: string) => void
}) {
  const displayName = hit.name || "Unnamed Publication"
  const avatarConfig = createPublicationAvatarConfig(
    { id: hit.id, name: displayName, avatar: hit.avatar },
    "md",
  )

  return (
    <button
      onClick={() => onClick("publication", hit.id)}
      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Avatar {...avatarConfig} className="size-10 rounded-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {displayName}
            </h4>
            {hit.isVerified && <HiCheckBadge className="size-4 text-primary shrink-0" />}
          </div>
          {hit.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{hit.description}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 shrink-0">
              <HiUserGroup className="size-3" />
              <span className="tabular-nums">{hit.followerCount.toLocaleString()}</span>
              {hit.followerCount === 1 ? "follower" : "followers"}
            </span>
            {hit.tags && hit.tags.length > 0 && (
              <>
                <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="truncate">{hit.tags.slice(0, 2).join(", ")}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function UserRow({
  hit,
  onClick,
}: {
  hit: UserSearchResult
  onClick: (type: "article" | "publication" | "user", id: string) => void
}) {
  const displayName = hit.username || hit.suinsName || shortAddress(hit.address)
  const avatarConfig = createUserAvatarConfig(
    {
      publicKey: hit.address,
      name: hit.username || hit.suinsName || undefined,
      avatar: hit.avatar,
    },
    "md",
  )
  const showSuins = hit.suinsName && hit.suinsName !== displayName

  return (
    <button
      onClick={() => onClick("user", hit.address)}
      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Avatar {...avatarConfig} className="size-10 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {displayName}
            </h4>
            {hit.xVerified && (
              <VerifiedBadge size="sm" label="Verified X account" className="shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {showSuins && (
              <>
                <span className="truncate text-foreground/70">{hit.suinsName}</span>
                <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0" />
              </>
            )}
            <span className="font-mono shrink-0">{shortAddress(hit.address)}</span>
            {hit.xUsername && (
              <>
                <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="truncate">@{hit.xUsername}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
