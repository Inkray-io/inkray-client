'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDAppKit } from '@mysten/dapp-kit-react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { ConnectButton } from '@/components/wallet/connect';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/utils/Logger';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const SCOPE_INFO: Record<string, { title: string; desc: string; high?: boolean }> = {
  'inkray:read': {
    title: 'Read public content',
    desc: 'Browse public articles, feeds, and publications.',
  },
  'inkray:account': {
    title: 'View your account',
    desc: 'See your profile, your publications, and your XP.',
  },
  'inkray:drafts': {
    title: 'Manage your drafts',
    desc: 'Create and edit draft articles on your behalf.',
  },
  'inkray:publish': {
    title: 'Publish articles',
    desc: 'Publish articles under publications you own.',
    high: true,
  },
};

const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

function ConsentInner() {
  const params = useSearchParams();
  const { isConnected, address } = useWalletConnection();
  const dAppKit = useDAppKit();
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);

  const p = useMemo(
    () => ({
      clientId: params.get('client_id') || '',
      redirectUri: params.get('redirect_uri') || '',
      scope: params.get('scope') || '',
      codeChallenge: params.get('code_challenge') || '',
      codeChallengeMethod: params.get('code_challenge_method') || 'S256',
      state: params.get('state') || '',
      resource: params.get('resource') || '',
    }),
    [params],
  );
  const scopes = p.scope.split(/\s+/).filter(Boolean);
  const missing = !p.clientId || !p.redirectUri || !p.codeChallenge || scopes.length === 0;

  useEffect(() => {
    if (!p.clientId) return;
    fetch(`${API}/oauth/authorize/client-info?client_id=${encodeURIComponent(p.clientId)}`)
      .then((r) => r.json())
      .then((d) => setClientName(d?.client_name ?? null))
      .catch(() => {});
  }, [p.clientId]);

  const cancel = useCallback(() => {
    if (!p.redirectUri) return;
    try {
      const u = new URL(p.redirectUri);
      u.searchParams.set('error', 'access_denied');
      if (p.state) u.searchParams.set('state', p.state);
      window.location.href = u.toString();
    } catch {
      /* invalid redirect — stay put */
    }
  }, [p]);

  const authorize = useCallback(async () => {
    if (missing || !address) return;
    setBusy(true);
    setError(null);
    try {
      // 1) fresh nonce + message
      const initRes = await authAPI.initAuth();
      const initData = initRes.data?.data || initRes.data;
      const message: string = initData.message;
      const nonce: string = initData.nonce;
      const tsMatch = message.match(/Timestamp: (.+)\n/);
      const timestamp = tsMatch ? tsMatch[1] : new Date().toISOString();

      // 2) wallet signs the message
      const { signature } = await dAppKit.signPersonalMessage({
        message: new TextEncoder().encode(message),
      });

      // 3) exchange for an authorization code, then hand it back to the client
      const invite =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('inkray_invite_code') || undefined
          : undefined;
      const res = await fetch(`${API}/oauth/authorize/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          nonce,
          timestamp,
          publicKey: address,
          wallet: 'Sui Wallet',
          blockchain: 'SUI',
          inviteCode: invite,
          client_id: p.clientId,
          redirect_uri: p.redirectUri,
          scope: p.scope,
          code_challenge: p.codeChallenge,
          code_challenge_method: p.codeChallengeMethod,
          state: p.state,
          resource: p.resource,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirect_uri) {
        throw new Error(data.error_description || data.error || 'Authorization failed');
      }
      window.location.href = data.redirect_uri;
    } catch (e: any) {
      const msg = e?.message || 'Authorization failed';
      log.error('OAuth approve failed', { error: msg }, 'OAuthConsent');
      setError(msg);
      toast({ title: 'Authorization failed', description: msg, variant: 'destructive' });
      setBusy(false);
    }
  }, [missing, address, dAppKit, p, toast]);

  if (missing) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-neutral-900">Invalid request</h1>
        <p className="mt-2 text-sm text-neutral-600">
          This authorization link is missing required parameters. Please start
          again from the application you were connecting.
        </p>
      </Card>
    );
  }

  const appLabel = clientName || 'An application';

  return (
    <Card>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-600">
        Authorize access
      </div>
      <h1 className="mt-2 text-xl font-semibold text-neutral-900">
        {appLabel} wants to connect to your Inkray account
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Approving lets it act on your behalf with the permissions below. You can
        revoke access at any time from your account settings.
      </p>

      <ul className="mt-5 space-y-3">
        {scopes.map((s) => {
          const info = SCOPE_INFO[s];
          return (
            <li key={s} className="flex gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  info?.high ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                aria-hidden
              >
                ✓
              </span>
              <div>
                <div className="text-sm font-medium text-neutral-900">
                  {info?.title || s}
                </div>
                <div className="text-xs text-neutral-500">
                  {info?.desc || 'Access to this capability.'}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 border-t border-neutral-100 pt-5">
        {!isConnected || !address ? (
          <>
            <p className="mb-3 text-sm text-neutral-600">
              Connect your Sui wallet to continue.
            </p>
            <ConnectButton />
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
              <span className="text-xs text-neutral-500">Signing in as</span>
              <span className="font-mono text-xs text-neutral-800">
                {short(address)}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={cancel}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={authorize}
                disabled={busy}
              >
                {busy ? 'Authorizing…' : 'Authorize'}
              </Button>
            </div>
            <p className="mt-3 text-center text-[11px] text-neutral-400">
              You'll be asked to sign a message — this proves wallet ownership and
              costs no gas.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      {children}
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <Suspense
        fallback={<div className="text-sm text-neutral-400">Loading…</div>}
      >
        <ConsentInner />
      </Suspense>
    </div>
  );
}
