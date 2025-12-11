"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { HiCheck, HiXMark } from 'react-icons/hi2';

export const SKILL_OPTIONS = [
  { value: 'blockchain-development', label: 'Blockchain Development' },
  { value: 'smart-contracts', label: 'Smart Contracts' },
  { value: 'frontend-development', label: 'Frontend Development' },
  { value: 'backend-development', label: 'Backend Development' },
  { value: 'ui-ux-design', label: 'UI/UX Design' },
  { value: 'technical-writing', label: 'Technical Writing' },
  { value: 'content-creation', label: 'Content Creation' },
  { value: 'community-management', label: 'Community Management' },
  { value: 'research-analysis', label: 'Research & Analysis' },
  { value: 'marketing', label: 'Marketing' },
] as const;

interface ProfileSkillsSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
}

export function ProfileSkillsSelector({
  selectedSkills,
  onChange,
  maxSkills = 10,
}: ProfileSkillsSelectorProps) {
  const toggleSkill = (skillValue: string) => {
    if (selectedSkills.includes(skillValue)) {
      onChange(selectedSkills.filter((s) => s !== skillValue));
    } else if (selectedSkills.length < maxSkills) {
      onChange([...selectedSkills, skillValue]);
    }
  };

  const removeSkill = (skillValue: string) => {
    onChange(selectedSkills.filter((s) => s !== skillValue));
  };

  const isAtLimit = selectedSkills.length >= maxSkills;

  return (
    <div className="space-y-4">
      {/* Selected skills display */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skillValue) => {
            const skill = SKILL_OPTIONS.find((s) => s.value === skillValue);
            if (!skill) return null;
            return (
              <div
                key={skillValue}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'bg-primary/10 text-primary text-sm font-medium',
                  'transition-all duration-200'
                )}
              >
                <span>{skill.label}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skillValue)}
                  className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    'bg-primary/20 hover:bg-primary/30 transition-colors'
                  )}
                >
                  <HiXMark className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Skills selection grid */}
      <div className="grid grid-cols-2 gap-2">
        {SKILL_OPTIONS.map((skill) => {
          const isSelected = selectedSkills.includes(skill.value);
          const isDisabled = !isSelected && isAtLimit;

          return (
            <button
              key={skill.value}
              type="button"
              onClick={() => toggleSkill(skill.value)}
              disabled={isDisabled}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl',
                'border text-sm font-medium text-left',
                'transition-all duration-200',
                isSelected
                  ? 'bg-primary/5 border-primary/30 text-gray-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="truncate">{skill.label}</span>
              {isSelected && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <HiCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Limit indicator */}
      <p className={cn(
        'text-xs text-center',
        isAtLimit ? 'text-amber-600' : 'text-gray-500'
      )}>
        {selectedSkills.length} / {maxSkills} skills selected
        {isAtLimit && ' (maximum reached)'}
      </p>
    </div>
  );
}
