import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Loader2, FileText, AlertTriangle, CheckSquare, BarChart3 } from 'lucide-react'
import type { TeamMember, ReportTemplate, TaskAssignment } from '../../types'

const TEMPLATE_TYPE_ICONS: Record<string, typeof FileText> = {
  daily: FileText,
  weekly: BarChart3,
  checklist: CheckSquare,
  must_do: AlertTriangle,
}

export interface AssignTasksTabProps {
  reports: TeamMember[]
  templates: ReportTemplate[]
  assignments: TaskAssignment[]
  getMemberAssignments: (memberId: string) => TaskAssignment[]
  onAssign: (templateId: string, memberIds: Set<string>) => Promise<void>
  onRemoveAssignment: (id: string) => void
}

export default function AssignTasksTab({
  reports, templates, assignments, getMemberAssignments, onAssign, onRemoveAssignment,
}: AssignTasksTabProps) {
  const [assignTemplateId, setAssignTemplateId] = useState('')
  const [assignMemberIds, setAssignMemberIds] = useState<Set<string>>(new Set())
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  const handleAssignTemplate = async () => {
    if (!assignTemplateId || assignMemberIds.size === 0) return
    setAssignSubmitting(true)
    await onAssign(assignTemplateId, assignMemberIds)
    setAssignSubmitting(false)
    setAssignTemplateId('')
    setAssignMemberIds(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Quick assign form */}
      <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Assign Tasks to Members</h2>
            <p className="text-xs text-text-muted mt-0.5">Choose a task template and assign it to one or more direct reports</p>
          </div>
          <Link to="/admin/templates" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-gold hover:bg-gold/10 transition-colors">
            <ClipboardList size={13} aria-hidden="true" /> Manage Templates
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="myteam-assign-template" className="block text-sm font-medium mb-1.5 text-text-muted">Task Template</label>
            <select id="myteam-assign-template" value={assignTemplateId} onChange={e => setAssignTemplateId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm">
              <option value="">Select a template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>[{t.type.replace('_', '-')}] {t.name}</option>
              ))}
            </select>
            {assignTemplateId && (() => {
              const tpl = templates.find(t => t.id === assignTemplateId)
              if (!tpl) return null
              return (
                <div className="mt-2 p-3 rounded-lg bg-surface-alt/60 border border-border/50">
                  <p className="text-xs font-medium text-text-muted mb-1">{tpl.fields.length} fields</p>
                  <div className="space-y-0.5">
                    {tpl.fields.slice(0, 4).map(f => (
                      <p key={f.id} className="text-xs text-text-light truncate flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.is_critical ? 'bg-red-400' : 'bg-text-light'}`} />
                        {f.label}
                      </p>
                    ))}
                    {tpl.fields.length > 4 && (
                      <p className="text-[10px] text-text-light">+{tpl.fields.length - 4} more</p>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
          <div>
            <p id="myteam-assign-members-heading" className="block text-sm font-medium mb-1.5 text-text-muted">Assign To</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto rounded-lg border border-border p-2" role="group" aria-labelledby="myteam-assign-members-heading">
              {reports.map(m => {
                const alreadyAssigned = assignTemplateId && assignments.some(a => a.template_id === assignTemplateId && a.intern_id === m.id && a.is_active)
                return (
                  <label key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${alreadyAssigned ? 'opacity-50' : 'hover:bg-surface-hover'}`}>
                    <input type="checkbox" checked={assignMemberIds.has(m.id)} disabled={!!alreadyAssigned}
                      onChange={() => {
                        const next = new Set(assignMemberIds)
                        if (next.has(m.id)) next.delete(m.id)
                        else next.add(m.id)
                        setAssignMemberIds(next)
                      }} className="rounded border-border" />
                    <span className="text-sm flex-1">{m.display_name}</span>
                    {alreadyAssigned ? (
                      <span className="text-[10px] text-emerald-400 font-medium">Assigned</span>
                    ) : (
                      <span className="text-xs text-text-muted capitalize">{(m.position ?? 'intern').replace(/_/g, ' ')}</span>
                    )}
                  </label>
                )
              })}
            </div>
            {reports.length > 1 && (
              <div className="flex items-center gap-3 mt-1.5">
                <button onClick={() => setAssignMemberIds(new Set(reports.map(m => m.id)))}
                  className="text-xs text-gold font-medium">Select all</button>
                {assignMemberIds.size > 0 && (
                  <button onClick={() => setAssignMemberIds(new Set())}
                    className="text-xs text-text-muted font-medium">Clear</button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          {assignMemberIds.size > 0 && assignTemplateId ? (
            <p className="text-xs text-text-muted">
              Assigning to <span className="font-medium text-text">{assignMemberIds.size}</span> member{assignMemberIds.size > 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-xs text-text-light">Select a template and at least one member</p>
          )}
          <button onClick={handleAssignTemplate}
            disabled={assignSubmitting || !assignTemplateId || assignMemberIds.size === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-muted text-black text-sm font-semibold disabled:opacity-50 transition-all">
            {assignSubmitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ClipboardList size={16} aria-hidden="true" />}
            Assign Tasks
          </button>
        </div>
      </div>

      {/* Active assignments summary by member */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Active Assignments</h2>
          <span className="text-xs text-text-muted">{assignments.filter(a => a.is_active).length} total</span>
        </div>
        {reports.every(m => getMemberAssignments(m.id).length === 0) ? (
          <div className="p-8 text-center">
            <ClipboardList size={28} className="mx-auto mb-2 text-text-light opacity-30" aria-hidden="true" />
            <p className="text-sm text-text-muted">No tasks assigned yet</p>
            <p className="text-xs text-text-light mt-1">Use the form above to assign task templates to your team</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {reports.map(member => {
              const memberAssigns = getMemberAssignments(member.id)
              if (memberAssigns.length === 0) return null
              return (
                <div key={member.id}>
                  <div className="px-5 py-2.5 bg-surface-alt/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[10px] font-bold">
                        {member.display_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold">{member.display_name}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{memberAssigns.length} task{memberAssigns.length !== 1 ? 's' : ''}</span>
                  </div>
                  {memberAssigns.map(a => {
                    const tpl = templates.find(t => t.id === a.template_id)
                    if (!tpl) return null
                    const Icon = TEMPLATE_TYPE_ICONS[tpl.type] ?? FileText
                    return (
                      <div key={a.id} className="px-5 py-2.5 flex items-center justify-between hover:bg-surface-hover/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-text-muted" aria-hidden="true" />
                          <span className="text-sm">{tpl.name}</span>
                          <span className="text-[10px] text-text-light capitalize px-1.5 py-0.5 rounded bg-surface-alt">{tpl.type.replace('_', '-')}</span>
                          {!a.intern_id && a.position && (
                            <span className="text-[10px] text-violet-400 capitalize px-1.5 py-0.5 rounded bg-violet-500/10">via {a.position.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                        {a.intern_id && (
                          <button onClick={() => onRemoveAssignment(a.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Remove</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
