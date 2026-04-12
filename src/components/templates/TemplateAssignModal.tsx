// Phase 4.2 — template → member/position assignment modal,
// extracted from admin/Templates.tsx.

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../Toast'
import type { ReportTemplate, TeamMember, TaskAssignment } from '../../types'
import { X, Loader2, UserPlus, Users } from 'lucide-react'

const POSITIONS_LIST = [
  { value: 'owner', label: 'Owner / Lead Engineer' },
  { value: 'marketing_admin', label: 'Marketing / Admin' },
  { value: 'artist_development', label: 'Artist Development' },
  { value: 'intern', label: 'Intern' },
  { value: 'engineer', label: 'Audio Engineer' },
  { value: 'producer', label: 'Producer' },
]

export interface TemplateAssignModalProps {
  template: ReportTemplate | null
  teamMembers: TeamMember[]
  assignments: TaskAssignment[]
  onClose: () => void
  onChanged: () => void
}

export default function TemplateAssignModal({
  template, teamMembers, assignments, onClose, onChanged,
}: TemplateAssignModalProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [assignMode, setAssignMode] = useState<'member' | 'position'>('member')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [selectedPosition, setSelectedPosition] = useState(template?.position ?? '')
  const [submitting, setSubmitting] = useState(false)

  if (!template) return null

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleAssign = async () => {
    setSubmitting(true)

    const inserts: Array<{
      template_id: string; intern_id: string | null
      position: string | null; is_active: boolean; assigned_by: string | undefined
    }> = []

    if (assignMode === 'member') {
      for (const memberId of selectedMemberIds) {
        const exists = assignments.some(
          a => a.template_id === template.id && a.intern_id === memberId && a.is_active,
        )
        if (!exists) {
          inserts.push({
            template_id: template.id, intern_id: memberId,
            position: null, is_active: true, assigned_by: profile?.id,
          })
        }
      }
    } else if (selectedPosition) {
      const exists = assignments.some(
        a => a.template_id === template.id && a.position === selectedPosition && a.is_active,
      )
      if (!exists) {
        inserts.push({
          template_id: template.id, intern_id: null,
          position: selectedPosition, is_active: true, assigned_by: profile?.id,
        })
      }
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from('task_assignments').insert(inserts)
      if (error) toast('Failed to assign template', 'error')
      else toast(`Template assigned to ${inserts.length} target${inserts.length > 1 ? 's' : ''}`)
    } else {
      toast('Already assigned', 'error')
    }

    setSubmitting(false)
    onClose()
    onChanged()
  }

  const removeAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from('task_assignments').delete().eq('id', assignmentId)
    if (error) { toast('Failed to remove assignment', 'error'); return }
    toast('Assignment removed')
    onChanged()
  }

  const current = assignments.filter(a => a.template_id === template.id && a.is_active)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" role="presentation" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl border border-border p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="assign-modal-title" className="font-semibold text-lg">Assign Tasks</h2>
            <p className="text-sm text-text-muted mt-0.5">{template.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {current.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Currently Assigned To</p>
            <div className="space-y-1.5">
              {current.map(a => (
                <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-alt text-sm">
                  <div className="flex items-center gap-2">
                    {a.intern_id ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(teamMembers.find(m => m.id === a.intern_id)?.display_name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <span>{teamMembers.find(m => m.id === a.intern_id)?.display_name ?? 'Unknown'}</span>
                      </>
                    ) : (
                      <>
                        <Users size={14} className="text-violet-400" aria-hidden="true" />
                        <span>All {POSITIONS_LIST.find(p => p.value === a.position)?.label ?? a.position}</span>
                      </>
                    )}
                  </div>
                  <button onClick={() => removeAssignment(a.id)}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Add Assignment</p>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setAssignMode('member')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${assignMode === 'member' ? 'bg-gold/10 text-gold' : 'text-text-muted hover:bg-surface-hover'}`}>
            By Member
          </button>
          <button onClick={() => setAssignMode('position')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${assignMode === 'position' ? 'bg-gold/10 text-gold' : 'text-text-muted hover:bg-surface-hover'}`}>
            By Position
          </button>
        </div>

        {assignMode === 'member' ? (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {teamMembers.filter(m => m.status !== 'inactive').map(m => {
              const alreadyAssigned = assignments.some(a => a.template_id === template.id && a.intern_id === m.id && a.is_active)
              return (
                <label key={m.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${alreadyAssigned ? 'opacity-50' : 'hover:bg-surface-hover'}`}>
                  <input type="checkbox" checked={selectedMemberIds.has(m.id)} disabled={alreadyAssigned}
                    onChange={() => toggleMember(m.id)} className="rounded border-border" />
                  <div className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center text-xs font-bold shrink-0">
                    {m.display_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.display_name}</p>
                    <p className="text-xs text-text-muted capitalize">{(m.position ?? 'intern').replace(/_/g, ' ')}</p>
                  </div>
                  {alreadyAssigned && (
                    <span className="text-[10px] text-emerald-400 font-medium shrink-0">Assigned</span>
                  )}
                </label>
              )
            })}
          </div>
        ) : (
          <div>
            <label htmlFor="assign-position" className="sr-only">Position to assign</label>
            <select id="assign-position" value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm">
              <option value="">Select a position...</option>
              {POSITIONS_LIST.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {selectedPosition && (
              <p className="text-xs text-text-muted mt-2">
                All current and future <span className="font-medium text-text">{POSITIONS_LIST.find(p => p.value === selectedPosition)?.label}</span> members will receive this task template.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
          <div>
            {assignMode === 'member' && selectedMemberIds.size > 0 && (
              <p className="text-xs text-text-muted">
                <span className="font-medium text-text">{selectedMemberIds.size}</span> member{selectedMemberIds.size > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-hover transition-colors">Cancel</button>
            <button onClick={handleAssign} disabled={submitting || (assignMode === 'member' ? selectedMemberIds.size === 0 : !selectedPosition)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold hover:bg-gold-muted text-black font-semibold text-sm disabled:opacity-50 transition-all">
              {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
              Assign Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
