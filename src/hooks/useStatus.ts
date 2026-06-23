'use client';

import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type ComponentStatus = 'operational' | 'degraded' | 'down' | 'unknown';
export type OverallStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'unknown';

export interface PublicComponent {
  id: string;
  name: string;
  status: ComponentStatus;
  uptime24h: number | null;
  wallets?: { label: string; sui: number; wal: number; status: ComponentStatus }[];
}

export interface PublicStatusGroup {
  group: string;
  components: PublicComponent[];
}

export interface PublicStatus {
  overall: OverallStatus;
  updatedAt: string | null;
  groups: PublicStatusGroup[];
  message?: string;
}

/** Unwrap the backend's { success, data } envelope (or pass-through). */
function unwrap<T>(body: any): T {
  return (body?.data ?? body) as T;
}

async function fetchPublicStatus(): Promise<PublicStatus> {
  const res = await fetch(`${API_URL}/status`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return unwrap<PublicStatus>(await res.json());
}

export function usePublicStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: fetchPublicStatus,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

// ---- Detailed (Basic auth) -------------------------------------------------

export interface DetailedComponent {
  id: string;
  name: string;
  group: string;
  severity: 'critical' | 'optional';
  status: ComponentStatus;
  message: string;
  latencyMs?: number;
  detail?: Record<string, unknown>;
}

export interface DetailedStatus {
  run: {
    runId: string;
    startedAt: string;
    finishedAt: string;
    overall: OverallStatus;
    components: DetailedComponent[];
  } | null;
  uptime: { '24h': Record<string, number>; '7d': Record<string, number> };
  thresholds: Record<string, number | string>;
}

export async function fetchDetailedStatus(
  basicAuth: string,
): Promise<DetailedStatus> {
  const res = await fetch(`${API_URL}/status/detailed`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
    cache: 'no-store',
  });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error(`status ${res.status}`);
  return unwrap<DetailedStatus>(await res.json());
}
