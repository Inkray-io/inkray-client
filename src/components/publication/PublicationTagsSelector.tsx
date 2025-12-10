"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { HiCheck, HiXMark } from 'react-icons/hi2';
import { PUBLICATION_TAG_LIST, MAX_PUBLICATION_TAGS } from './publicationTagsConfig';

interface PublicationTagsSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export function PublicationTagsSelector({
  selectedTags,
  onChange,
  maxTags = MAX_PUBLICATION_TAGS,
}: PublicationTagsSelectorProps) {
  const isMaxReached = selectedTags.length >= maxTags;

  const toggleTag = (slug: string) => {
    if (selectedTags.includes(slug)) {
      onChange(selectedTags.filter((s) => s !== slug));
    } else if (!isMaxReached) {
      onChange([...selectedTags, slug]);
    }
  };

  const removeTag = (slug: string) => {
    onChange(selectedTags.filter((s) => s !== slug));
  };

  return (
    <div className="space-y-4">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((slug) => {
            const tag = PUBLICATION_TAG_LIST.find((t) => t.slug === slug);
            if (!tag) return null;

            return (
              <div
                key={slug}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
                  'bg-gradient-to-r',
                  tag.gradient,
                  'border border-gray-200'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', tag.iconBg)} />
                <span className="text-sm font-medium text-gray-700">
                  {tag.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeTag(slug)}
                  className="ml-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiXMark className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tag limit indicator */}
      <p className="text-xs text-gray-500">
        {selectedTags.length} / {maxTags} tags selected
      </p>

      {/* Tag grid */}
      <div className="grid grid-cols-2 gap-2">
        {PUBLICATION_TAG_LIST.map((tag) => {
          const isSelected = selectedTags.includes(tag.slug);
          const isDisabled = !isSelected && isMaxReached;

          return (
            <button
              key={tag.slug}
              type="button"
              onClick={() => toggleTag(tag.slug)}
              disabled={isDisabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'border transition-all duration-200',
                'text-left text-sm font-medium',
                isSelected
                  ? 'border-primary bg-primary/5 text-primary'
                  : isDisabled
                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  isSelected ? 'bg-primary' : tag.iconBg,
                  isDisabled && 'opacity-30'
                )}
              />
              <span className="flex-1">{tag.name}</span>
              {isSelected && <HiCheck className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
