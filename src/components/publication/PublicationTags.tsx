"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { PUBLICATION_TAGS } from './publicationTagsConfig';
import { HiHashtag } from 'react-icons/hi2';

interface PublicationTagsProps {
  tags: string[];
}

export function PublicationTags({ tags }: PublicationTagsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <section className="px-5 py-3.5 border-t border-gray-100/80">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 mr-1">
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-gray-100">
            <HiHashtag className="w-3 h-3 text-gray-500" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Topics</span>
        </div>
        {tags.map((tag) => {
          const config = PUBLICATION_TAGS[tag] || {
            name: tag,
            gradient: 'from-gray-500/10 to-gray-400/10',
            iconBg: 'bg-gray-500',
          };

          return (
            <div
              key={tag}
              className={cn(
                'group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg',
                'bg-gradient-to-r',
                config.gradient,
                'border border-gray-100/80 hover:border-gray-200',
                'hover:shadow-sm cursor-default',
                'transition-all duration-200'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  config.iconBg,
                  'group-hover:scale-110 transition-transform duration-200'
                )}
              />
              <span className="text-xs font-medium text-gray-700">
                {config.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
