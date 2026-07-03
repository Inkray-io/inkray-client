"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Deterministic pixel identicon derived from an address / publication id.
 *
 * Same seed → same avatar, everywhere, with no network call. A 5×5 grid is
 * generated with vertical-mirror symmetry (GitHub-identicon style) and a hue
 * derived from the seed, then rendered as crisp SVG squares. The Avatar
 * container clips the square art into a circle; a 1-cell margin keeps the
 * pattern clear of the crop.
 */

// FNV-1a 32-bit — fast, well-distributed string hash.
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32 — small deterministic PRNG seeded from the hash.
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRID = 5; // 5×5 symmetric content grid
const CELL = 2; // pixel size in viewBox units (integers keep edges crisp)
const PAD = 3; // margin so the content stays well inside the circular crop
const SIZE = GRID * CELL + PAD * 2; // 16

/**
 * The deterministic hue for a seed — the same value the identicon uses
 * (first draw of its PRNG), exported so other identity surfaces (masthead
 * banners) can share the exact color family.
 */
export function identityHue(seed: string): number {
  const rand = mulberry32(hashSeed((seed || '').toLowerCase()));
  return Math.floor(rand() * 360);
}

/**
 * Masthead banner gradient for a seed. Same hue family as the identicon but
 * rich and saturated (L 40–55%), while the identicon body stays pale
 * (L 94% + white ring) — so avatar-on-banner contrast holds by construction.
 */
export function mastheadGradient(seed: string): string {
  const h = identityHue(seed);
  const h2 = (h + 40) % 360;
  return `linear-gradient(135deg, hsl(${h}, 62%, 55%), hsl(${h2}, 64%, 40%))`;
}

export interface IdenticonProps {
  /** Address or publication id — the deterministic seed. */
  seed: string;
  className?: string;
}

export function Identicon({ seed, className }: IdenticonProps) {
  const rand = mulberry32(hashSeed((seed || '').toLowerCase()));

  // Deterministic hue with fixed saturation/lightness for a cohesive, soft look.
  const hue = Math.floor(rand() * 360);
  const fg = `hsl(${hue}, 62%, 52%)`;
  const bg = `hsl(${hue}, 52%, 94%)`;

  const half = Math.ceil(GRID / 2); // left columns generated, then mirrored
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < GRID; r++) {
    const y = PAD + r * CELL;
    for (let c = 0; c < half; c++) {
      if (rand() > 0.5) {
        const x1 = PAD + c * CELL;
        const x2 = PAD + (GRID - 1 - c) * CELL;
        cells.push(
          <rect key={`${r}-${c}`} x={x1} y={y} width={CELL} height={CELL} fill={fg} />,
        );
        if (x2 !== x1) {
          cells.push(
            <rect key={`${r}-${c}-m`} x={x2} y={y} width={CELL} height={CELL} fill={fg} />,
          );
        }
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      // `size-full` opts out of shadcn Button's `[&_svg:not([class*='size-'])]:size-4`;
      // inline size is a belt-and-suspenders override for any other `[&_svg]` rule.
      className={cn('block size-full', className)}
      style={{ width: '100%', height: '100%' }}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width={SIZE} height={SIZE} fill={bg} />
      {cells}
    </svg>
  );
}
