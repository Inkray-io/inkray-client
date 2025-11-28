"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SettingsTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SettingsTabs({ tabs, activeTab, onTabChange }: SettingsTabsProps) {
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

  return (
    <div className="relative border-b border-border mb-8">
      {/* Left gradient indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity lg:hidden",
          showLeftGradient ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Right gradient indicator */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity lg:hidden",
          showRightGradient ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Scrollable tabs container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0"
      >
        <nav className="flex space-x-2 sm:space-x-4 lg:space-x-6 min-w-max lg:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 lg:flex-shrink",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
