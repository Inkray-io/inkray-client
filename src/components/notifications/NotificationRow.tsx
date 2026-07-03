'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  HiBell,
  HiHeart,
  HiChatBubbleOvalLeft,
  HiBookmark,
  HiUserPlus,
  HiStar,
  HiBanknotes,
  HiDocumentText,
  HiClock,
  HiExclamationTriangle,
  HiTicket,
  HiTrophy,
  HiUserGroup,
} from 'react-icons/hi2';
import { Notification } from '@/types/notifications';
import { cn } from '@/lib/utils';

/** Icon + tint per notification type — one glyph per event, soft chip. */
export const TYPE_STYLE: Record<string, { icon: typeof HiBell; chip: string }> = {
  ARTICLE_LIKED: { icon: HiHeart, chip: 'bg-rose-50 text-rose-500' },
  ARTICLE_COMMENTED: { icon: HiChatBubbleOvalLeft, chip: 'bg-blue-50 text-blue-500' },
  ARTICLE_BOOKMARKED: { icon: HiBookmark, chip: 'bg-amber-50 text-amber-500' },
  NEW_FOLLOWER: { icon: HiUserPlus, chip: 'bg-green-50 text-green-600' },
  NEW_SUBSCRIBER: { icon: HiStar, chip: 'bg-purple-50 text-purple-500' },
  ARTICLE_TIP: { icon: HiBanknotes, chip: 'bg-emerald-50 text-emerald-600' },
  ARTICLE_PUBLISHED: { icon: HiDocumentText, chip: 'bg-primary/10 text-primary' },
  SCHEDULED_ARTICLE_PUBLISHED: { icon: HiClock, chip: 'bg-primary/10 text-primary' },
  SCHEDULED_ARTICLE_FAILED: { icon: HiExclamationTriangle, chip: 'bg-red-50 text-red-500' },
  INVITE_REDEEMED: { icon: HiTicket, chip: 'bg-indigo-50 text-indigo-500' },
  INVITE_CODES_GRANTED: { icon: HiTicket, chip: 'bg-indigo-50 text-indigo-500' },
  TIER_PROMOTED: { icon: HiTrophy, chip: 'bg-amber-50 text-amber-600' },
};

export const DEFAULT_STYLE = { icon: HiBell, chip: 'bg-gray-100 text-gray-500' };

/**
 * Category corner badge — a subtle glyph grouping notifications by what part
 * of the product they come from, shown as a tiny white-ringed dot on the chip.
 */
export const CATEGORY: Record<string, { icon: typeof HiBell; label: string }> = {
  engagement: { icon: HiHeart, label: 'Engagement' },
  audience: { icon: HiUserGroup, label: 'Audience' },
  earnings: { icon: HiBanknotes, label: 'Earnings' },
  publishing: { icon: HiDocumentText, label: 'Publishing' },
  rewards: { icon: HiTrophy, label: 'Rewards' },
  invites: { icon: HiTicket, label: 'Invites' },
};

export const CATEGORY_OF: Record<string, keyof typeof CATEGORY> = {
  ARTICLE_LIKED: 'engagement',
  ARTICLE_COMMENTED: 'engagement',
  ARTICLE_BOOKMARKED: 'engagement',
  NEW_FOLLOWER: 'audience',
  NEW_SUBSCRIBER: 'audience',
  ARTICLE_TIP: 'earnings',
  ARTICLE_PUBLISHED: 'publishing',
  SCHEDULED_ARTICLE_PUBLISHED: 'publishing',
  SCHEDULED_ARTICLE_FAILED: 'publishing',
  INVITE_REDEEMED: 'invites',
  INVITE_CODES_GRANTED: 'invites',
  TIER_PROMOTED: 'rewards',
};

interface NotificationRowProps {
  notification: Notification;
  unread: boolean;
  /** Register the row element for visibility (viewed) tracking */
  observeRow?: (el: HTMLElement | null, notification: Notification) => void;
  /** 'sm' for the bell popup, 'md' for the full page */
  size?: 'sm' | 'md';
}

/**
 * One notification: type chip with a category corner badge, title, body,
 * relative time, and an unread dot. Shared by the bell popup and the
 * /notifications page.
 */
export function NotificationRow({
  notification: n,
  unread,
  observeRow,
  size = 'sm',
}: NotificationRowProps) {
  const style = TYPE_STYLE[n.type] ?? DEFAULT_STYLE;
  const Icon = style.icon;
  const category = CATEGORY[CATEGORY_OF[n.type] ?? ''];
  const md = size === 'md';

  return (
    <div
      ref={observeRow ? (el) => observeRow(el, n) : undefined}
      className={cn(
        'flex items-start gap-3 transition-colors',
        md ? 'px-5 py-4' : 'px-4 py-3',
        unread && 'bg-primary/3',
      )}
    >
      <span className="relative mt-0.5 shrink-0">
        <span
          className={cn(
            'flex items-center justify-center rounded-full',
            md ? 'size-10' : 'size-9',
            style.chip,
          )}
        >
          <Icon className={md ? 'size-4.5' : 'size-4'} />
        </span>
        {category && (
          <span
            title={category.label}
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-white ring-1 ring-gray-100 shadow-sm"
          >
            <category.icon className="size-2.5 text-gray-400" />
          </span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-medium text-gray-900 leading-snug',
            md ? 'text-[15px]' : 'text-sm',
          )}
        >
          {n.title}
        </p>
        {n.body && (
          <p
            className={cn(
              'text-gray-500 mt-0.5',
              md ? 'text-sm' : 'text-xs line-clamp-2',
            )}
          >
            {n.body}
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">
          {formatDistanceToNow(new Date(n.sentAt ?? n.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      {unread && (
        <span
          className="mt-2 size-2 rounded-full bg-primary shrink-0"
          aria-label="Unread"
        />
      )}
    </div>
  );
}
