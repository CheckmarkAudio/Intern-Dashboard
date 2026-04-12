// Phase 6.3.5 — Full member configuration surface inside the Hub's
// Tasks tab. Lets an admin pick templates, client projects, education
// students, and artist-pipeline entries for a team member so the member's
// first login lands on a populated dashboard instead of an empty one.
//
// KPI assignment is intentionally NOT here — KPIs are measurements
// (kpi_entries) not assignments. See queries/assignments.ts for the
// commentary. If KPI *definitions* become owned-by-member, extend this
// component with a fifth section.
//
// The four sections follow the same visual pattern (header + assigned
// list + "Add…" button that opens a picker modal) but use different
// query helpers because templates live on a join table (task_assignments)
// while projects/students/artists use a single `assigned_to uuid` column.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  FolderKanban,
  GraduationCap,
  GitBranch,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react'
import { Button, Card, Modal, Badge, EmptyState, type BadgeVariant } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../Toast'
import { loadActiveTemplates } from '../../lib/queries/templates'
import {
  loadMemberTemplateAssignments,
  assignTemplatesDirect,
  removeTemplateAssignment,
  loadProjectsForMember,
  loadAssignableProjects,
  setProjectAssignee,
  loadStudentsForMember,
  loadAssignableStudents,
  setStudentAssignee,
  loadArtistsForMember,
  loadAssignableArtists,
  setArtistAssignee,
  type MemberTemplateAssignment,
} from '../../lib/queries/assignments'
import type {
  TeamMember,
  ReportTemplate,
  Project,
  EducationStudent,
  ArtistPipelineEntry,
} from '../../types'

interface MemberAssignmentsPanelProps {
  member: TeamMember
}

/**
 * Renders four stacked assignment sections for the selected team
 * member. Each section is self-contained: it fetches its own data,
 * tracks its own loading state, and shows its own picker modal. They
 * share the same visual language via `<AssignmentCard>`.
 *
 * On mount (and whenever `member.id` changes) every section refetches.
 * We keep a `refreshKey` counter per section so "close the picker and
 * reload the list" is a one-liner without tangled state.
 */
export default function MemberAssignmentsPanel({ member }: MemberAssignmentsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <UserCheck size={14} className="text-gold" aria-hidden="true" />
        <h3 className="text-sm font-semibold">
          Assignments for {member.display_name}
        </h3>
      </div>
      <p className="text-xs text-text-muted -mt-2">
        Configure this member's task templates and workload. Changes take effect immediately.
      </p>

      <TemplatesSection member={member} frequency="daily" />
      <TemplatesSection member={member} frequency="weekly" />
      <ProjectsSection member={member} />
      <StudentsSection member={member} />
      <ArtistsSection member={member} />
    </div>
  )
}

// ─── Shared visual shell ─────────────────────────────────────────────

function AssignmentCard({
  icon: Icon,
  title,
  subtitle,
  count,
  onAdd,
  addLabel,
  loading,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  title: string
  subtitle: string
  count: number
  onAdd: () => void
  addLabel: string
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <Card flush>
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} className="text-text-muted shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">{title}</p>
              <Badge variant="info" size="sm">
                {count}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAdd}
          iconLeft={<Plus size={12} aria-hidden="true" />}
        >
          {addLabel}
        </Button>
      </div>
      <div className="px-5 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-6" role="status" aria-live="polite">
            <Loader2 size={16} className="animate-spin text-text-light" aria-hidden="true" />
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}

function RowActionButton({
  onClick,
  label,
  disabled,
  busy,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
  busy?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="shrink-0 p-1.5 rounded-md text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none"
      aria-label={label}
      title={label}
    >
      {busy ? (
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 size={12} aria-hidden="true" />
      )}
    </button>
  )
}

// ─── Templates section ───────────────────────────────────────────────

function TemplatesSection({
  member,
  frequency,
}: {
  member: TeamMember
  frequency: 'daily' | 'weekly'
}) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<MemberTemplateAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const rows = await loadMemberTemplateAssignments(member.id, member.position ?? null)
    const filtered = rows.filter((r) => r.template.type === frequency)
    setAssignments(filtered)
    setLoading(false)
  }, [member.id, member.position, frequency])

  useEffect(() => { reload() }, [reload])

  const handleRemove = async (assignment: MemberTemplateAssignment) => {
    // Position-scoped rows affect every member in the position.
    // Require explicit confirmation so admins don't remove a template
    // from the entire team by accident.
    if (assignment.position) {
      const ok = window.confirm(
        `"${assignment.template.name}" is assigned to everyone with position "${assignment.position}". Removing it will unassign the template from every member in that position. Continue?`,
      )
      if (!ok) return
    }
    setRemovingId(assignment.assignment_id)
    try {
      await removeTemplateAssignment(assignment.assignment_id)
      toast(`Removed "${assignment.template.name}"`, 'success')
      await reload()
    } catch (err) {
      toast((err as Error).message || 'Failed to remove template', 'error')
    } finally {
      setRemovingId(null)
    }
  }

  const handleAssign = async (templateIds: string[]) => {
    try {
      await assignTemplatesDirect(member.id, templateIds, profile?.id)
      toast(
        templateIds.length === 1 ? 'Template assigned' : `${templateIds.length} templates assigned`,
        'success',
      )
      setPickerOpen(false)
      await reload()
    } catch (err) {
      toast((err as Error).message || 'Failed to assign templates', 'error')
    }
  }

  const assignedIds = useMemo(() => new Set(assignments.map((a) => a.template.id)), [assignments])

  return (
    <>
      <AssignmentCard
        icon={ClipboardList}
        title={`${frequency === 'daily' ? 'Daily' : 'Weekly'} templates`}
        subtitle={
          frequency === 'daily'
            ? 'Recurring tasks that generate every morning.'
            : 'Recurring tasks that generate at the start of each week.'
        }
        count={assignments.length}
        onAdd={() => setPickerOpen(true)}
        addLabel="Assign template"
        loading={loading}
      >
        {assignments.length === 0 ? (
          <p className="text-xs text-text-muted py-2">
            No {frequency} templates assigned yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {assignments.map((a) => (
              <li key={a.assignment_id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{a.template.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.position ? (
                      <Badge variant="warning" size="sm" icon={<AlertTriangle size={9} aria-hidden />}>
                        Position-scoped · {a.position}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Direct
                      </Badge>
                    )}
                    <span className="text-[11px] text-text-light">
                      {a.template.fields?.length ?? 0} items
                    </span>
                  </div>
                </div>
                <RowActionButton
                  onClick={() => handleRemove(a)}
                  label={`Remove ${a.template.name}`}
                  busy={removingId === a.assignment_id}
                />
              </li>
            ))}
          </ul>
        )}
      </AssignmentCard>

      {pickerOpen && (
        <TemplatePicker
          frequency={frequency}
          alreadyAssignedIds={assignedIds}
          onClose={() => setPickerOpen(false)}
          onConfirm={handleAssign}
        />
      )}
    </>
  )
}

function TemplatePicker({
  frequency,
  alreadyAssignedIds,
  onClose,
  onConfirm,
}: {
  frequency: 'daily' | 'weekly'
  alreadyAssignedIds: Set<string>
  onClose: () => void
  onConfirm: (ids: string[]) => Promise<void>
}) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const list = await loadActiveTemplates(frequency)
      if (!cancelled) {
        setTemplates(list)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [frequency])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = async () => {
    if (selected.size === 0) return
    setSubmitting(true)
    await onConfirm(Array.from(selected))
    setSubmitting(false)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Assign ${frequency} templates`}
      description="Pick one or more templates. Position-scoped defaults are not shown here — use the Templates page to edit those."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={submitting}
            disabled={selected.size === 0}
          >
            Assign {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-10" role="status" aria-live="polite">
          <Loader2 size={18} className="animate-spin text-gold" aria-hidden="true" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={`No ${frequency} templates yet`}
          description="Create one from the Templates page first, then come back to assign it."
        />
      ) : (
        <ul className="space-y-1 max-h-80 overflow-y-auto">
          {templates.map((t) => {
            const already = alreadyAssignedIds.has(t.id)
            const isSelected = selected.has(t.id)
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => { if (!already) toggle(t.id) }}
                  disabled={already}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors focus-ring ${
                    already
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gold/10 border border-gold/30'
                      : 'hover:bg-surface-hover border border-transparent'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-gold border-gold' : 'border-border-light'
                    }`}
                    aria-hidden
                  >
                    {isSelected && <span className="text-[10px] text-black font-bold">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-[11px] text-text-muted">
                      {t.fields?.length ?? 0} items
                      {t.is_default && ' · default'}
                      {already && ' · already assigned'}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}

// ─── Generic "flip assigned_to" section ──────────────────────────────
// Projects, students, and artists all share the same UX: list rows
// currently assigned to this member, plus a picker that flips the
// `assigned_to` column on a chosen row.

interface AssignableRow {
  id: string
  title: string
  subtitle: string | null
  badge: { label: string; variant: BadgeVariant } | null
  currentAssignee: string | null
}

function GenericAssignmentSection<TRow>({
  member,
  icon,
  title,
  subtitle,
  addLabel,
  loadMine,
  loadAll,
  setAssignee,
  mapToRow,
}: {
  member: TeamMember
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  title: string
  subtitle: string
  addLabel: string
  loadMine: (memberId: string) => Promise<TRow[]>
  loadAll: () => Promise<TRow[]>
  setAssignee: (id: string, memberId: string | null) => Promise<void>
  mapToRow: (row: TRow) => AssignableRow
}) {
  const { toast } = useToast()
  const [rows, setRows] = useState<TRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await loadMine(member.id)
    setRows(data)
    setLoading(false)
  }, [member.id, loadMine])

  useEffect(() => { reload() }, [reload])

  const handleUnassign = async (row: AssignableRow) => {
    setBusyId(row.id)
    try {
      await setAssignee(row.id, null)
      toast(`Unassigned "${row.title}"`, 'success')
      await reload()
    } catch (err) {
      toast((err as Error).message || 'Failed to unassign', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleAssign = async (id: string) => {
    try {
      await setAssignee(id, member.id)
      toast('Assigned', 'success')
      setPickerOpen(false)
      await reload()
    } catch (err) {
      toast((err as Error).message || 'Failed to assign', 'error')
    }
  }

  const mapped = rows.map(mapToRow)

  return (
    <>
      <AssignmentCard
        icon={icon}
        title={title}
        subtitle={subtitle}
        count={mapped.length}
        onAdd={() => setPickerOpen(true)}
        addLabel={addLabel}
        loading={loading}
      >
        {mapped.length === 0 ? (
          <p className="text-xs text-text-muted py-2">None assigned yet.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {mapped.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.badge && (
                      <Badge variant={r.badge.variant} size="sm">
                        {r.badge.label}
                      </Badge>
                    )}
                    {r.subtitle && (
                      <span className="text-[11px] text-text-light truncate">{r.subtitle}</span>
                    )}
                  </div>
                </div>
                <RowActionButton
                  onClick={() => handleUnassign(r)}
                  label={`Unassign ${r.title}`}
                  busy={busyId === r.id}
                />
              </li>
            ))}
          </ul>
        )}
      </AssignmentCard>

      {pickerOpen && (
        <AssigneePicker
          title={title}
          member={member}
          loadAll={loadAll}
          mapToRow={mapToRow}
          onClose={() => setPickerOpen(false)}
          onPick={handleAssign}
        />
      )}
    </>
  )
}

function AssigneePicker<TRow>({
  title,
  member,
  loadAll,
  mapToRow,
  onClose,
  onPick,
}: {
  title: string
  member: TeamMember
  loadAll: () => Promise<TRow[]>
  mapToRow: (row: TRow) => AssignableRow
  onClose: () => void
  onPick: (id: string) => Promise<void>
}) {
  const [rows, setRows] = useState<TRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pickingId, setPickingId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const list = await loadAll()
      if (!cancelled) {
        setRows(list)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [loadAll])

  const mapped = rows.map(mapToRow)
  const filtered = mapped.filter((r) =>
    filter.trim().length === 0
      ? true
      : r.title.toLowerCase().includes(filter.toLowerCase()) ||
        (r.subtitle ?? '').toLowerCase().includes(filter.toLowerCase()),
  )

  const handlePick = async (id: string) => {
    setPickingId(id)
    await onPick(id)
    setPickingId(null)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Assign ${title.toLowerCase()} to ${member.display_name}`}
      description="Rows already assigned to someone else show a warning — picking them will reassign."
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search…"
          className="w-full px-3 py-2 text-sm rounded-lg bg-surface-alt border border-border focus:outline-none focus:border-gold focus-ring"
        />
        {loading ? (
          <div className="flex items-center justify-center py-10" role="status" aria-live="polite">
            <Loader2 size={18} className="animate-spin text-gold" aria-hidden="true" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Nothing to assign"
            description={
              mapped.length === 0
                ? 'Create a row first, then come back here to assign it.'
                : 'No matches for your search.'
            }
          />
        ) : (
          <ul className="space-y-1 max-h-80 overflow-y-auto">
            {filtered.map((r) => {
              const isMine = r.currentAssignee === member.id
              const isOthers = r.currentAssignee !== null && !isMine
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => { if (!isMine) handlePick(r.id) }}
                    disabled={isMine || pickingId !== null}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors focus-ring ${
                      isMine
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-surface-hover border border-transparent hover:border-border-light'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {r.badge && (
                          <Badge variant={r.badge.variant} size="sm">
                            {r.badge.label}
                          </Badge>
                        )}
                        {isMine && (
                          <Badge variant="success" size="sm">
                            Already assigned
                          </Badge>
                        )}
                        {isOthers && (
                          <Badge
                            variant="warning"
                            size="sm"
                            icon={<AlertTriangle size={9} aria-hidden />}
                          >
                            Reassign from another member
                          </Badge>
                        )}
                        {r.subtitle && (
                          <span className="text-[11px] text-text-light truncate">{r.subtitle}</span>
                        )}
                      </div>
                    </div>
                    {pickingId === r.id && (
                      <Loader2 size={14} className="animate-spin text-text-light" aria-hidden="true" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}

// ─── Concrete sections (projects / students / artists) ──────────────

function ProjectsSection({ member }: { member: TeamMember }) {
  const loadMine = useCallback((id: string) => loadProjectsForMember(id), [])
  const loadAll = useCallback(() => loadAssignableProjects(true), [])
  const mapToRow = useCallback(
    (p: Project): AssignableRow => ({
      id: p.id,
      title: p.name,
      subtitle: p.client_name ?? null,
      badge: {
        label: p.status,
        variant:
          p.status === 'active' ? 'success'
          : p.status === 'paused' ? 'warning'
          : p.status === 'completed' ? 'info'
          : 'neutral',
      },
      currentAssignee: p.assigned_to,
    }),
    [],
  )
  return (
    <GenericAssignmentSection
      member={member}
      icon={FolderKanban}
      title="Client projects"
      subtitle="Active and paused projects this member owns."
      addLabel="Assign project"
      loadMine={loadMine}
      loadAll={loadAll}
      setAssignee={setProjectAssignee}
      mapToRow={mapToRow}
    />
  )
}

function StudentsSection({ member }: { member: TeamMember }) {
  const loadMine = useCallback((id: string) => loadStudentsForMember(id), [])
  const loadAll = useCallback(() => loadAssignableStudents(true), [])
  const mapToRow = useCallback(
    (s: EducationStudent): AssignableRow => ({
      id: s.id,
      title: s.student_name,
      subtitle: [s.instrument, s.level].filter(Boolean).join(' · ') || null,
      badge: {
        label: s.status,
        variant:
          s.status === 'active' ? 'success'
          : s.status === 'paused' ? 'warning'
          : 'info',
      },
      currentAssignee: s.assigned_to,
    }),
    [],
  )
  return (
    <GenericAssignmentSection
      member={member}
      icon={GraduationCap}
      title="Education students"
      subtitle="Private-lesson students this member teaches."
      addLabel="Assign student"
      loadMine={loadMine}
      loadAll={loadAll}
      setAssignee={setStudentAssignee}
      mapToRow={mapToRow}
    />
  )
}

function ArtistsSection({ member }: { member: TeamMember }) {
  const loadMine = useCallback((id: string) => loadArtistsForMember(id), [])
  const loadAll = useCallback(() => loadAssignableArtists(true), [])
  const mapToRow = useCallback(
    (a: ArtistPipelineEntry): AssignableRow => ({
      id: a.id,
      title: a.artist_name,
      subtitle: a.contact_email ?? a.contact_phone ?? null,
      badge: {
        label: a.stage,
        variant:
          a.stage === 'inquiry' ? 'info'
          : a.stage === 'onboarding' ? 'warning'
          : a.stage === 'active' ? 'success'
          : a.stage === 'release_support' ? 'stage-share'
          : 'neutral',
      },
      currentAssignee: a.assigned_to,
    }),
    [],
  )
  return (
    <GenericAssignmentSection
      member={member}
      icon={GitBranch}
      title="Pipeline artists"
      subtitle="Artists this member is developing."
      addLabel="Assign artist"
      loadMine={loadMine}
      loadAll={loadAll}
      setAssignee={setArtistAssignee}
      mapToRow={mapToRow}
    />
  )
}
