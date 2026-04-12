// Phase 3.4 — Recharts downsampling helper.
//
// Dashboard / KPIDashboard / MyTeam / BusinessHealth all feed Recharts
// raw daily points. That's fine for a 30-day window, but the queries
// aren't bounded — a 90- or 180-day range starts to render janky. This
// helper buckets points into a maximum number of slots (default 60)
// using a simple mean-per-bucket reduction, so charts stay crisp on any
// range without changing the query.
//
// Guidelines for callers:
//   * Pass pre-sorted points (ascending by date).
//   * Pick a `maxPoints` matching the chart width, not the raw count.
//     60 is a good default for a full-width line chart at most laptop
//     widths; 90 if you want the extra detail.
//   * Wrap the call in `useMemo` so buckets aren't recomputed on every
//     render.
//
// The helper is type-generic: the point type is whatever the chart
// consumes, and you supply a `getValue` mapper for the numeric field
// being averaged. Non-numeric fields (labels, dates) are sampled from
// the last point in each bucket so the x-axis line stays readable.

export interface DownsampleOptions<T> {
  /** Numeric field(s) to average per bucket. */
  numericKeys: Array<keyof T>
  /** Max number of resulting points. Defaults to 60. */
  maxPoints?: number
}

/**
 * Downsample a time-series array to at most `maxPoints` entries by
 * mean-averaging numeric fields within equally-sized buckets. Non-
 * numeric fields are taken from the **last** point in each bucket,
 * which keeps the x-axis label anchored to a real date.
 *
 * If the input is already short enough, it's returned unchanged (cheap
 * no-op).
 */
export function downsample<T extends Record<string, unknown>>(
  points: T[],
  { numericKeys, maxPoints = 60 }: DownsampleOptions<T>,
): T[] {
  if (points.length <= maxPoints) return points

  const bucketCount = maxPoints
  const bucketSize = points.length / bucketCount
  const result: T[] = []

  for (let i = 0; i < bucketCount; i++) {
    const start = Math.floor(i * bucketSize)
    const end = Math.floor((i + 1) * bucketSize)
    const slice = points.slice(start, end)
    if (slice.length === 0) continue

    // Non-numeric fields: take them from the last point in the bucket
    // so the date label matches the right edge of the bucket.
    const last = slice[slice.length - 1]!
    const merged: Record<string, unknown> = { ...last }

    // Numeric fields: mean-average across the bucket.
    for (const key of numericKeys) {
      let sum = 0
      let count = 0
      for (const pt of slice) {
        const v = pt[key]
        if (typeof v === 'number' && Number.isFinite(v)) {
          sum += v
          count += 1
        }
      }
      merged[key as string] = count > 0 ? sum / count : 0
    }

    result.push(merged as T)
  }

  return result
}

/**
 * Convenience wrapper for the common case: a single numeric series.
 * Equivalent to `downsample(points, { numericKeys: [key], maxPoints })`.
 */
export function downsampleSingle<T extends Record<string, unknown>>(
  points: T[],
  key: keyof T,
  maxPoints = 60,
): T[] {
  return downsample(points, { numericKeys: [key], maxPoints })
}
