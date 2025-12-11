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
import { ProfileAvatarUpload } from './ProfileAvatarUpload';
import { ProfileSkillsSelector } from './ProfileSkillsSelector';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils';
import { usersAPI, UpdateProfileData, SocialAccounts } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  SiX,
  SiGithub,
  SiDiscord,
  SiTelegram,
} from 'react-icons/si';
import { HiGlobeAlt, HiUser, HiPencilSquare } from 'react-icons/hi2';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id?: string;
    publicKey?: string;
    username?: string | null;
    description?: string | null;
    avatar?: string | null;
    skills?: string[] | null;
    socialAccounts?: SocialAccounts | null;
  } | null;
  onSuccess: () => void;
}

const SOCIAL_FIELDS = [
  { key: 'twitter' as const, label: 'X (Twitter)', icon: SiX, placeholder: 'https://x.com/username' },
  { key: 'github' as const, label: 'GitHub', icon: SiGithub, placeholder: 'https://github.com/username' },
  { key: 'discord' as const, label: 'Discord', icon: SiDiscord, placeholder: 'username#0000' },
  { key: 'telegram' as const, label: 'Telegram', icon: SiTelegram, placeholder: '@username' },
  { key: 'website' as const, label: 'Website', icon: HiGlobeAlt, placeholder: 'https://yourwebsite.com' },
];

export function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}: ProfileEditModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'skills' | 'social'>('basic');

  // Form state
  const [description, setDescription] = useState(profile?.description || '');
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar || null);
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccounts>({
    twitter: profile?.socialAccounts?.twitter || '',
    github: profile?.socialAccounts?.github || '',
    discord: profile?.socialAccounts?.discord || '',
    telegram: profile?.socialAccounts?.telegram || '',
    website: profile?.socialAccounts?.website || '',
  });

  // Track if avatar was changed
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Reset form when profile changes or modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setDescription(profile.description || '');
      setAvatar(profile.avatar || null);
      setSkills(profile.skills || []);
      setSocialAccounts({
        twitter: profile.socialAccounts?.twitter || '',
        github: profile.socialAccounts?.github || '',
        discord: profile.socialAccounts?.discord || '',
        telegram: profile.socialAccounts?.telegram || '',
        website: profile.socialAccounts?.website || '',
      });
      setAvatarChanged(false);
      setActiveTab('basic');
    }
  }, [isOpen, profile]);

  const handleAvatarSelect = (base64: string) => {
    setAvatar(base64);
    setAvatarChanged(true);
  };

  const handleSocialChange = (key: keyof SocialAccounts, value: string) => {
    setSocialAccounts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: UpdateProfileData = {
        description: description.trim() || undefined,
        skills,
        socialAccounts,
      };

      // Only include avatar if it was changed
      if (avatarChanged) {
        updateData.avatar = avatar || undefined;
      }

      await usersAPI.updateProfile(updateData);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const avatarConfig = createUserAvatarConfig(
    {
      id: profile?.id,
      publicKey: profile?.publicKey,
      avatar: avatar || undefined,
    },
    'xl'
  );

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: HiUser },
    { id: 'skills' as const, label: 'Skills', icon: HiPencilSquare },
    { id: 'social' as const, label: 'Social', icon: HiGlobeAlt },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Profile</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
                'text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <tab.icon className="w-4 h-4" />
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
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-blue-400/20 to-purple-500/20 rounded-full blur-sm" />
                    <Avatar
                      {...avatarConfig}
                      className="relative w-24 h-24 ring-4 ring-white"
                    />
                  </div>
                  <ProfileAvatarUpload
                    onImageSelect={handleAvatarSelect}
                    currentAvatar={avatar}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell others about yourself..."
                    maxLength={500}
                    rows={4}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl border border-gray-200',
                      'text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                      'transition-all duration-200'
                    )}
                  />
                  <p className="text-xs text-gray-500">
                    {description.length}/500 characters
                  </p>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Your Skills
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Select up to 10 skills that best describe your expertise
                  </p>
                </div>
                <ProfileSkillsSelector
                  selectedSkills={skills}
                  onChange={setSkills}
                  maxSkills={10}
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
                    Add your social profiles so others can connect with you
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
