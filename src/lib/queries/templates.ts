// Phase 6.3 — Shared template / assignment queries.
//
// Both `pages/admin/Templates.tsx` and the new multi-step Add Member
// flow in `pages/admin/TeamManager.tsx` need to fetch report templates
// by type and to insert task_assignments rows. Centralizing the queries
// here keeps the two call sites in sync — and gives us a single place
// to add caching later (Phase 3 react-query work).

import { supabase } from '../supabase'
import type { ReportTemplate } from '../../types'

/** Fetch all templates of a given frequency, newest first. */
export async function loadActiveTemplates(
  type: ReportTemplate['type'],
): Promise<ReportTemplate[]> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[queries/templates] loadActiveTemplates failed:', error)
    return []
  }
  return (data ?? []) as ReportTemplate[]
}

/**
 * Pull the templates that are already pre-assigned to a position via
 * `task_assignments`. Used to pre-check defaults in the Add Member
 * step 2 picker so admins don't double-assign.
 */
export async function loadDefaultTemplateIdsForPosition(
  position: string,
  type: ReportTemplate['type'],
): Promise<string[]> {
  const { data, error } = await supabase
    .from('task_assignments')
    .select('template_id, report_templates!inner(type)')
    .eq('position', position)
    .eq('is_active', true)
    .eq('report_templates.type', type)

  if (error) {
    console.error('[queries/templates] loadDefaultTemplateIdsForPosition failed:', error)
    return []
  }
  // The supabase-js typing for nested selects is awkward; we know the
  // shape because we wrote the query.
  return (data ?? []).map((row) => (row as { template_id: string }).template_id)
}

/**
 * Insert one task_assignments row per template id, scoped to a single
 * member. Used after the Edge Function returns the new member's id.
 *
 * Returns the count of rows successfully inserted, or throws on the
 * first failure so the caller can show a toast.
 */
export async function assignTemplatesToMember(
  memberId: string,
  templateIds: string[],
  assignedBy: string | null | undefined,
): Promise<number> {
  if (templateIds.length === 0) return 0

  const inserts = templateIds.map((template_id) => ({
    template_id,
    intern_id: memberId,
    position: null as string | null,
    is_active: true,
    assigned_by: assignedBy ?? null,
  }))

  const { error } = await supabase.from('task_assignments').insert(inserts)
  if (error) {
    console.error('[queries/templates] assignTemplatesToMember failed:', error)
    throw new Error(error.message)
  }
  return inserts.length
}

/**
 * Generate today's checklist instance for a member by calling the
 * existing Postgres RPC `intern_generate_checklist`. Non-fatal — the
 * caller catches and toasts a warning if it fails.
 */
export async function generateTodayChecklist(memberId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase.rpc('intern_generate_checklist', {
    p_intern_id: memberId,
    p_date: today,
    p_frequency: 'daily',
  })
  if (error) {
    console.error('[queries/templates] generateTodayChecklist failed:', error)
    throw new Error(error.message)
  }
}
