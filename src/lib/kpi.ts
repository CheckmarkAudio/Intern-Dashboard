// Phase 4.1 — centralized KPI helpers.
//
// `getKPITrend` used to be copy-pasted in three pages with slightly
// different window sizes: Dashboard + KPIDashboard used the last 5
// points, MyTeam's card view used the last 3 (tighter so manager cards
// reflect immediate momentum). That's a real semantic difference, so
// this version takes an optional `window` arg; callers pass the window
// that matches their UX rather than maintaining three copies of the
// same 10 lines.

import type { MemberKPIEntry } from '../types'

export type KPITrend = 'up' | 'down' | 'flat'

/**
 * Returns whether the most recent `window` entries are trending up,
 * down, or flat. Entries are sorted by `entry_date` ascending before
 * the window is taken, so callers don't have to pre-sort. With < 2
 * entries there isn't enough history and the result is `'flat'`.
 */
export function getKPITrend(entries: MemberKPIEntry[], window = 5): KPITrend {
  if (entries.length < 2) return 'flat'
  const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  const recent = sorted.slice(-window)
  const first = recent[0]
  const last = recent[recent.length - 1]
  if (!first || !last) return 'flat'
  if (last.value > first.value) return 'up'
  if (last.value < first.value) return 'down'
  return 'flat'
}
