import type { DetectMatch, Detector, DetectorContext } from './types';

export async function detectAppFirmware(
  ctx: DetectorContext,
  detectors: Detector[],
  opts?: { totalBudgetMs?: number; activeBudgetMs?: number }
): Promise<DetectMatch[]> {
  const totalBudgetMs = opts?.totalBudgetMs ?? 1200;
  const activeBudgetMs = opts?.activeBudgetMs ?? 800;

  const t0 = ctx.now();
  let activeSpent = 0;

  const sorted = [...detectors].sort((a, b) => b.priority - a.priority);
  const matches: DetectMatch[] = [];

  // Pass 1: passive
  for (const d of sorted) {
    if (ctx.now() - t0 > totalBudgetMs) break;
    if (!d.passive) continue;
    const m = d.passive(ctx);
    if (m) matches.push(m);
  }

  // If we already have a high-confidence hit, we can stop early
  if (matches.some(m => m.confidence === "high")) return dedupe(matches);

  // Pass 2: active probes (budgeted)
  for (const d of sorted) {
    if (ctx.now() - t0 > totalBudgetMs) break;
    if (!d.active) continue;
    if (activeSpent >= activeBudgetMs) break;

    const before = ctx.now();
    const m = await d.active(ctx);
    activeSpent += (ctx.now() - before);

    if (m) matches.push(m);

    // Optional: stop if strong hit found
    if (matches.some(x => x.confidence === "high")) break;
  }

  return dedupe(matches);
}

function dedupe(matches: DetectMatch[]): DetectMatch[] {
  const map = new Map<string, DetectMatch>();
  for (const m of matches) {
    const existing = map.get(m.id);
    if (!existing) map.set(m.id, m);
    else {
      // keep higher confidence
      const rank = (c: DetectMatch["confidence"]) => c === "high" ? 3 : c === "med" ? 2 : 1;
      if (rank(m.confidence) > rank(existing.confidence)) map.set(m.id, m);
    }
  }
  return [...map.values()];
}
