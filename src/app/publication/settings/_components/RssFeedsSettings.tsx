"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HiRss,
  HiPlus,
  HiTrash,
  HiArrowPath,
  HiCheckCircle,
  HiExclamationCircle,
  HiClock,
  HiDocumentText,
  HiXMark,
  HiPause,
  HiPlay,
  HiCog6Tooth,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import { SettingsInfoBox } from "./SettingsInfoBox";
import { FieldMappingDialog } from "./FieldMappingDialog";
import { useRssFeeds } from "@/hooks/useRssFeeds";
import { RssFeed, RssFeedPreviewResult, FieldMappings } from "@/lib/api";

interface RssFeedsSettingsProps {
  publicationId: string;
}

const MAX_FEEDS = 5;

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function FeedStatusBadge({ status, lastSyncError }: { status: string; lastSyncError: string | null }) {
  if (status === "error" || lastSyncError) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 text-xs">
        <HiExclamationCircle className="size-3 mr-1" />
        Error
      </Badge>
    );
  }

  if (status === "paused") {
    return (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
        <HiPause className="size-3 mr-1" />
        Paused
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
      <HiCheckCircle className="size-3 mr-1" />
      Active
    </Badge>
  );
}

interface FeedCardProps {
  feed: RssFeed;
  onDelete: (feedId: string) => void;
  onSync: (feedId: string) => void;
  onToggleStatus: (feedId: string, newStatus: "active" | "paused") => void;
  onToggleAutoPublish: (feedId: string, autoPublish: boolean) => void;
  isSyncing: boolean;
  isDeleting: boolean;
}

function FeedCard({
  feed,
  onDelete,
  onSync,
  onToggleStatus,
  onToggleAutoPublish,
  isSyncing,
  isDeleting,
}: FeedCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(feed.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const hostname = (() => {
    try {
      return new URL(feed.url).hostname.replace("www.", "");
    } catch {
      return feed.url;
    }
  })();

  return (
    <div
      className={cn(
        "group relative bg-gradient-to-br from-gray-50/80 to-white rounded-xl border border-gray-100 p-4 transition-all duration-200",
        "hover:border-gray-200 hover:shadow-sm",
        feed.status === "paused" && "opacity-75"
      )}
    >
      {/* Feed Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
            <HiRss className="size-5 text-orange-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 truncate">
              {feed.name || hostname}
            </h4>
            <p className="text-xs text-gray-500 truncate">{feed.url}</p>
          </div>
        </div>
        <FeedStatusBadge status={feed.status} lastSyncError={feed.lastSyncError} />
      </div>

      {/* Feed Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1.5">
          <HiClock className="size-3.5" />
          <span>Last sync: {formatRelativeTime(feed.lastSyncAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HiDocumentText className="size-3.5" />
          <span>{feed.itemCount} articles imported</span>
        </div>
      </div>

      {/* Error Message */}
      {feed.lastSyncError && (
        <div className="mb-4 p-2.5 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs text-red-600 line-clamp-2">{feed.lastSyncError}</p>
        </div>
      )}

      {/* Auto-publish Toggle */}
      <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50/80 rounded-lg mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Auto-publish articles</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500">
            {feed.autoPublish ? "On" : "Off"}
          </Badge>
        </div>
        <button
          onClick={() => onToggleAutoPublish(feed.id, !feed.autoPublish)}
          className={cn(
            "relative w-10 h-5 rounded-full transition-colors duration-200",
            feed.autoPublish ? "bg-primary" : "bg-gray-300"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
              feed.autoPublish && "translate-x-5"
            )}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSync(feed.id)}
          disabled={isSyncing || feed.status === "paused"}
          className="flex-1 h-8 text-xs"
        >
          {isSyncing ? (
            <>
              <HiArrowPath className="size-3.5 mr-1.5 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <HiArrowPath className="size-3.5 mr-1.5" />
              Sync Now
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleStatus(feed.id, feed.status === "active" ? "paused" : "active")}
          className="h-8 w-8 p-0"
          title={feed.status === "active" ? "Pause feed" : "Resume feed"}
        >
          {feed.status === "active" ? (
            <HiPause className="size-4 text-gray-500" />
          ) : (
            <HiPlay className="size-4 text-gray-500" />
          )}
        </Button>

        {showDeleteConfirm ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 text-xs px-2"
            >
              {isDeleting ? "..." : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="h-8 w-8 p-0"
            >
              <HiXMark className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            title="Delete feed"
          >
            <HiTrash className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function RssFeedsSettings({ publicationId }: RssFeedsSettingsProps) {
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedAutoPublish, setNewFeedAutoPublish] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    title?: string;
    error?: string;
  } | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingFeedId, setDeletingFeedId] = useState<string | null>(null);

  // Field mapping state
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [previewResult, setPreviewResult] = useState<RssFeedPreviewResult | null>(null);
  const [customMappings, setCustomMappings] = useState<FieldMappings | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [pendingAddFeed, setPendingAddFeed] = useState(false); // Track if user clicked "Add Feed" without configuring fields

  const {
    feeds,
    isLoading,
    error,
    addFeed,
    updateFeed,
    deleteFeed,
    triggerSync,
    validateFeed,
    previewFeed,
    isAddingFeed,
    isSyncing,
  } = useRssFeeds({ publicationId });

  const handleValidateUrl = async () => {
    if (!newFeedUrl.trim()) return;

    setIsValidating(true);
    setValidationResult(null);
    setAddError(null);
    setCustomMappings(null); // Reset custom mappings when re-validating

    const result = await validateFeed(newFeedUrl);
    setValidationResult(result);
    setIsValidating(false);

    // Auto-fill name if validation successful and no custom name
    if (result?.valid && result.title && !newFeedName) {
      setNewFeedName(result.title);
    }
  };

  const handleOpenFieldMapping = async () => {
    if (!newFeedUrl.trim()) return;

    setIsLoadingPreview(true);
    const preview = await previewFeed(newFeedUrl);
    setPreviewResult(preview);
    setIsLoadingPreview(false);

    if (preview?.valid && preview.sampleItem) {
      setShowFieldMapping(true);
    }
  };

  const handleFieldMappingConfirm = async (mappings: FieldMappings) => {
    setCustomMappings(mappings);
    setShowFieldMapping(false);

    // If user clicked "Add Feed" and we were waiting for field configuration, now add the feed
    if (pendingAddFeed) {
      setPendingAddFeed(false);
      await doAddFeed(mappings);
    }
  };

  // Internal function to actually add the feed
  const doAddFeed = async (mappings: FieldMappings) => {
    setAddError(null);

    try {
      await addFeed({
        url: newFeedUrl,
        name: newFeedName || undefined,
        autoPublish: newFeedAutoPublish,
        fieldMappings: mappings,
      });

      // Reset form on success
      setNewFeedUrl("");
      setNewFeedName("");
      setNewFeedAutoPublish(false);
      setValidationResult(null);
      setCustomMappings(null);
      setPreviewResult(null);
    } catch (err: any) {
      setAddError(err.message || "Failed to add feed");
    }
  };

  const handleAddFeed = async () => {
    if (!newFeedUrl.trim()) return;

    // If user has already configured field mappings, proceed directly
    if (customMappings) {
      await doAddFeed(customMappings);
      return;
    }

    // User hasn't configured fields yet - show the dialog first
    setAddError(null);
    setPendingAddFeed(true);

    // If we don't have a preview yet, load it first
    if (!previewResult) {
      setIsLoadingPreview(true);
      const preview = await previewFeed(newFeedUrl);
      setPreviewResult(preview);
      setIsLoadingPreview(false);

      if (preview?.valid && preview.sampleItem) {
        setShowFieldMapping(true);
      } else {
        // Preview failed, reset pending state
        setPendingAddFeed(false);
        setAddError("Failed to load feed preview. Please try again.");
      }
    } else {
      // We already have a preview, just show the dialog
      setShowFieldMapping(true);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    setDeletingFeedId(feedId);
    try {
      await deleteFeed(feedId);
    } catch {
      // Error handled by hook
    } finally {
      setDeletingFeedId(null);
    }
  };

  const handleToggleStatus = async (feedId: string, newStatus: "active" | "paused") => {
    await updateFeed(feedId, { status: newStatus });
  };

  const handleToggleAutoPublish = async (feedId: string, autoPublish: boolean) => {
    await updateFeed(feedId, { autoPublish });
  };

  const canAddMore = feeds.length < MAX_FEEDS;

  return (
    <SettingsSection
      title="RSS Feed Import"
      description="Import articles from external RSS feeds into your publication as drafts."
    >
      {/* Add Feed Card */}
      <SettingsCard>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Add New Feed</h3>
            <Badge variant="outline" className="text-xs">
              {feeds.length}/{MAX_FEEDS} feeds
            </Badge>
          </div>

          {!canAddMore ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                You&apos;ve reached the maximum of {MAX_FEEDS} RSS feeds. Remove an existing feed to add a new one.
              </p>
            </div>
          ) : (
            <>
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  RSS Feed URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newFeedUrl}
                    onChange={(e) => {
                      setNewFeedUrl(e.target.value);
                      setValidationResult(null);
                      setAddError(null);
                    }}
                    placeholder="https://example.com/feed.xml"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <Button
                    variant="outline"
                    onClick={handleValidateUrl}
                    disabled={!newFeedUrl.trim() || isValidating}
                    className="px-4"
                  >
                    {isValidating ? (
                      <HiArrowPath className="size-4 animate-spin" />
                    ) : (
                      "Validate"
                    )}
                  </Button>
                </div>
              </div>

              {/* Validation Result */}
              {validationResult && (
                <div
                  className={cn(
                    "p-3 rounded-xl border flex items-start gap-3",
                    validationResult.valid
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  {validationResult.valid ? (
                    <>
                      <HiCheckCircle className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-800">
                          Valid RSS Feed
                        </p>
                        {validationResult.title && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {validationResult.title}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Invalid Feed
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          {validationResult.error || "Could not parse RSS feed"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Configure Fields Button - shown after successful validation */}
              {validationResult?.valid && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenFieldMapping}
                    disabled={isLoadingPreview}
                    className="flex-shrink-0"
                  >
                    {isLoadingPreview ? (
                      <>
                        <HiArrowPath className="size-3.5 mr-1.5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <HiCog6Tooth className="size-3.5 mr-1.5" />
                        Configure Fields
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-gray-500">
                    Customize which RSS fields map to title & content
                  </span>
                  {customMappings && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Custom mapping set
                    </Badge>
                  )}
                </div>
              )}

              {/* Name Input (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Display Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  placeholder="My Tech News Feed"
                  maxLength={100}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Auto-publish Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-publish articles</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When enabled, imported articles will be published directly instead of saved as drafts
                  </p>
                </div>
                <button
                  onClick={() => setNewFeedAutoPublish(!newFeedAutoPublish)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
                    newFeedAutoPublish ? "bg-primary" : "bg-gray-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                      newFeedAutoPublish && "translate-x-5"
                    )}
                  />
                </button>
              </div>

              {/* Error Display */}
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <HiExclamationCircle className="size-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{addError}</p>
                  </div>
                </div>
              )}

              {/* Add Button */}
              <Button
                onClick={handleAddFeed}
                disabled={
                  !newFeedUrl.trim() ||
                  isAddingFeed ||
                  isLoadingPreview ||
                  (validationResult !== null && !validationResult.valid)
                }
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                {isAddingFeed ? (
                  <>
                    <HiArrowPath className="size-4 mr-2 animate-spin" />
                    Adding Feed...
                  </>
                ) : isLoadingPreview ? (
                  <>
                    <HiArrowPath className="size-4 mr-2 animate-spin" />
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <HiPlus className="size-4 mr-2" />
                    Add RSS Feed
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </SettingsCard>

      {/* Existing Feeds */}
      <SettingsCard>
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Your RSS Feeds</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 rounded-xl h-36"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          ) : feeds.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                <HiRss className="size-7 text-orange-500" />
              </div>
              <p className="text-gray-900 font-medium mb-1">No RSS feeds yet</p>
              <p className="text-sm text-gray-500">
                Add your first RSS feed to start importing articles
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <FeedCard
                  key={feed.id}
                  feed={feed}
                  onDelete={handleDeleteFeed}
                  onSync={triggerSync}
                  onToggleStatus={handleToggleStatus}
                  onToggleAutoPublish={handleToggleAutoPublish}
                  isSyncing={isSyncing === feed.id}
                  isDeleting={deletingFeedId === feed.id}
                />
              ))}
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Info Note */}
      <SettingsInfoBox
        icon={HiRss}
        title="How RSS Import Works"
        variant="info"
      >
        <ul className="space-y-1 text-xs">
          <li>Feeds are synced automatically every hour</li>
          <li>New articles are saved as drafts for your review</li>
          <li>Enable auto-publish to skip the draft step</li>
          <li>Duplicate articles are automatically detected and skipped</li>
        </ul>
      </SettingsInfoBox>

      {/* Field Mapping Dialog */}
      <FieldMappingDialog
        open={showFieldMapping}
        onOpenChange={(open) => {
          setShowFieldMapping(open);
          // If dialog is being closed (cancelled), reset pending state
          if (!open) {
            setPendingAddFeed(false);
          }
        }}
        preview={previewResult}
        onConfirm={handleFieldMappingConfirm}
      />
    </SettingsSection>
  );
}
