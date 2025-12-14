"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

interface TabGroup {
  id: string;
  label: string;
  tabs: string[];
}

interface SettingsTabsProps {
  tabs: TabConfig[];
  groups?: TabGroup[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SettingsTabs({ tabs, groups, activeTab, onTabChange }: SettingsTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftGradient(scrollLeft > 0);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  // If groups are provided, render grouped tabs
  const renderGroupedTabs = () => {
    if (!groups) return null;

    return groups.map((group, groupIndex) => {
      const groupTabs = tabs.filter((tab) => group.tabs.includes(tab.id));
      if (groupTabs.length === 0) return null;

      return (
        <div key={group.id} className="flex items-center">
          {/* Group separator (not before first group) */}
          {groupIndex > 0 && (
            <div className="hidden sm:block h-6 w-px bg-gray-200 mx-2 lg:mx-4" />
          )}

          {/* Group tabs */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            {groupTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  title={tab.label}
                  className={cn(
                    "group relative flex items-center gap-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-t-md",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                  )}
                >
                  <Icon className="size-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>

                  {/* Mobile tooltip on tap */}
                  <span className="sm:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-focus:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    });
  };

  // Render flat tabs (no groups)
  const renderFlatTabs = () => {
    return tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = tab.id === activeTab;

      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          title={tab.label}
          className={cn(
            "group relative flex items-center gap-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-t-md",
            isActive
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
          )}
        >
          <Icon className="size-4 flex-shrink-0" />
          <span className="hidden sm:inline">{tab.label}</span>

          {/* Mobile tooltip */}
          <span className="sm:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-focus:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
            {tab.label}
          </span>
        </button>
      );
    });
  };

  return (
    <div className="relative border-b border-gray-200 mb-8">
      {/* Left gradient indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-50 to-transparent z-10 pointer-events-none transition-opacity lg:hidden",
          showLeftGradient ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Right gradient indicator */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-50 to-transparent z-10 pointer-events-none transition-opacity lg:hidden",
          showRightGradient ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Scrollable tabs container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0"
      >
        <nav
          className="flex items-center min-w-max lg:min-w-0"
          role="tablist"
          aria-label="Settings sections"
        >
          {groups ? renderGroupedTabs() : renderFlatTabs()}
        </nav>
      </div>
    </div>
  );
}
