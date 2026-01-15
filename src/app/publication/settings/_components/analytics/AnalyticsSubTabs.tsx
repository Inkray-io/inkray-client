"use client";

import { cn } from "@/lib/utils";
import {
  HiEye,
  HiHeart,
  HiUserPlus,
  HiCurrencyDollar,
  HiArrowPath,
  HiGlobeAlt,
  HiLink,
} from "react-icons/hi2";
import { MetricType } from "./useAnalyticsData";

interface AnalyticsSubTabsProps {
  activeTab: MetricType;
  onChange: (tab: MetricType) => void;
}

const TABS: { id: MetricType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "views", label: "Views", icon: HiEye },
  { id: "likes", label: "Likes", icon: HiHeart },
  { id: "follows", label: "Follows", icon: HiUserPlus },
  { id: "tips", label: "Tips", icon: HiCurrencyDollar },
  { id: "retention", label: "Retention", icon: HiArrowPath },
  { id: "nonFollowers", label: "Discovery", icon: HiGlobeAlt },
  { id: "referrers", label: "Referrers", icon: HiLink },
];

export function AnalyticsSubTabs({ activeTab, onChange }: AnalyticsSubTabsProps) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide rounded-xl bg-gray-100 p-1 mb-6 max-w-full">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Icon
              className={cn(
                "size-4 transition-transform duration-200",
                isActive && "scale-110"
              )}
            />
            <span>{tab.label}</span>
            {isActive && (
              <span
                className="absolute inset-0 rounded-lg ring-1 ring-gray-200/50 pointer-events-none"
                style={{
                  animation: "subtab-glow 0.3s ease-out"
                }}
              />
            )}
          </button>
        );
      })}
      <style jsx>{`
        @keyframes subtab-glow {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
