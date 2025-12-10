"use client";

import React from 'react';
import {
  SiX,
  SiGithub,
  SiDiscord,
  SiTelegram,
} from 'react-icons/si';
import { HiGlobeAlt } from 'react-icons/hi2';
import { cn } from '@/lib/utils';
import { SocialAccounts } from '@/lib/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProfileSocialLinksProps {
  socialAccounts: SocialAccounts;
}

const SOCIAL_CONFIG = {
  twitter: {
    icon: SiX,
    label: 'X',
    hoverBg: 'hover:bg-gray-100',
    hoverText: 'group-hover:text-gray-700',
    isUrl: true,
  },
  github: {
    icon: SiGithub,
    label: 'GitHub',
    hoverBg: 'hover:bg-gray-100',
    hoverText: 'group-hover:text-gray-700',
    isUrl: true,
  },
  discord: {
    icon: SiDiscord,
    label: 'Discord',
    hoverBg: 'hover:bg-indigo-50',
    hoverText: 'group-hover:text-indigo-600',
    isUrl: false,
  },
  telegram: {
    icon: SiTelegram,
    label: 'Telegram',
    hoverBg: 'hover:bg-blue-50',
    hoverText: 'group-hover:text-blue-600',
    isUrl: false,
  },
  website: {
    icon: HiGlobeAlt,
    label: 'Website',
    hoverBg: 'hover:bg-primary/10',
    hoverText: 'group-hover:text-primary',
    isUrl: true,
  },
};

export function ProfileSocialLinks({
  socialAccounts,
}: ProfileSocialLinksProps) {
  const links = Object.entries(socialAccounts).filter(
    ([_, value]) => value && value.trim()
  );

  if (links.length === 0) return null;

  return (
    <section className="px-5 py-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Connect</span>
        <span className="text-gray-200">·</span>
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1.5">
            {links.map(([platform, value]) => {
              const config = SOCIAL_CONFIG[platform as keyof typeof SOCIAL_CONFIG];
              if (!config) return null;

              const Icon = config.icon;
              const isClickable = config.isUrl && value;
              const href = isClickable ? value : undefined;

              const iconButton = (
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    'bg-gray-50 border border-gray-100 transition-all duration-200',
                    config.hoverBg
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 text-gray-500 transition-colors',
                      config.hoverText
                    )}
                  />
                </div>
              );

              if (href) {
                return (
                  <Tooltip key={platform}>
                    <TooltipTrigger asChild>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        {iconButton}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6} hideArrow className="text-xs bg-white border border-gray-200 text-gray-700 shadow-sm">
                      <p className="font-medium">{config.label}</p>
                      <p className="text-gray-400 truncate max-w-[200px]">{value}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Tooltip key={platform}>
                  <TooltipTrigger asChild>
                    <div className="group cursor-default">
                      {iconButton}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} hideArrow className="text-xs bg-white border border-gray-200 text-gray-700 shadow-sm">
                    <p className="font-medium">{config.label}</p>
                    <p className="text-gray-400">{value}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </section>
  );
}
