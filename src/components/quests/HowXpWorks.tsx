'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HelpCircle,
  Sparkles,
  Repeat2,
  LayoutGrid,
  Timer,
  MessageCircle,
  PenSquare,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Plain-language overview of how XP is earned — the big picture that
 * complements each quest's own ⓘ details. Deliberately principle-based: it
 * explains the *categories* of why an action might not add XP (repeat actions,
 * daily limits, pacing, low-effort/duplicate comments, review, removed content)
 * without publishing exact thresholds. Cuts "why didn't I get XP?" tickets.
 */

interface Point {
  icon: typeof Sparkles;
  tint: string;
  title: string;
  body: string;
}

const POINTS: Point[] = [
  {
    icon: Sparkles,
    tint: 'bg-amber-50 text-amber-600',
    title: 'Genuine activity, quality over quantity',
    body: 'XP rewards real participation on Inkray — reading, writing, and engaging with things you actually care about.',
  },
  {
    icon: Repeat2,
    tint: 'bg-primary/10 text-primary',
    title: 'You earn the first time',
    body: 'Liking, following, or bookmarking earns XP the first time. Doing the same thing again on the same post — or undoing and redoing it — doesn’t add more.',
  },
  {
    icon: LayoutGrid,
    tint: 'bg-violet-50 text-violet-600',
    title: 'A daily mix earns the most',
    body: 'Each activity has a daily limit, so a varied day of genuine activity earns more than repeating one thing over and over.',
  },
  {
    icon: Timer,
    tint: 'bg-sky-50 text-sky-600',
    title: 'Activity is paced',
    body: 'Rapid-fire actions are counted gently to keep the leaderboard fair. If something didn’t add XP, giving it a little time often helps.',
  },
  {
    icon: MessageCircle,
    tint: 'bg-rose-50 text-rose-500',
    title: 'Comments should be your own words',
    body: 'Comments earn XP when they’re a genuine thought — not a one-word reply, and not the same comment pasted around. Comments on your own articles don’t earn XP.',
  },
  {
    icon: PenSquare,
    tint: 'bg-emerald-50 text-emerald-600',
    title: 'Publishing is rewarded after a quick review',
    body: 'Publishing XP is added once your article passes a fast automated review (usually within a few minutes), and higher-effort, quality writing is rewarded most.',
  },
  {
    icon: ShieldCheck,
    tint: 'bg-gray-100 text-gray-600',
    title: 'Removed content earns nothing',
    body: 'Anything later removed or flagged as spam earns no XP — for anyone who engaged with it. Keeps the leaderboard honest.',
  },
];

function HowXpWorksBody() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 leading-relaxed">
        Not every action adds XP, and that&apos;s by design — here&apos;s how it
        works. For the exact reward of any single quest, tap its{' '}
        <span className="font-medium text-gray-900">ⓘ</span> on the Quests tab.
      </p>

      <div className="space-y-3">
        {POINTS.map((point) => {
          const Icon = point.icon;
          return (
            <div key={point.title} className="flex items-start gap-3">
              <div
                className={cn(
                  'size-8 rounded-lg flex items-center justify-center shrink-0',
                  point.tint,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {point.title}
                </div>
                <div className="text-xs text-gray-600 leading-relaxed mt-0.5">
                  {point.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
        <p className="text-xs text-gray-600 leading-relaxed">
          Want to see exactly where your points came from? Your{' '}
          <span className="font-medium text-gray-900">XP history</span> lists
          every point you&apos;ve earned.
        </p>
      </div>
    </div>
  );
}

/**
 * Trigger + dialog. `variant="link"` renders a text link ("How XP works");
 * `variant="icon"` renders a small help-icon button.
 */
export function HowXpWorksButton({
  variant = 'link',
  className,
}: {
  variant?: 'link' | 'icon';
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="How XP works"
          className={cn(
            'size-6 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors shrink-0 cursor-pointer',
            className,
          )}
        >
          <HelpCircle className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary transition-colors cursor-pointer',
            className,
          )}
        >
          <HelpCircle className="size-3.5" />
          How XP works
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">How XP works</DialogTitle>
          </DialogHeader>
          <HowXpWorksBody />
        </DialogContent>
      </Dialog>
    </>
  );
}
