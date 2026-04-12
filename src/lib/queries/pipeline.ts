// Phase 3.1 — react-query factory for the artist pipeline board.
//
// Pipeline.tsx currently owns its own `loadPipeline` callback that
// re-fetches after every mutation. That's what this file replaces: one
// cache entry shared across all Pipeline mounts, with mutations
// invalidating via `pipelineKeys.list()`.

import { supabase } from '../supabase'
import type { ArtistPipelineEntry } from '../../types'

export const pipelineKeys = {
  all: ['pipeline'] as const,
  list: () => [...pipelineKeys.all, 'list'] as const,
}

export async function fetchPipelineEntries(): Promise<ArtistPipelineEntry[]> {
  const { data, error } = await supabase
    .from('artist_pipeline')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ArtistPipelineEntry[]
}
