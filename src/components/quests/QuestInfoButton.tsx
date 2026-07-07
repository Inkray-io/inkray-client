'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Info,
  Zap,
  Repeat2,
  CalendarClock,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import type {
  QuestResponse,
  RecurringQuestItem,
  AchievementQuestItem,
} from '@/lib/api';

/**
 * Structured detail content shown in the quest info dialog.
 */
export interface QuestInfo {
  title: string;
  /** Reward line, e.g. "+5 XP per like" */
  reward: string;
  /** Frequency line, e.g. "Daily — up to 30× per day" or "One-time" */
  frequency: string;
  /** When the counter resets (only for capped quests) */
  resets?: string;
  /** Longer "how it works" explanation */
  how: string;
  /** Fair-play / anti-abuse rules that apply */
  rules?: string[];
  /** How completion is verified (X quests) */
  verification?: string;
}

/**
 * Detailed explanations for the built-in recurring quests, keyed by catalog
 * key. Dynamic values (XP, caps) come from the item itself; this map holds
 * the rules that aren't in the API payload.
 */
const RECURRING_DETAILS: Record<
  string,
  { how: string; rules?: string[] }
> = {
  publish_article: {
    how: 'Publish any article on Inkray. XP is credited the moment your article lands on-chain and appears in the feed.',
    rules: [
      'Articles with a 7+ minute read time (~1,500+ words) earn the "long article" reward instead — the two don\'t stack.',
    ],
  },
  publish_long_article: {
    how: 'Publish an in-depth article with a reading time of 7 minutes or more (roughly 1,500+ words). Longer, higher-effort writing earns double the standard publishing XP.',
  },
  write_comment: {
    how: 'Join the conversation under any article. Thoughtful comments earn XP for you and for the article\'s author.',
    rules: [
      'Comments must be at least 50 characters to count.',
      'Only your first 3 comments on the same article each day earn XP.',
    ],
  },
  like_article: {
    how: 'Like articles you enjoy. Likes also feed the popularity ranking, so they help great content get discovered.',
    rules: [
      'Each article can earn you like-XP only once, ever — unliking and re-liking doesn\'t award again.',
      'Liking your own articles earns nothing.',
    ],
  },
  follow_publication: {
    how: 'Follow publications to build your feed. Your "My Feed" tab shows the latest from everyone you follow.',
    rules: ['Each publication counts once, ever — unfollow/refollow doesn\'t re-award.'],
  },
  bookmark_article: {
    how: 'Save articles to your bookmarks to read later. Bookmarks are private.',
    rules: ['Each article counts once, ever.'],
  },
  received_like: {
    how: 'Earn XP passively whenever a reader likes one of your articles. Write things people love and the XP takes care of itself.',
    rules: ['Each reader counts once per article. Your own likes don\'t count.'],
  },
  received_follower: {
    how: 'Earn XP whenever someone follows one of your publications.',
    rules: ['Each follower counts once per publication.'],
  },
  received_comment: {
    how: 'Earn XP whenever readers comment on your articles (comments of 50+ characters).',
    rules: ['At most 3 comments per reader per article per day count.'],
  },
  article_10_likes: {
    how: 'A one-time bonus for every article of yours that reaches 10 likes. Each article can trigger this once.',
  },
  article_50_likes: {
    how: 'A one-time bonus for every article of yours that reaches 50 likes. Each article can trigger this once.',
  },
  invite_accepted: {
    how: 'Share your invite codes (Invites page). When someone creates an account using your code, you earn XP.',
  },
  referred_first_article: {
    how: 'When a writer you invited publishes their very first article, you earn a referral bonus on top of the invite XP.',
  },
};

/** Detailed explanations for one-time achievements, keyed by catalog key. */
const ACHIEVEMENT_DETAILS: Record<string, string> = {
  profile_complete:
    'Add both a profile picture and a bio on your profile page. The achievement unlocks automatically the next time you save your profile.',
  first_like: 'Like any article for the first time.',
  first_follow: 'Follow any publication for the first time.',
  first_comment:
    'Write your first comment of at least 50 characters under any article.',
  first_article: 'Publish your very first article on Inkray.',
  first_tip:
    'Tip any article with SUI for the first time. Tips are on-chain, so the achievement unlocks shortly after your transaction confirms.',
  first_invite_redeemed:
    'Share one of your invite codes and have someone create an account with it.',
  x_connected:
    'Link your X (Twitter) account from the Quests page. This also unlocks X social quests.',
};

function recurringInfo(item: RecurringQuestItem): QuestInfo {
  const details = RECURRING_DETAILS[item.key];
  const capped = item.dailyCap !== null;
  return {
    title: item.title,
    reward: `+${item.xp} XP each time`,
    frequency: capped
      ? `Daily — up to ${item.dailyCap}× per day`
      : 'Repeatable — no daily cap',
    resets: capped ? 'Progress resets every day at 00:00 UTC' : undefined,
    how: details?.how ?? item.description,
    rules: details?.rules,
  };
}

function achievementInfo(item: AchievementQuestItem): QuestInfo {
  const startsWithMilestone =
    item.key.startsWith('articles_milestone') ||
    item.key.startsWith('followers_milestone');
  return {
    title: item.title,
    reward: `+${item.xp} XP, once`,
    frequency: 'One-time achievement',
    how:
      ACHIEVEMENT_DETAILS[item.key] ??
      (startsWithMilestone
        ? `${item.description} Progress counts everything you've done so far — it unlocks automatically as soon as you cross the threshold.`
        : item.description),
  };
}

function questInfo(quest: QuestResponse): QuestInfo {
  const isX = quest.type.startsWith('x_');
  const actionByType: Record<string, string> = {
    x_follow: 'Follow the target account on X.',
    x_like: 'Like the linked post on X.',
    x_retweet: 'Repost the linked post on X.',
    x_comment: 'Reply to the linked post on X.',
  };

  return {
    title: quest.title,
    reward: `+${quest.xpReward} XP, once`,
    frequency: quest.endsAt
      ? `One-time — available until ${new Date(quest.endsAt).toLocaleDateString()}`
      : 'One-time',
    how: isX
      ? `${actionByType[quest.type] ?? 'Complete the action on X.'} ${
          quest.description ?? ''
        }`.trim()
      : quest.description ??
        'Completed automatically when you perform the action on Inkray.',
    verification: isX
      ? 'Requires a connected X account. Completions are verified automatically twice a day (around 08:00 and 20:00 UTC) — XP can take a few hours to arrive after you complete the action.'
      : 'Completed and credited automatically — no claiming needed.',
  };
}

function InfoDialogBody({ info }: { info: QuestInfo }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 leading-relaxed">{info.how}</p>

      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Zap className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-gray-900">Reward</div>
            <div className="text-xs text-gray-600">{info.reward}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Repeat2 className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-gray-900">
              How often
            </div>
            <div className="text-xs text-gray-600">{info.frequency}</div>
          </div>
        </div>

        {info.resets && (
          <div className="flex items-start gap-2.5">
            <CalendarClock className="size-4 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-gray-900">Resets</div>
              <div className="text-xs text-gray-600">{info.resets}</div>
            </div>
          </div>
        )}

        {info.verification && (
          <div className="flex items-start gap-2.5">
            <BadgeCheck className="size-4 text-green-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-gray-900">
                Verification
              </div>
              <div className="text-xs text-gray-600">{info.verification}</div>
            </div>
          </div>
        )}

        {info.rules && info.rules.length > 0 && (
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-gray-900">
                Fair play
              </div>
              <ul className="text-xs text-gray-600 space-y-1 mt-0.5 list-disc pl-4">
                {info.rules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Small "info" icon button that opens a dialog explaining a quest in detail:
 * what it does, how often it can be completed, when it resets, and the
 * fair-play rules that apply.
 */
export function QuestInfoButton({ info }: { info: QuestInfo }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`About "${info.title}"`}
        className="size-5 rounded-full flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/10 transition-colors shrink-0 cursor-pointer"
      >
        <Info className="size-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{info.title}</DialogTitle>
          </DialogHeader>
          <InfoDialogBody info={info} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export const questInfoBuilders = {
  recurring: recurringInfo,
  achievement: achievementInfo,
  quest: questInfo,
};
