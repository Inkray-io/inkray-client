"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { usePublication } from "@/hooks/usePublication";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  HiCog6Tooth,
  HiCurrencyDollar,
  HiUserGroup,
  HiChartBarSquare,
  HiGift,
  HiArrowDownTray,
} from "react-icons/hi2";
import { addressesEqual } from "@/utils/address";
import Link from "next/link";
import {
  SettingsTabs,
  SubscriptionSettings,
  TipsSettings,
  ExportSettings,
  GeneralSettings,
  SubscribersSettings,
  AnalyticsSettings,
} from "./_components";

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ publicationId: string }>;
}

const TABS: TabConfig[] = [
  {
    id: "subscription",
    label: "Subscription",
    icon: HiCurrencyDollar,
    component: SubscriptionSettings,
  },
  {
    id: "export",
    label: "Export",
    icon: HiArrowDownTray,
    component: ExportSettings,
  },
  {
    id: "tips",
    label: "Tips",
    icon: HiGift,
    component: TipsSettings,
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
    component: SubscribersSettings,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: HiChartBarSquare,
    component: AnalyticsSettings,
  },
];

function PublicationSettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { address } = useWalletConnection();
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const publicationId = searchParams.get("id");
  const activeTab = searchParams.get("tab") || "subscription";

  const {
    publication,
    isLoading: publicationLoading,
    error,
  } = usePublication(publicationId || "");

  // Check authentication and publication ownership
  useEffect(() => {
    if (!isAuthenticated || !address) {
      setAccessDenied(true);
      setIsLoading(false);
      return;
    }

    if (!publicationLoading && publication) {
      // Check if current user is the publication owner using normalized address comparison
      const isOwner = addressesEqual(address, publication.owner);

      if (!isOwner) {
        setAccessDenied(true);
      } else {
        setAccessDenied(false);
      }
      setIsLoading(false);
    } else if (!publicationLoading && error) {
      setAccessDenied(true);
      setIsLoading(false);
    }
  }, [isAuthenticated, address, publication, publicationLoading, error]);

  const handleTabChange = (tabId: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tabId);
    router.push(`/publication/settings?${newParams.toString()}`);
  };

  if (!publicationId) {
    return (
      <AppLayout currentPage="settings">
        <div className="max-w-4xl mx-auto py-6 sm:py-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
            <h1 className="text-xl font-semibold text-destructive mb-2">
              Invalid Request
            </h1>
            <p className="text-destructive/80">
              Publication ID is required to access settings.
            </p>
            <Link href="/feed" className="inline-block mt-4">
              <Button variant="outline">Return to Feed</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading || publicationLoading) {
    return (
      <AppLayout currentPage="settings">
        <div className="max-w-4xl mx-auto py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted rounded w-96 mb-8"></div>
            <div className="flex space-x-4 mb-8 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 bg-muted rounded w-24 flex-shrink-0"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (accessDenied) {
    return (
      <AppLayout currentPage="settings">
        <div className="max-w-4xl mx-auto py-6 sm:py-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
            <h1 className="text-xl font-semibold text-destructive mb-2">
              Access Denied
            </h1>
            <p className="text-destructive/80">
              {!isAuthenticated
                ? "You must be logged in to access publication settings."
                : "You don't have permission to access these settings. Only the publication owner can manage publication settings."}
            </p>
            <Link href="/feed" className="inline-block mt-4">
              <Button variant="outline">Return to Feed</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const activeTabConfig = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const ActiveTabComponent = activeTabConfig.component;

  return (
    <AppLayout currentPage="settings">
      <div className="max-w-4xl mx-auto py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Publication Settings
          </h1>
          <p className="text-muted-foreground">
            Manage settings for{" "}
            <span className="font-medium text-foreground">
              {publication?.name}
            </span>
          </p>
        </div>

        {/* Tab Navigation */}
        <SettingsTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Tab Content */}
        <ActiveTabComponent publicationId={publicationId} />
      </div>
    </AppLayout>
  );
}

export default function PublicationSettingsPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <AppLayout currentPage="settings">
            <div className="max-w-4xl mx-auto py-6 sm:py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-64 mb-4"></div>
                <div className="h-4 bg-muted rounded w-96 mb-8"></div>
                <div className="h-64 bg-muted rounded-xl"></div>
              </div>
            </div>
          </AppLayout>
        }
      >
        <PublicationSettingsContent />
      </Suspense>
    </RequireAuth>
  );
}
