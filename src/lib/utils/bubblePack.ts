/**
 * Self-contained circle packing for the creator bubble map (no d3 dependency).
 *
 * Bubble AREA is proportional to the creator score (radius ∝ √score), and the
 * whole layout is scaled dynamically to fit the given viewport. Placement is a
 * deterministic greedy spiral: the biggest bubble goes in the centre, each next
 * one spirals outward from the centroid to the first spot that doesn't overlap
 * an already-placed bubble. Good enough and stable for ≤ ~200 bubbles.
 */

export interface PackInput {
  id: string;
  score: number; // 0..1 (or any positive weight)
}

export interface PackedBubble {
  id: string;
  x: number;
  y: number;
  r: number;
}

export interface PackResult {
  bubbles: PackedBubble[];
  width: number;
  height: number;
}

/**
 * @param items   nodes with a positive `score`
 * @param width   viewport width
 * @param height  viewport height
 * @param opts    minR/maxR clamp the radius range; gap is spacing between bubbles
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~137.5° — even, non-aligned spread

export function packBubbles(
  items: PackInput[],
  width: number,
  height: number,
  opts: { minR?: number; maxR?: number; gap?: number } = {},
): PackResult {
  const gap = opts.gap ?? 6;
  const nodes = items.filter((i) => i.score > 0);
  if (nodes.length === 0) return { bubbles: [], width, height };

  // Radius ∝ √score, then scale so the largest bubble ≈ maxR (dynamic to data).
  // A generous minimum keeps the pixel identicon / avatar legible on small ones,
  // and the max is clamped so the top creator stays prominent without dominating.
  const maxScore = Math.max(...nodes.map((n) => n.score));
  const maxR = opts.maxR ?? clamp(Math.min(width, height) / 5.5, 44, 110);
  const minR = opts.minR ?? Math.min(maxR * 0.5, 16);
  const radiusOf = (score: number) => {
    const r = Math.sqrt(score / Math.max(maxScore, 1e-9)) * maxR;
    return Math.max(minR, r);
  };

  const sorted = [...nodes].sort((a, b) => b.score - a.score);
  const placed: PackedBubble[] = [];

  const overlaps = (x: number, y: number, r: number) =>
    placed.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + r + gap);

  for (const node of sorted) {
    const r = radiusOf(node.score);
    if (placed.length === 0) {
      placed.push({ id: node.id, x: 0, y: 0, r });
      continue;
    }
    // Spiral outward ring by ring and take the first free spot. Each ring is
    // rotated by the golden angle so successive rings don't align into visible
    // spokes — an even, organic spread — while still stopping early (efficient
    // even for ~150 bubbles).
    let best: { x: number; y: number } | null = null;
    const step = Math.max(2, r / 4);
    const reach = Math.max(width, height) * 2;
    let ring = 0;
    for (let radius = step; radius < reach && !best; radius += step) {
      const count = Math.max(1, Math.round((2 * Math.PI * radius) / step));
      const rot = ring * GOLDEN_ANGLE;
      for (let k = 0; k < count; k++) {
        const angle = (k / count) * 2 * Math.PI + rot;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (!overlaps(x, y, r)) {
          best = { x, y };
          break;
        }
      }
      ring++;
    }
    const pos = best ?? { x: 0, y: 0 };
    placed.push({ id: node.id, x: pos.x, y: pos.y, r });
  }

  // Scale the whole cluster to fit the viewport (with a small margin), then
  // recentre. Only shrink or gently grow so a sparse map fills the space without
  // ballooning a single bubble.
  const minX = Math.min(...placed.map((p) => p.x - p.r));
  const maxX = Math.max(...placed.map((p) => p.x + p.r));
  const minY = Math.min(...placed.map((p) => p.y - p.r));
  const maxY = Math.max(...placed.map((p) => p.y + p.r));
  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const margin = 16;
  const scale = Math.min(
    (width - margin) / contentW,
    (height - margin) / contentH,
    1.4, // don't over-enlarge
  );
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return {
    bubbles: placed.map((p) => ({
      id: p.id,
      x: (p.x - cx) * scale + width / 2,
      y: (p.y - cy) * scale + height / 2,
      r: p.r * scale,
    })),
    width,
    height,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
