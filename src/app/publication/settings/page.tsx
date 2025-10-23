"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { usePublication } from "@/hooks/usePublication"
import { useUserPublications } from "@/hooks/useUserPublications"
import { useSubscriptionSettings } from "@/hooks/useSubscriptionSettings"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { HiCog6Tooth, HiCurrencyDollar, HiUserGroup, HiChartBarSquare, HiCheckCircle, HiExclamationCircle } from "react-icons/hi2"
import { cn } from "@/lib/utils"
import { addressesEqual } from "@/utils/address"
import Link from "next/link"

interface TabConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<{ publicationId: string }>
}

// Subscription Settings component with smart contract integration
function SubscriptionSettings({ publicationId }: { publicationId: string }) {
  const { firstPublication } = useUserPublications();
  const { publication, refresh: refreshPublication } = usePublication(publicationId);
  const [isEnabled, setIsEnabled] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Get owner cap ID from user publications
  const ownerCapId = firstPublication?.ownerCapId;
  
  // Get current subscription price from publication data (in MIST)
  const currentPrice = publication?.subscriptionPrice || 0;

  const {
    isSaving,
    error,
    success,
    isSubscriptionEnabled,
    currentPriceInSui,
    canUpdate,
    enableSubscription,
    disableSubscription,
    clearError,
    clearSuccess,
  } = useSubscriptionSettings({
    publicationId,
    ownerCapId,
    currentPrice,
    onSuccess: () => {
      // Refresh publication data to get updated subscription price
      refreshPublication();
      // Clear success message after 3 seconds
      setTimeout(clearSuccess, 3000);
    },
  });

  // Initialize form state based on current subscription settings
  useEffect(() => {
    setIsEnabled(isSubscriptionEnabled);
    if (isSubscriptionEnabled && currentPriceInSui > 0) {
      setPriceInput(currentPriceInSui.toString());
    }
  }, [isSubscriptionEnabled, currentPriceInSui]);


  const validatePrice = (value: string): string | null => {
    if (!value.trim()) {
      return "Price is required when subscription is enabled";
    }
    
    const price = parseFloat(value);
    if (isNaN(price)) {
      return "Please enter a valid number";
    }
    
    if (price <= 0) {
      return "Price must be greater than 0";
    }
    
    if (price > 1000) {
      return "Price cannot exceed 1000 SUI";
    }
    
    return null;
  };

  const handleToggleChange = (enabled: boolean) => {
    setIsEnabled(enabled);
    clearError();
    clearSuccess();
    setInputError(null);
    
    if (!enabled) {
      setPriceInput("");
    }
  };

  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    setInputError(null);
    clearError();
  };

  const handleSave = async () => {
    if (!canUpdate) {
      return;
    }

    try {
      if (isEnabled) {
        // Validate price input
        const validationError = validatePrice(priceInput);
        if (validationError) {
          setInputError(validationError);
          return;
        }

        const price = parseFloat(priceInput);
        await enableSubscription(price);
      } else {
        await disableSubscription();
      }
    } catch (err) {
      // Error handling is done in the hook
      console.error('Failed to save subscription settings:', err);
    }
  };

  if (!canUpdate) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Settings</h2>
          <p className="text-gray-600">Manage subscription pricing and access controls for your publication.</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">Unable to load subscription settings</p>
          <div className="text-red-600 text-sm mt-2 space-y-1">
            {!ownerCapId && <p>• Missing publication owner capability</p>}
            {!publicationId && <p>• Missing publication ID</p>}
            {!firstPublication && <p>• No publication found for this user</p>}
          </div>
          <p className="text-red-600 text-sm mt-2">
            Please ensure you own this publication and try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Settings</h2>
        <p className="text-gray-600">Manage subscription pricing and access controls for your publication.</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <HiCheckCircle className="size-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">
            Subscription settings updated successfully! Changes may take a moment to appear.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Failed to update subscription settings</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearError}
            className="text-red-600 hover:text-red-700"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-6">
          {/* Subscription Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Enable Subscription</h3>
              <p className="text-sm text-gray-600 mt-1">
                Require readers to pay a monthly subscription to access your content
              </p>
            </div>
            <button
              onClick={() => handleToggleChange(!isEnabled)}
              disabled={isSaving}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isEnabled ? "bg-blue-600" : "bg-gray-200",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Price Input (only shown when enabled) */}
          {isEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Subscription Price (SUI)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  disabled={isSaving}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent",
                    inputError 
                      ? "border-red-300 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                  placeholder="0.00"
                />
                {inputError && (
                  <p className="text-red-600 text-sm mt-1">{inputError}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Readers will pay this amount monthly to access your content
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={isSaving || (!isEnabled && !isSubscriptionEnabled)}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Subscription Settings'
              )}
            </Button>
            
            {/* Current Status */}
            <p className="text-sm text-gray-600 mt-2">
              Current status: {isSubscriptionEnabled 
                ? `Subscription enabled (${currentPriceInSui} SUI/month)` 
                : 'Subscription disabled (free access)'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function GeneralSettings({ publicationId }: { publicationId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">General Settings</h2>
        <p className="text-gray-600">Manage basic publication information and settings.</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">General settings coming soon...</p>
      </div>
    </div>
  )
}

function Analytics({ publicationId }: { publicationId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h2>
        <p className="text-gray-600">View publication performance and subscriber metrics.</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">Analytics dashboard coming soon...</p>
      </div>
    </div>
  )
}

function Subscribers({ publicationId }: { publicationId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscribers</h2>
        <p className="text-gray-600">Manage your publication subscribers and their access.</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">Subscriber management coming soon...</p>
      </div>
    </div>
  )
}

const TABS: TabConfig[] = [
  {
    id: "subscription",
    label: "Subscription",
    icon: HiCurrencyDollar,
    component: SubscriptionSettings,
  },
  {
    id: "general",
    label: "General",
    icon: HiCog6Tooth,
    component: GeneralSettings,
  },
  {
    id: "subscribers",
    label: "Subscribers",
    icon: HiUserGroup,
    component: Subscribers,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: HiChartBarSquare,
    component: Analytics,
  },
]

function PublicationSettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { address } = useWalletConnection()
  const [isLoading, setIsLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const publicationId = searchParams.get("id")
  const activeTab = searchParams.get("tab") || "subscription"

  const { publication, isLoading: publicationLoading, error } = usePublication(publicationId || "")

  // Check authentication and publication ownership
  useEffect(() => {
    if (!isAuthenticated || !address) {
      setAccessDenied(true)
      setIsLoading(false)
      return
    }

    if (!publicationLoading && publication) {
      // Check if current user is the publication owner using normalized address comparison
      const isOwner = addressesEqual(address, publication.owner)

      if (!isOwner) {
        setAccessDenied(true)
      } else {
        setAccessDenied(false)
      }
      setIsLoading(false)
    } else if (!publicationLoading && error) {
      setAccessDenied(true)
      setIsLoading(false)
    }
  }, [isAuthenticated, address, publication, publicationLoading, error])

  const handleTabChange = (tabId: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("tab", tabId)
    router.push(`/publication/settings?${newParams.toString()}`)
  }

  if (!publicationId) {
    return (
      <AppLayout currentPage="settings">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Invalid Request</h1>
            <p className="text-red-600">Publication ID is required to access settings.</p>
            <Link href="/feed" className="inline-block mt-4">
              <Button variant="outline">Return to Feed</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (isLoading || publicationLoading) {
    return (
      <AppLayout currentPage="settings">
        <div className="max-w-4xl mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="flex space-x-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (accessDenied) {
    return (
      <AppLayout currentPage="settings">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-600">
              {!isAuthenticated
                ? "You must be logged in to access publication settings."
                : "You don't have permission to access these settings. Only the publication owner can manage publication settings."
              }
            </p>
            <Link href="/feed" className="inline-block mt-4">
              <Button variant="outline">Return to Feed</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const activeTabConfig = TABS.find(tab => tab.id === activeTab) || TABS[0]
  const ActiveTabComponent = activeTabConfig.component

  return (
    <AppLayout currentPage="settings">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Publication Settings</h1>
          <p className="text-gray-600">
            Manage settings for <span className="font-medium">{publication?.name}</span>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <ActiveTabComponent publicationId={publicationId} />
      </div>
    </AppLayout>
  )
}

export default function PublicationSettingsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={
        <AppLayout currentPage="settings">
          <div className="max-w-4xl mx-auto py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </AppLayout>
      }>
        <PublicationSettingsContent />
      </Suspense>
    </RequireAuth>
  )
}