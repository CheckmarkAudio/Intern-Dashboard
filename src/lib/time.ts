// Shared time-grid math for calendar and session views.
//
// Originally inlined in src/pages/Sessions.tsx; extracted in Phase 5.5
// so the new CalendarWeek component can reuse the same positioning
// calculations without duplicating the logic.

/** Default day window for the time grid: 8:00 AM through 9:00 PM. */
export const DAY_START_MIN = 8 * 60
export const DAY_END_MIN   = 21 * 60
export const DAY_RANGE_MIN = DAY_END_MIN - DAY_START_MIN

export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Convert "HH:MM" or "HH:MM:SS" → minutes-since-midnight. Safe on missing parts. */
export function parseTimeToMinutes(t: string | null | undefined): number {
  if (!t) return 0
  const parts = t.split(':').map(Number)
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0
  return h * 60 + m
}

/** Format "HH:MM" or "HH:MM:SS" → "9:00 AM" / "2:30 PM". */
export function formatTimeDisplay(t: string | null | undefined): string {
  if (!t) return ''
  const minutes = parseTimeToMinutes(t)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${pad2(m)} ${ampm}`
}

/**
 * Compute the vertical position of a time block inside a fixed-height
 * day column. Returns percentages so the caller can size the container
 * however it wants (Sessions uses a 640px column; CalendarWeek uses the
 * same pattern scaled to its row height).
 *
 * Clamps out-of-range events to the edge of the visible window and
 * enforces a minimum height so tiny 5-minute blocks stay clickable.
 */
export function blockLayout(
  start: string | null | undefined,
  end: string | null | undefined,
  rangeStart: number = DAY_START_MIN,
  rangeEnd: number = DAY_END_MIN,
): { topPct: number; heightPct: number } {
  const range = rangeEnd - rangeStart
  let sm = parseTimeToMinutes(start)
  let em = parseTimeToMinutes(end)
  if (em <= sm) em = sm + 30
  sm = Math.max(rangeStart, Math.min(sm, rangeEnd))
  em = Math.max(sm + 15, Math.min(em, rangeEnd + 60))
  const top = ((sm - rangeStart) / range) * 100
  const height = ((em - sm) / range) * 100
  return {
    topPct: Math.max(0, Math.min(top, 100)),
    heightPct: Math.max(3, Math.min(height, 100 - top)),
  }
}

// ─── Day-of-week / week helpers ──────────────────────────────────────
// Used by the week calendar and any Mon-Fri grouping logic. Week starts
// on Monday (ISO weekday 1) because that's how studio weeks work here.

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date)
  const jsDay = d.getDay() // Sunday=0..Saturday=6
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}
