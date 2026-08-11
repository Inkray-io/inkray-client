'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Info affordance shown on the "Milestone bonus removed" XP-history entry.
 * Explains, in plain terms, why the per-article 10/50-like bonuses were revoked
 * for everyone. The memorable element is the threshold-spike table: articles pile
 * up right at 50 likes, which is only explicable as farming to the milestone.
 */

const DISTRIBUTION: { range: string; articles: string; spike?: boolean }[] = [
  { range: '5–9', articles: '1,612' },
  { range: '10–14', articles: '684' },
  { range: '15–19', articles: '279' },
  { range: '20–49', articles: '728' },
  { range: '50–59', articles: '2,398', spike: true },
  { range: '60–99', articles: '805' },
  { range: '100+', articles: '414' },
];

export function MilestoneRemovalInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="Why was this XP removed?"
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
      >
        <AlertCircle className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertCircle className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base leading-tight">
                  Why this XP was removed
                </DialogTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  A fairness correction applied to every account.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1 text-sm text-foreground">
            <p>
              The per-article bonuses{' '}
              <span className="font-medium">“article reaches 10 likes”</span> (25
              XP) and{' '}
              <span className="font-medium">“article reaches 50 likes”</span> (75
              XP) had{' '}
              <span className="font-medium">no daily cap and recurred on every
              article</span>
              , so high-volume posters earned them hundreds of times.
            </p>

            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                396,375 XP
              </div>
              <div className="text-xs text-muted-foreground">
                removed from these bonuses in total
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold tabular-nums text-foreground">
                    266,325
                  </span>{' '}
                  from 50-like · 3,551 awards
                </div>
                <div>
                  <span className="font-semibold tabular-nums text-foreground">
                    130,050
                  </span>{' '}
                  from 10-like · 5,202 awards
                </div>
              </div>
              <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                One account alone earned the 50-like bonus{' '}
                <span className="font-medium text-foreground">595 times</span>{' '}
                (44,625 XP).
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                How we know it was farmed
              </h4>
              <p className="text-sm text-muted-foreground">
                Organic like-counts taper off smoothly. Instead, the number of
                articles spikes right at the 50-like threshold — articles were
                liked to just clear the bonus, then abandoned.
              </p>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full border-collapse text-center text-xs">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="whitespace-nowrap px-2 py-1.5 text-left font-medium">
                        Likes / article
                      </th>
                      {DISTRIBUTION.map((d) => (
                        <th
                          key={d.range}
                          className={`whitespace-nowrap px-2 py-1.5 font-medium ${
                            d.spike ? 'text-rose-700' : ''
                          }`}
                        >
                          {d.range}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="whitespace-nowrap px-2 py-1.5 text-left text-muted-foreground">
                        Articles
                      </td>
                      {DISTRIBUTION.map((d) => (
                        <td
                          key={d.range}
                          className={`px-2 py-1.5 tabular-nums ${
                            d.spike
                              ? 'bg-rose-50 font-bold text-rose-700'
                              : 'text-foreground'
                          }`}
                        >
                          {d.articles}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">2,398 articles</span>{' '}
                sit at exactly 50–59 likes — over{' '}
                <span className="font-medium text-foreground">3×</span> the 20–49
                band below it. That spike is only explicable as farming to the
                milestone.
              </p>
            </div>

            <div className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5 text-sm text-rose-900">
              All XP from both bonuses was removed{' '}
              <span className="font-semibold">uniformly, for every account</span>{' '}
              — including honest creators — so the leaderboard reflects genuine
              contribution.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 h-10 w-full rounded-lg bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Got it
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
