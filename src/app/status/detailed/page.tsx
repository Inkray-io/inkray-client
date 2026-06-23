'use client';

/**
 * Internal detailed status page. Gated by the backend's Basic-auth admin
 * credentials (ADMIN_USERNAME / ADMIN_PASSWORD). Shows full per-component
 * detail: latencies, messages, wallet balances + addresses, and 24h/7d uptime.
 *
 * Credentials are kept in memory for the session only (never persisted).
 */
import { useEffect, useState } from 'react';
import {
  fetchDetailedStatus,
  type DetailedStatus,
  type DetailedComponent,
  type ComponentStatus,
} from '@/hooks/useStatus';

const DOT: Record<ComponentStatus, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
  unknown: 'bg-zinc-400',
};

interface WalletDetail {
  label: string;
  address: string;
  sui: number;
  wal: number;
  status: ComponentStatus;
  error?: string;
}

function WalletTable({ c }: { c: DetailedComponent }) {
  const wallets = (c.detail?.wallets as WalletDetail[]) || [];
  if (!wallets.length) return null;
  return (
    <table className="mt-2 w-full text-xs">
      <thead className="text-muted-foreground">
        <tr className="text-left">
          <th className="py-1 pr-4 font-medium">Wallet</th>
          <th className="py-1 pr-4 font-medium">Address</th>
          <th className="py-1 pr-4 font-medium">SUI</th>
          <th className="py-1 pr-4 font-medium">WAL</th>
          <th className="py-1 font-medium">Status</th>
        </tr>
      </thead>
      <tbody className="font-mono">
        {wallets.map((w) => (
          <tr key={w.label} className="border-t border-border">
            <td className="py-1 pr-4">{w.label}</td>
            <td className="py-1 pr-4">
              {w.address.slice(0, 8)}…{w.address.slice(-6)}
            </td>
            <td className="py-1 pr-4">{w.sui < 0 ? '—' : w.sui}</td>
            <td className="py-1 pr-4">{w.wal < 0 ? '—' : w.wal}</td>
            <td className="py-1">
              <span className={`inline-block h-2 w-2 rounded-full ${DOT[w.status]}`} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ComponentCard({
  c,
  uptime,
}: {
  c: DetailedComponent;
  uptime: { d1?: number; d7?: number };
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${DOT[c.status]}`} />
            <span className="font-medium text-foreground">{c.name}</span>
            {c.severity === 'critical' && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                critical
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{c.message}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {c.latencyMs != null && <div>{c.latencyMs}ms</div>}
          {uptime.d1 != null && <div>24h: {uptime.d1}%</div>}
          {uptime.d7 != null && <div>7d: {uptime.d7}%</div>}
        </div>
      </div>
      {c.id.startsWith('wallets') && <WalletTable c={c} />}
    </div>
  );
}

export default function DetailedStatusPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [auth, setAuth] = useState<string | null>(null);
  const [data, setData] = useState<DetailedStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(basic: string) {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDetailedStatus(basic);
      setData(d);
      setAuth(basic);
    } catch (e: any) {
      setError(e?.message === 'unauthorized' ? 'Invalid credentials' : 'Failed to load');
      setAuth(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh every 30s once authenticated.
  useEffect(() => {
    if (!auth) return;
    const t = setInterval(() => fetchDetailedStatus(auth).then(setData).catch(() => {}), 30_000);
    return () => clearInterval(t);
  }, [auth]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    load(btoa(`${user}:${pass}`));
  }

  if (!auth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-xl border border-border bg-card p-6"
        >
          <h1 className="mb-1 text-lg font-semibold text-foreground">
            Internal status
          </h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Sign in with admin credentials.
          </p>
          <input
            className="mb-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoFocus
          />
          <input
            className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  const run = data?.run;
  const u1 = data?.uptime?.['24h'] || {};
  const u7 = data?.uptime?.['7d'] || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
            System status — detailed
          </h1>
          <button
            onClick={() => auth && load(auth)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Refresh
          </button>
        </header>

        {run && (
          <div className="mb-6 text-sm text-muted-foreground">
            Overall: <span className="font-medium text-foreground">{run.overall}</span> ·
            run {run.runId} · {new Date(run.finishedAt).toLocaleString()}
          </div>
        )}

        <div className="grid gap-3">
          {run?.components.map((c) => (
            <ComponentCard
              key={c.id}
              c={c}
              uptime={{ d1: u1[c.id], d7: u7[c.id] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
