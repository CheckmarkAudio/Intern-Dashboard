import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { localDateKey } from '../../lib/dates'
import { useToast } from '../../components/Toast'
import type {
  TeamMember, ReportTemplate, TaskAssignment, MemberKPI, MemberKPIEntry,
  WeeklyAdminReview, FlywheelStage,
} from '../../types'
import ConfirmModal from '../../components/ConfirmModal'
import MemberOverviewCard from '../../components/team/MemberOverviewCard'
import WeeklyReviewForm from '../../components/team/WeeklyReviewForm'
import MemberKPIPanel from '../../components/team/MemberKPIPanel'
import AssignTasksTab from '../../components/team/AssignTasksTab'
import { Users, ClipboardList, Star, Target } from 'lucide-react'

function startOfWeek(d = new Date()): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return localDateKey(date)
}

export default function MyTeam() {
  useDocumentTitle('My Team - Checkmark Audio')
  const { profile } = useAuth()
  const { toast } = useToast()
  const [reports, setReports] = useState<TeamMember[]>([])
  const [allMembers, setAllMembers] = useState<TeamMember[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [kpis, setKpis] = useState<MemberKPI[]>([])
  const [kpiEntries, setKpiEntries] = useState<MemberKPIEntry[]>([])
  const [reviews, setReviews] = useState<WeeklyAdminReview[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'overview' | 'assign' | 'review' | 'kpis'>('overview')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  // Delete KPI confirmation
  const [deleteKpiConfirm, setDeleteKpiConfirm] = useState<{ open: boolean; kpiId: string; loading: boolean }>({ open: false, kpiId: '', loading: false })

  const loadData = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const [membersRes, templatesRes, assignRes, kpisRes, entriesRes, reviewsRes] = await Promise.all([
        supabase.from('intern_users').select('*').order('display_name'),
        supabase.from('report_templates').select('*').order('name'),
        supabase.from('task_assignments').select('*'),
        supabase.from('member_kpis').select('*'),
        supabase.from('member_kpi_entries').select('*').order('entry_date'),
        supabase.from('weekly_admin_reviews').select('*').order('week_start', { ascending: false }),
      ])

      const members = (membersRes.data ?? []) as TeamMember[]
      setAllMembers(members)
      setReports(members.filter(m => m.managed_by === profile.id))
      if (templatesRes.data) setTemplates(templatesRes.data as ReportTemplate[])
      if (assignRes.data) setAssignments(assignRes.data as TaskAssignment[])
      if (kpisRes.data) setKpis(kpisRes.data as MemberKPI[])
      if (entriesRes.data) setKpiEntries(entriesRes.data as MemberKPIEntry[])
      if (reviewsRes.data) setReviews(reviewsRes.data as WeeklyAdminReview[])
    } catch (err) {
      console.error(err)
      toast('Failed to load team data', 'error')
    }
    setLoading(false)
  }, [profile, toast])

  useEffect(() => { loadData() }, [loadData])

  // Phase 3.5 — derived lookup maps (O(1) per card after O(N+M) build).
  const membersById = useMemo(() => {
    const map = new Map<string, TeamMember>()
    for (const m of allMembers) map.set(m.id, m)
    return map
  }, [allMembers])

  const kpisByMember = useMemo(() => {
    const map = new Map<string, MemberKPI[]>()
    for (const k of kpis) {
      const arr = map.get(k.intern_id)
      if (arr) arr.push(k)
      else map.set(k.intern_id, [k])
    }
    return map
  }, [kpis])

  const entriesByKpi = useMemo(() => {
    const map = new Map<string, MemberKPIEntry[]>()
    for (const e of kpiEntries) {
      const arr = map.get(e.kpi_id)
      if (arr) arr.push(e)
      else map.set(e.kpi_id, [e])
    }
    return map
  }, [kpiEntries])

  const assignmentsByMember = useMemo(() => {
    const byIntern = new Map<string, TaskAssignment[]>()
    const byPosition = new Map<string, TaskAssignment[]>()
    for (const a of assignments) {
      if (!a.is_active) continue
      if (a.intern_id) {
        const arr = byIntern.get(a.intern_id)
        if (arr) arr.push(a)
        else byIntern.set(a.intern_id, [a])
      } else if (a.position) {
        const arr = byPosition.get(a.position)
        if (arr) arr.push(a)
        else byPosition.set(a.position, [a])
      }
    }
    return { byIntern, byPosition }
  }, [assignments])

  const latestReviewByMember = useMemo(() => {
    const map = new Map<string, WeeklyAdminReview>()
    for (const r of reviews) if (!map.has(r.intern_id)) map.set(r.intern_id, r)
    return map
  }, [reviews])

  const getMemberKpis = (memberId: string) => kpisByMember.get(memberId) ?? []
  const getKpiEntries = (kpiId: string) => entriesByKpi.get(kpiId) ?? []
  const getMemberAssignments = (memberId: string) => {
    const direct = assignmentsByMember.byIntern.get(memberId) ?? []
    const position = membersById.get(memberId)?.position ?? null
    const positional = position
      ? (assignmentsByMember.byPosition.get(position) ?? [])
      : []
    return direct.concat(positional)
  }
  const getLatestReview = (memberId: string) => latestReviewByMember.get(memberId)

  // Review handler — called by WeeklyReviewForm
  const handleSubmitReview = async (data: {
    scores: Record<FlywheelStage, number>
    kpiOnTrack: boolean
    strengths: string
    improvements: string
    actions: string
  }) => {
    if (!profile || !selectedMember) return
    const weekStartVal = startOfWeek()
    const overall = Object.values(data.scores).reduce((a, b) => a + b, 0) / 5

    const { error } = await supabase.from('weekly_admin_reviews').upsert({
      intern_id: selectedMember.id,
      reviewer_id: profile.id,
      week_start: weekStartVal,
      flywheel_scores: data.scores,
      kpi_on_track: data.kpiOnTrack,
      strengths: data.strengths || null,
      improvements: data.improvements || null,
      action_items: data.actions ? data.actions.split('\n').filter(Boolean) : [],
      overall_score: Math.round(overall * 10) / 10,
    }, { onConflict: 'intern_id,week_start' })

    if (error) toast('Failed to submit review', 'error')
    else toast('Weekly review submitted')
    loadData()
  }

  // KPI handlers — called by MemberKPIPanel
  const handleCreateKpi = async (data: { name: string; stage: FlywheelStage; unit: string; target: string }) => {
    if (!profile || !selectedMember) return
    const { error } = await supabase.from('member_kpis').insert({
      intern_id: selectedMember.id,
      name: data.name,
      flywheel_stage: data.stage,
      unit: data.unit,
      target_value: data.target ? parseFloat(data.target) : null,
      created_by: profile.id,
    })
    if (error) toast('Failed to create KPI', 'error')
    else toast('KPI created')
    loadData()
  }

  const handleDeleteKpi = async () => {
    setDeleteKpiConfirm(s => ({ ...s, loading: true }))
    const { error } = await supabase.from('member_kpis').delete().eq('id', deleteKpiConfirm.kpiId)
    if (error) toast('Failed to delete KPI', 'error')
    else toast('KPI deleted')
    setDeleteKpiConfirm({ open: false, kpiId: '', loading: false })
    loadData()
  }

  // Assignment handlers — called by AssignTasksTab
  const handleAssignTemplate = async (templateId: string, memberIds: Set<string>) => {
    if (!profile) return
    const assignedBy = profile.id
    const inserts = Array.from(memberIds)
      .filter(id => !assignments.some(a => a.template_id === templateId && a.intern_id === id && a.is_active))
      .map(id => ({ template_id: templateId, intern_id: id, position: null, is_active: true, assigned_by: assignedBy }))

    if (inserts.length > 0) {
      const { error } = await supabase.from('task_assignments').insert(inserts)
      if (error) toast('Failed to assign', 'error')
      else toast(`Assigned to ${inserts.length} member${inserts.length > 1 ? 's' : ''}`)
    } else {
      toast('Already assigned', 'error')
    }
    loadData()
  }

  const handleRemoveAssignment = (id: string) => {
    supabase.from('task_assignments').delete().eq('id', id).then(({ error }) => {
      if (error) { toast('Failed to remove assignment', 'error'); return }
      toast('Assignment removed')
      loadData()
    })
  }

  const selectMemberForReview = (member: TeamMember) => {
    setSelectedMember(member)
    setActiveTab('review')
  }

  // Build initial values for the review form based on current selected member
  const reviewInitialValues = useMemo(() => {
    if (!selectedMember) return undefined
    const existing = getLatestReview(selectedMember.id)
    if (existing && existing.week_start === startOfWeek()) {
      return {
        scores: existing.flywheel_scores as Record<FlywheelStage, number>,
        kpiOnTrack: existing.kpi_on_track ?? true,
        strengths: existing.strengths ?? '',
        improvements: existing.improvements ?? '',
        actions: Array.isArray(existing.action_items) ? existing.action_items.join('\n') : '',
      }
    }
    return {
      scores: { deliver: 3, capture: 3, share: 3, attract: 3, book: 3 } as Record<FlywheelStage, number>,
      kpiOnTrack: true,
      strengths: '',
      improvements: '',
      actions: '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMember?.id, latestReviewByMember])

  if (loading) return (
    <div role="status" aria-live="polite" className="flex items-center justify-center h-64">
      <div aria-hidden="true" className="animate-spin rounded-full h-8 w-8 border-2 border-gold/20 border-t-gold" />
      <span className="sr-only">Loading…</span>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Admin</p>
        <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
          <Users size={24} className="text-gold" aria-hidden="true" /> My Team
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Manage your direct reports, assign tasks, track KPIs, and write manager reviews.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <Users size={32} className="mx-auto mb-3 text-text-light opacity-30" aria-hidden="true" />
          <p className="text-text-muted">No team members are reporting to you yet.</p>
          <p className="text-xs text-text-light mt-1">Go to Team Manager and set "Reports To" for members you manage.</p>
        </div>
      ) : (
        <>
          {/* Tab navigation */}
          <div role="tablist" className="flex items-center gap-1 bg-surface rounded-xl border border-border p-1">
            {([
              { key: 'overview' as const, label: 'Overview', icon: Users },
              { key: 'assign' as const, label: 'Assign Tasks', icon: ClipboardList },
              { key: 'review' as const, label: 'Manager Review', icon: Star },
              { key: 'kpis' as const, label: 'KPIs', icon: Target },
            ]).map(tab => (
              <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-gold/10 text-gold' : 'text-text-muted hover:text-text hover:bg-surface-hover'
                }`}>
                <tab.icon size={15} aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(member => (
                <MemberOverviewCard
                  key={member.id}
                  member={member}
                  memberKpis={getMemberKpis(member.id)}
                  getKpiEntries={getKpiEntries}
                  assignmentCount={getMemberAssignments(member.id).length}
                  latestReview={getLatestReview(member.id)}
                  onReview={selectMemberForReview}
                  onKpis={m => { setSelectedMember(m); setActiveTab('kpis') }}
                />
              ))}
            </div>
          )}

          {/* ASSIGN TASKS TAB */}
          {activeTab === 'assign' && (
            <AssignTasksTab
              reports={reports}
              templates={templates}
              assignments={assignments}
              getMemberAssignments={getMemberAssignments}
              onAssign={handleAssignTemplate}
              onRemoveAssignment={handleRemoveAssignment}
            />
          )}

          {/* MANAGER REVIEW TAB */}
          {activeTab === 'review' && (
            <WeeklyReviewForm
              reports={reports}
              selectedMember={selectedMember}
              reviews={reviews}
              weekStart={startOfWeek()}
              onSelectMember={selectMemberForReview}
              onSubmitReview={handleSubmitReview}
              initialValues={reviewInitialValues}
            />
          )}

          {/* KPI METRICS TAB */}
          {activeTab === 'kpis' && (
            <MemberKPIPanel
              reports={reports}
              selectedMember={selectedMember}
              onSelectMember={setSelectedMember}
              getMemberKpis={getMemberKpis}
              getKpiEntries={getKpiEntries}
              onCreateKpi={handleCreateKpi}
              onDeleteKpi={kpiId => setDeleteKpiConfirm({ open: true, kpiId, loading: false })}
            />
          )}
        </>
      )}

      <ConfirmModal
        open={deleteKpiConfirm.open}
        title="Delete KPI"
        message="Are you sure you want to delete this KPI and all its entries? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteKpiConfirm.loading}
        onConfirm={handleDeleteKpi}
        onCancel={() => setDeleteKpiConfirm({ open: false, kpiId: '', loading: false })}
      />
    </div>
  )
}
