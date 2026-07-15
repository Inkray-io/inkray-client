'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { mcpAPI, type ConnectedApp } from '@/lib/api';
import {
  HiCommandLine,
  HiClipboard,
  HiCheck,
  HiTrash,
  HiBookOpen,
  HiSparkles,
} from 'react-icons/hi2';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const SCOPE_LABEL: Record<string, string> = {
  'inkray:read': 'Read public articles, feeds, and publications',
  'inkray:account': 'View your profile, your publications, and your XP',
  'inkray:drafts': 'Create and manage your drafts',
  'inkray:publish': 'Publish articles under publications you own',
};

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (!d) return '';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function McpPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [mcpUrl, setMcpUrl] = useState(`${API}/mcp`);
  const [scopes, setScopes] = useState<string[]>(Object.keys(SCOPE_LABEL));
  const [apps, setApps] = useState<ConnectedApp[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth');
  }, [authLoading, isAuthenticated, router]);

  // Authoritative MCP URL + scopes come from the Protected Resource Metadata.
  useEffect(() => {
    fetch(`${API}/.well-known/oauth-protected-resource`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.resource) setMcpUrl(d.resource);
        if (Array.isArray(d?.scopes_supported)) setScopes(d.scopes_supported);
      })
      .catch(() => {});
  }, []);

  const loadApps = useCallback(async () => {
    try {
      const res = await mcpAPI.getConnectedApps();
      setApps(((res.data as any).data || res.data) as ConnectedApp[]);
    } catch {
      setApps([]);
    }
  }, []);
  useEffect(() => {
    if (isAuthenticated) loadApps();
  }, [isAuthenticated, loadApps]);

  const copy = () => {
    navigator.clipboard?.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const revoke = async (app: ConnectedApp) => {
    setRevoking(app.clientId);
    try {
      await mcpAPI.revokeApp(app.clientId);
      toast({
        title: 'Disconnected',
        description: `${app.clientName} can no longer access your account.`,
      });
      await loadApps();
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke access', variant: 'destructive' });
    } finally {
      setRevoking(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <AppLayout currentPage="mcp">
        <div className="max-w-4xl py-8 text-sm text-muted-foreground">Loading…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="mcp">
      <div className="max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8 flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiCommandLine className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-foreground">MCP server</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Connect AI assistants — Claude, ChatGPT, Cursor, or your own agents —
              to Inkray. They can read content and, with your approval, publish
              articles under your publications. Access is authorized by your wallet;
              there are no API keys to manage.
            </p>
          </div>
        </div>

        {/* How to connect */}
        <section className="mb-8 rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <HiSparkles className="h-5 w-5 text-primary" /> Connect an assistant
          </h2>

          <label className="text-xs font-medium text-muted-foreground">
            Server URL
          </label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-sm">
              {mcpUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied ? (
                <>
                  <HiCheck className="mr-1 h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <HiClipboard className="mr-1 h-4 w-4" /> Copy
                </>
              )}
            </Button>
          </div>

          <ol className="mt-5 space-y-3 text-sm text-foreground">
            <Step n={1}>
              In your MCP client, add a <strong>remote / custom MCP server</strong> and
              paste the URL above.
            </Step>
            <Step n={2}>
              A browser page opens — <strong>connect your Sui wallet</strong> and review
              the permissions you're granting.
            </Step>
            <Step n={3}>
              Approve by signing a message (no gas). The assistant can now use Inkray
              on your behalf.
            </Step>
          </ol>

          <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <HiBookOpen className="mt-0.5 h-4 w-4 shrink-0" />
            Uses OAuth 2.1 with automatic client registration, so most clients connect
            with just the URL. Publishing is rate-limited and only allowed on
            publications you own. You can revoke any app below at any time.
          </p>
        </section>

        {/* Permissions */}
        <section className="mb-8 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">What apps can access</h2>
          <ul className="space-y-3">
            {scopes.map((s) => (
              <li key={s} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                    s === 'inkray:publish' ? 'bg-amber-500' : 'bg-primary'
                  }`}
                >
                  ✓
                </span>
                <div>
                  <div className="text-sm font-medium">{s}</div>
                  <div className="text-xs text-muted-foreground">
                    {SCOPE_LABEL[s] || 'Access to this capability.'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Each app only gets the permissions you approve when connecting.
          </p>
        </section>

        {/* Connected apps */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Connected apps</h2>

          {apps === null ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : apps.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No apps connected yet. Add the server URL above in an MCP client to get
              started.
            </div>
          ) : (
            <ul className="divide-y">
              {apps.map((app) => (
                <li
                  key={app.clientId}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{app.clientName}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {app.scopes.map((s) => (
                        <span
                          key={s}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {s.replace('inkray:', '')}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Last used {timeAgo(app.lastUsedAt)} · connected{' '}
                      {new Date(app.connectedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => revoke(app)}
                    disabled={revoking === app.clientId}
                  >
                    <HiTrash className="mr-1 h-4 w-4" />
                    {revoking === app.clientId ? 'Revoking…' : 'Revoke'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
