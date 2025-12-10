"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/Avatar';
import { ProfileAvatarUpload } from '@/components/profile/ProfileAvatarUpload';
import { PublicationTagsSelector } from './PublicationTagsSelector';
import { createPublicationAvatarConfig } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils';
import { publicationsAPI, UpdatePublicationData, SocialAccounts } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  SiX,
  SiGithub,
  SiDiscord,
  SiTelegram,
} from 'react-icons/si';
import { HiGlobeAlt, HiNewspaper, HiHashtag } from 'react-icons/hi2';
import { Publication } from '@/types/article';

interface PublicationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
  onSuccess: () => void;
}

const SOCIAL_FIELDS = [
  { key: 'twitter' as const, label: 'X (Twitter)', icon: SiX, placeholder: 'https://x.com/username' },
  { key: 'github' as const, label: 'GitHub', icon: SiGithub, placeholder: 'https://github.com/username' },
  { key: 'discord' as const, label: 'Discord', icon: SiDiscord, placeholder: 'username#0000' },
  { key: 'telegram' as const, label: 'Telegram', icon: SiTelegram, placeholder: '@username' },
  { key: 'website' as const, label: 'Website', icon: HiGlobeAlt, placeholder: 'https://yourwebsite.com' },
];

export function PublicationEditModal({
  isOpen,
  onClose,
  publication,
  onSuccess,
}: PublicationEditModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'tags' | 'social'>('basic');

  // Form state
  const [description, setDescription] = useState(publication?.description || '');
  const [avatar, setAvatar] = useState<string | null>(publication?.avatar || null);
  const [tags, setTags] = useState<string[]>(publication?.tags || []);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccounts>({
    twitter: publication?.socialAccounts?.twitter || '',
    github: publication?.socialAccounts?.github || '',
    discord: publication?.socialAccounts?.discord || '',
    telegram: publication?.socialAccounts?.telegram || '',
    website: publication?.socialAccounts?.website || '',
  });

  // Track if avatar was changed
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Reset form when publication changes or modal opens
  useEffect(() => {
    if (isOpen && publication) {
      setDescription(publication.description || '');
      setAvatar(publication.avatar || null);
      setTags(publication.tags || []);
      setSocialAccounts({
        twitter: publication.socialAccounts?.twitter || '',
        github: publication.socialAccounts?.github || '',
        discord: publication.socialAccounts?.discord || '',
        telegram: publication.socialAccounts?.telegram || '',
        website: publication.socialAccounts?.website || '',
      });
      setAvatarChanged(false);
      setActiveTab('basic');
    }
  }, [isOpen, publication]);

  const handleAvatarSelect = (base64: string) => {
    setAvatar(base64);
    setAvatarChanged(true);
  };

  const handleSocialChange = (key: keyof SocialAccounts, value: string) => {
    setSocialAccounts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publication) return;

    setIsLoading(true);

    try {
      const updateData: UpdatePublicationData = {
        description: description.trim() || undefined,
        tags,
        socialAccounts,
      };

      // Only include avatar if it was changed
      if (avatarChanged) {
        updateData.avatar = avatar || undefined;
      }

      await publicationsAPI.updatePublication(publication.id, updateData);
      toast({
        title: 'Success',
        description: 'Publication updated successfully',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update publication:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update publication',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const avatarConfig = createPublicationAvatarConfig(
    {
      id: publication?.id || '',
      name: publication?.name || '',
      avatar: avatar || undefined,
    },
    'xl'
  );

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: HiNewspaper },
    { id: 'tags' as const, label: 'Topics', icon: HiHashtag },
    { id: 'social' as const, label: 'Social', icon: HiGlobeAlt },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Publication</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1.5 bg-gray-100/80 rounded-xl mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              )}
            >
              <tab.icon className={cn(
                'w-4 h-4 transition-colors',
                activeTab === tab.id ? 'text-primary' : ''
              )} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto py-4 px-1">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="relative group">
                    <div
                      className={cn(
                        'absolute -inset-1.5 rounded-full blur-lg opacity-50',
                        'bg-gradient-to-br from-primary via-blue-400 to-purple-500',
                        'group-hover:opacity-70 transition-opacity duration-300'
                      )}
                    />
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 via-blue-400/30 to-purple-500/30 rounded-full" />
                    <Avatar
                      {...avatarConfig}
                      className="relative w-28 h-28 ring-4 ring-white shadow-sm"
                    />
                  </div>
                  <ProfileAvatarUpload
                    onImageSelect={handleAvatarSelect}
                    currentAvatar={avatar}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell readers what your publication is about..."
                    maxLength={500}
                    rows={4}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border border-gray-200',
                      'text-sm resize-none placeholder:text-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                      'transition-all duration-200'
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Describe your publication&apos;s focus and content style
                    </p>
                    <p className={cn(
                      'text-xs font-medium tabular-nums',
                      description.length > 450 ? 'text-amber-500' : 'text-gray-400'
                    )}>
                      {description.length}/500
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Publication Topics
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Select up to 10 topics that describe what you write about
                  </p>
                </div>
                <PublicationTagsSelector
                  selectedTags={tags}
                  onChange={setTags}
                  maxTags={10}
                />
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Social Links
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Add your social profiles so readers can connect with you
                  </p>
                </div>
                <div className="space-y-3">
                  {SOCIAL_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <field.icon className="w-4 h-4" />
                        {field.label}
                      </label>
                      <Input
                        value={socialAccounts[field.key] || ''}
                        onChange={(e) => handleSocialChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
