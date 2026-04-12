// Phase 4.2 — artist detail/edit modal, extracted from Pipeline.tsx.

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { Button, Input, Textarea, Select, Modal } from '../ui'
import type { ArtistPipelineEntry, TeamMember } from '../../types'
import { Edit2, Save, Trash2, ChevronRight } from 'lucide-react'

const STAGES: { key: ArtistPipelineEntry['stage']; label: string }[] = [
  { key: 'inquiry',         label: 'Inquiry' },
  { key: 'onboarding',      label: 'Onboarding' },
  { key: 'active',          label: 'Active' },
  { key: 'release_support', label: 'Release Support' },
  { key: 'alumni',          label: 'Alumni' },
]

interface PipelineForm {
  artist_name: string
  contact_email: string
  contact_phone: string
  stage: ArtistPipelineEntry['stage']
  assigned_to: string
  notes: string
  next_followup: string
}

function entryToForm(e: ArtistPipelineEntry): PipelineForm {
  return {
    artist_name: e.artist_name,
    contact_email: e.contact_email ?? '',
    contact_phone: e.contact_phone ?? '',
    stage: e.stage,
    assigned_to: e.assigned_to ?? '',
    notes: e.notes ?? '',
    next_followup: e.next_followup ? e.next_followup.slice(0, 10) : '',
  }
}

export interface PipelineEntryModalProps {
  entry: ArtistPipelineEntry | null
  teamMembers: TeamMember[]
  advancingId: string | null
  onClose: () => void
  onSaved: () => void
  onAdvance: (entry: ArtistPipelineEntry, e?: React.SyntheticEvent) => void
}

export default function PipelineEntryModal({
  entry, teamMembers, advancingId, onClose, onSaved, onAdvance,
}: PipelineEntryModalProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<PipelineForm>(() => entry ? entryToForm(entry) : entryToForm({} as ArtistPipelineEntry))
  const [submitting, setSubmitting] = useState(false)

  // Keep form in sync when parent switches entry.
  if (entry && form.artist_name === '' && entry.artist_name !== '') {
    setForm(entryToForm(entry))
  }

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!entry) return
    setSubmitting(true)
    const payload = {
      artist_name: form.artist_name.trim(),
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      stage: form.stage,
      assigned_to: form.assigned_to || null,
      notes: form.notes.trim() || null,
      next_followup: form.next_followup || null,
    }
    const { error } = await supabase.from('artist_pipeline').update(payload).eq('id', entry.id)
    setSubmitting(false)
    if (error) {
      console.error(error)
      toast(error.message || 'Could not save changes', 'error')
      return
    }
    toast('Saved', 'success')
    onSaved()
  }

  const handleDelete = async () => {
    if (!entry) return
    if (!confirm(`Remove "${entry.artist_name}" from the pipeline?`)) return
    const { error } = await supabase.from('artist_pipeline').delete().eq('id', entry.id)
    if (error) {
      console.error(error)
      toast(error.message || 'Could not delete', 'error')
      return
    }
    toast('Artist removed', 'success')
    onClose()
    onSaved()
  }

  return (
    <Modal
      open={!!entry}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Edit2 size={18} className="text-gold" aria-hidden="true" />
          {entry?.artist_name ?? ''}
        </span>
      }
      size="lg"
      locked={submitting}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          id="pipe-edit-name"
          label="Artist name"
          required
          value={form.artist_name}
          onChange={(e) => setForm({ ...form, artist_name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="pipe-edit-email"
            label="Email"
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
          />
          <Input
            id="pipe-edit-phone"
            label="Phone"
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
          />
        </div>
        <Select
          id="pipe-edit-stage"
          label="Stage"
          value={form.stage}
          onChange={(e) => setForm({ ...form, stage: e.target.value as ArtistPipelineEntry['stage'] })}
        >
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </Select>
        <Select
          id="pipe-edit-assigned"
          label="Assigned to"
          value={form.assigned_to}
          onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
        >
          <option value="">Unassigned</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
        </Select>
        <Input
          id="pipe-edit-followup"
          label="Next follow-up"
          type="date"
          value={form.next_followup}
          onChange={(e) => setForm({ ...form, next_followup: e.target.value })}
        />
        <Textarea
          id="pipe-edit-notes"
          label="Notes"
          rows={4}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          {entry && form.stage !== 'alumni' && (
            <Button
              type="button"
              variant="secondary"
              onClick={(ev) => onAdvance(entry, ev)}
              loading={advancingId === entry.id}
              iconLeft={advancingId !== entry.id ? <ChevronRight size={16} aria-hidden="true" /> : undefined}
              className="text-gold hover:text-gold"
            >
              Advance stage
            </Button>
          )}
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            iconLeft={<Trash2 size={16} aria-hidden="true" />}
          >
            Delete
          </Button>
          <div className="flex-1 min-w-[120px]" />
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            iconLeft={!submitting ? <Save size={16} aria-hidden="true" /> : undefined}
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}
