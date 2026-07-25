'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiCheckBadge } from 'react-icons/hi2';
import { useCreatorBubbles, CreatorBubble } from '@/hooks/useCreatorBubbles';
import { packBubbles } from '@/lib/utils/bubblePack';
import { identiconDataUri } from '@/components/ui/Identicon';
import { ROUTES } from '@/constants/routes';

/** Bubble ring/backing: bigger + higher-quality creators read as a deeper brand blue. */
function fillFor(b: CreatorBubble): string {
  const t = Math.min(1, b.score); // 0..1
  const light = 92 - Math.round(t * 40); // 92% → 52%
  return `hsl(214 90% ${light}%)`;
}

export function CreatorBubbleMap({ limit = 80 }: { limit?: number }) {
  const { bubbles, isLoading, error } = useCreatorBubbles(limit);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!size.w || !size.h || bubbles.length === 0) return null;
    const packed = packBubbles(
      bubbles.map((b) => ({ id: b.id, score: b.score })),
      size.w,
      size.h,
      { gap: 6 },
    );
    const byId = new Map(bubbles.map((b) => [b.id, b]));
    return packed.bubbles.map((p) => ({ ...p, data: byId.get(p.id)! }));
  }, [bubbles, size]);

  return (
    <div className="relative w-full">
      <div
        ref={wrapRef}
        className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-gray-50 to-white"
      >
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading creators…</div>
        )}
        {error && !isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-red-500">{error}</div>
        )}
        {!isLoading && !error && layout && (
          // width:100% (not a fixed px width) so the flex column can shrink and
          // never forces horizontal page scroll; the viewBox carries the layout
          // coordinate space, which matches the measured container 1:1.
          <svg
            width="100%"
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            preserveAspectRatio="xMidYMid meet"
            className="block max-w-full"
          >
            <defs>
              {layout.map((n) => (
                <clipPath id={`clip-${n.id}`} key={n.id}>
                  <circle cx={n.x} cy={n.y} r={n.r} />
                </clipPath>
              ))}
            </defs>
            {layout.map((n, i) => {
              const isHover = hover === n.id;
              // Their set avatar if they have one, otherwise the platform's
              // deterministic pixel identicon (same seed we use everywhere).
              const img = n.data.avatar || identiconDataUri(n.id);
              return (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(0.4, i * 0.012), type: 'spring', stiffness: 220, damping: 20 }}
                  style={{ cursor: 'pointer', transformOrigin: `${n.x}px ${n.y}px` }}
                  onClick={() => router.push(ROUTES.PUBLICATION_WITH_ID(n.id))}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                >
                  {/* Backing disc — tints the ring and shows through if art has any transparency. */}
                  <circle cx={n.x} cy={n.y} r={n.r} fill={fillFor(n.data)} />
                  <image
                    href={img}
                    x={n.x - n.r}
                    y={n.y - n.r}
                    width={n.r * 2}
                    height={n.r * 2}
                    clipPath={`url(#clip-${n.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  {/* Ring — thickens + turns brand-blue on hover. */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill="none"
                    stroke={isHover ? 'hsl(214 90% 45%)' : 'rgba(255,255,255,0.9)'}
                    strokeWidth={isHover ? 3 : 1.5}
                  />
                </motion.g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Hover tooltip — rendered OUTSIDE the clipped container so top-row bubbles
          aren't cut off; flips below the bubble when there isn't room above. */}
      {layout && hover && (() => {
        const n = layout.find((x) => x.id === hover);
        if (!n) return null;
        const b = n.data;
        const above = n.y - n.r > 80; // room to sit above the bubble?
        const left = Math.max(116, Math.min(size.w - 116, n.x));
        const top = above ? n.y - n.r - 10 : n.y + n.r + 10;
        return (
          <div
            className="pointer-events-none absolute z-20 w-[220px] max-w-[220px] rounded-xl bg-gray-900 px-3 py-2 text-xs text-white shadow-xl ring-1 ring-black/5"
            style={{
              left,
              top,
              transform: `translate(-50%, ${above ? '-100%' : '0'})`,
            }}
          >
            <div className="flex items-center gap-1 font-semibold">
              <span className="truncate">{b.name}</span>
              {b.isVerified && <HiCheckBadge className="size-3.5 shrink-0 text-blue-300" />}
            </div>
            <div className="mt-1 flex flex-col gap-y-0.5 text-[11px] text-gray-300">
              <span>{b.followers} followers</span>
              <span>{b.articles} articles</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
