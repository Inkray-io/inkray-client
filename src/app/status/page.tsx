'use client';

/**
 * Public system status page — standalone (no app shell), safe to view logged
 * out. Polls GET /status every 30s and shows overall status + per-component
 * health grouped, with 24h uptime. No sensitive detail is exposed here.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import {
  usePublicStatus,
  type ComponentStatus,
  type OverallStatus,
  type PublicComponent,
} from '@/hooks/useStatus';

const DOT: Record<ComponentStatus, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
  unknown: 'bg-zinc-400',
};

const LABEL: Record<ComponentStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Unknown',
};

const OVERALL: Record<OverallStatus, { text: string; cls: string }> = {
  operational: { text: 'All systems operational', cls: 'bg-emerald-500' },
  degraded: { text: 'Degraded performance', cls: 'bg-amber-500' },
  partial_outage: { text: 'Partial outage', cls: 'bg-orange-500' },
  major_outage: { text: 'Major outage', cls: 'bg-red-500' },
  unknown: { text: 'Status unknown', cls: 'bg-zinc-400' },
};

function StatusDot({ status }: { status: ComponentStatus }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${DOT[status]}`} />
      <span className="text-sm text-muted-foreground">{LABEL[status]}</span>
    </span>
  );
}

function ComponentRow({ c }: { c: PublicComponent }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
        {c.wallets && c.wallets.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {c.wallets.map((w) => (
              <span key={w.label}>
                {w.label}: {w.sui} SUI / {w.wal} WAL
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {c.uptime24h != null && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {c.uptime24h}% (24h)
          </span>
        )}
        <StatusDot status={c.status} />
      </div>
    </div>
  );
}

export default function StatusPage() {
  const { data, isLoading, isError, dataUpdatedAt } = usePublicStatus();

  const overall = data?.overall ?? 'unknown';
  const banner = OVERALL[overall];

  const updated = useMemo(
    () => (dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString() : null),
    [dataUpdatedAt],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-foreground">
            Inkray
          </Link>
          <span className="text-sm text-muted-foreground">System status</span>
        </header>

        {/* Overall banner */}
        <div className="mb-8 overflow-hidden rounded-xl border border-border">
          <div className={`flex items-center gap-3 px-5 py-4 ${banner.cls}`}>
            <span className="h-3 w-3 rounded-full bg-white/90" />
            <span className="text-base font-semibold text-white">
              {isLoading ? 'Loading status…' : banner.text}
            </span>
          </div>
          {updated && (
            <div className="bg-card px-5 py-2 text-xs text-muted-foreground">
              Last updated {updated} · refreshes every 30s
            </div>
          )}
        </div>

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load status. The API may be unreachable.
          </div>
        )}

        {/* Groups */}
        <div className="space-y-6">
          {data?.groups.map((group) => (
            <section
              key={group.group}
              className="rounded-xl border border-border bg-card"
            >
              <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
                {group.group}
              </h2>
              <div className="divide-y divide-border px-5">
                {group.components.map((c) => (
                  <ComponentRow key={c.id} c={c} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Powered by the Inkray status monitor
        </footer>
      </div>
    </div>
  );
}
