// Small shared date helpers. Keep this file focused on calendar-key
// / comparison math — time-of-day math lives in `src/lib/time.ts`.

/** Format a Date as a local `YYYY-MM-DD` key. Defaults to today. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * True when `nextFollowup` is strictly before today's local date.
 * Accepts either a full ISO timestamp or a `YYYY-MM-DD` string; null
 * means "no follow-up scheduled" and is never overdue.
 */
export function isFollowupOverdue(nextFollowup: string | null): boolean {
  if (!nextFollowup) return false
  const d = nextFollowup.slice(0, 10)
  return d < localDateKey()
}
