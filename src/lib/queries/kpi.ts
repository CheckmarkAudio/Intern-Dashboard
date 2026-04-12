// Phase 3.1 — react-query factories for the KPI tables.
//
// `member_kpis` = the definitions (one row per tracked metric).
// `member_kpi_entries` = the daily/weekly readings. The list query is
// unbounded today but will get paginated in 3.2 — keeping the factory
// tight here means the page itself never touches `supabase.from('…')`
// directly, so the pagination upgrade is a one-line change.

import { supabase } from '../supabase'
import type { MemberKPI, MemberKPIEntry } from '../../types'

export const kpiKeys = {
  all: ['kpi'] as const,
  definitions: () => [...kpiKeys.all, 'definitions'] as const,
  entries: () => [...kpiKeys.all, 'entries'] as const,
}

export async function fetchKPIDefinitions(): Promise<MemberKPI[]> {
  const { data, error } = await supabase.from('member_kpis').select('*')
  if (error) throw error
  return (data ?? []) as MemberKPI[]
}

export async function fetchKPIEntries(): Promise<MemberKPIEntry[]> {
  const { data, error } = await supabase
    .from('member_kpi_entries')
    .select('*')
    .order('entry_date')
  if (error) throw error
  return (data ?? []) as MemberKPIEntry[]
}
