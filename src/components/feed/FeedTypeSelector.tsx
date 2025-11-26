'use client';

import { useState } from 'react';
import { HiChevronDown, HiFire, HiClock, HiUserGroup } from 'react-icons/hi2';

export type FeedType = 'fresh' | 'popular' | 'my' | 'bookmarks';
export type TimeFrame = 'day' | 'week' | 'month';

interface FeedTypeSelectorProps {
  currentFeedType: FeedType;
  currentTimeframe: TimeFrame;
  onFeedTypeChange: (feedType: FeedType) => void;
  onTimeframeChange: (timeframe: TimeFrame) => void;
  showTimeframe?: boolean;
  className?: string;
}

interface FeedOption {
  id: FeedType;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const feedOptions: FeedOption[] = [
  {
    id: 'fresh',
    label: 'Fresh',
    description: 'Latest articles from all publications',
    icon: HiClock,
  },
  {
    id: 'popular',
    label: 'Popular',
    description: 'Trending articles by engagement',
    icon: HiFire,
  },
  {
    id: 'my',
    label: 'My Feed',
    description: 'From publications you follow',
    icon: HiUserGroup,
  },
];

const timeframeOptions = [
  { id: 'day' as const, label: 'Last Day' },
  { id: 'week' as const, label: 'Last Week' },
  { id: 'month' as const, label: 'Last Month' },
];

export default function FeedTypeSelector({
  currentFeedType,
  currentTimeframe,
  onFeedTypeChange,
  onTimeframeChange,
  showTimeframe = false,
  className = '',
}: FeedTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const currentOption = feedOptions.find(option => option.id === currentFeedType);
  const currentTimeframeOption = timeframeOptions.find(option => option.id === currentTimeframe);

  const handleFeedTypeSelect = (feedType: FeedType) => {
    onFeedTypeChange(feedType);
    setIsOpen(false);
  };

  const handleTimeframeSelect = (timeframe: TimeFrame) => {
    onTimeframeChange(timeframe);
    setIsTimeframeOpen(false);
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Feed Type Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {currentOption && (
            <>
              <currentOption.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentOption.label}
              </span>
            </>
          )}
          <HiChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <div className="py-1">
              {feedOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleFeedTypeSelect(option.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    currentFeedType === option.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <option.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className={`text-sm font-medium ${
                      currentFeedType === option.id 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {option.description}
                    </div>
                  </div>
                  {currentFeedType === option.id && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeframe Selector (only show for popular feed) */}
      {showTimeframe && currentFeedType === 'popular' && (
        <div className="relative">
          <button
            onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentTimeframeOption?.label}
            </span>
            <HiChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform ${isTimeframeOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {isTimeframeOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {timeframeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleTimeframeSelect(option.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      currentTimeframe === option.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {(isOpen || isTimeframeOpen) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setIsOpen(false);
            setIsTimeframeOpen(false);
          }}
        />
      )}
    </div>
  );
}