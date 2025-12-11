"use client";

import React from 'react';
import { cn } from '@/lib/utils';

// Skill display names and colors
const SKILL_CONFIG: Record<
  string,
  { name: string; gradient: string; iconBg: string }
> = {
  'blockchain-development': {
    name: 'Blockchain',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconBg: 'bg-blue-500',
  },
  'smart-contracts': {
    name: 'Smart Contracts',
    gradient: 'from-purple-500/10 to-violet-500/10',
    iconBg: 'bg-purple-500',
  },
  'frontend-development': {
    name: 'Frontend',
    gradient: 'from-pink-500/10 to-rose-500/10',
    iconBg: 'bg-pink-500',
  },
  'backend-development': {
    name: 'Backend',
    gradient: 'from-green-500/10 to-emerald-500/10',
    iconBg: 'bg-green-500',
  },
  'ui-ux-design': {
    name: 'UI/UX',
    gradient: 'from-orange-500/10 to-amber-500/10',
    iconBg: 'bg-orange-500',
  },
  'technical-writing': {
    name: 'Tech Writing',
    gradient: 'from-indigo-500/10 to-blue-500/10',
    iconBg: 'bg-indigo-500',
  },
  'content-creation': {
    name: 'Content',
    gradient: 'from-red-500/10 to-pink-500/10',
    iconBg: 'bg-red-500',
  },
  'community-management': {
    name: 'Community',
    gradient: 'from-teal-500/10 to-cyan-500/10',
    iconBg: 'bg-teal-500',
  },
  'research-analysis': {
    name: 'Research',
    gradient: 'from-slate-500/10 to-gray-500/10',
    iconBg: 'bg-slate-500',
  },
  marketing: {
    name: 'Marketing',
    gradient: 'from-yellow-500/10 to-orange-500/10',
    iconBg: 'bg-yellow-500',
  },
};

interface ProfileSkillsProps {
  skills: string[];
}

export function ProfileSkills({ skills }: ProfileSkillsProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <section className="px-5 py-3 border-t border-gray-100">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Skills</span>
        <span className="text-gray-200">·</span>
        {skills.map((skill) => {
          const config = SKILL_CONFIG[skill] || {
            name: skill,
            gradient: 'from-gray-500/10 to-gray-400/10',
            iconBg: 'bg-gray-500',
          };

          return (
            <div
              key={skill}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
                'bg-gradient-to-r',
                config.gradient,
                'border border-gray-100/80',
                'transition-all duration-200 hover:scale-[1.02]'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  config.iconBg
                )}
              />
              <span className="text-xs font-medium text-gray-600">
                {config.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
