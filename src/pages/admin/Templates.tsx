import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ReportTemplate, TemplateField } from '../../types'
import {
  ClipboardList, Plus, X, Save, Loader2, Edit2, Trash2, Copy, GripVertical,
  FileText, CheckSquare, BarChart3,
} from 'lucide-react'

const TEMPLATE_TYPES = [
  { value: 'daily', label: 'Daily Report', icon: FileText, color: 'bg-sky-500/10 text-sky-400' },
  { value: 'weekly', label: 'Weekly Report', icon: BarChart3, color: 'bg-violet-500/10 text-violet-400' },
  { value: 'checklist', label: 'Checklist', icon: CheckSquare, color: 'bg-emerald-500/10 text-emerald-400' },
]

const FIELD_TYPES = [
  { value: 'textarea', label: 'Long Text' },
  { value: 'text', label: 'Short Text' },
  { value: 'number', label: 'Number' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
]

const PRESET_TEMPLATES: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Intern Daily Checklist',
    type: 'checklist',
    position: 'intern',
    is_default: true,
    fields: [
      { id: '1', label: 'Submit 1 social media piece to Dropbox', type: 'checkbox', is_critical: true },
      { id: '2', label: 'Check and respond to messages', type: 'checkbox' },
      { id: '3', label: 'Attend standup / check-in', type: 'checkbox' },
      { id: '4', label: 'Complete learning module', type: 'checkbox' },
      { id: '5', label: 'Update task notes', type: 'checkbox' },
    ],
  },
  {
    name: 'Marketing / Admin Daily Checklist',
    type: 'checklist',
    position: 'marketing_admin',
    is_default: true,
    fields: [
      { id: '1', label: 'Submit content to Dropbox', type: 'checkbox', is_critical: true },
      { id: '2', label: 'Update and communicate team schedule', type: 'checkbox', is_critical: true },
      { id: '3', label: 'Review analytics / metrics', type: 'checkbox' },
      { id: '4', label: 'Manage content calendar', type: 'checkbox' },
      { id: '5', label: 'Process communications and emails', type: 'checkbox' },
    ],
  },
  {
    name: 'Artist Development Daily Checklist',
    type: 'checklist',
    position: 'artist_development',
    is_default: true,
    fields: [
      { id: '1', label: 'Complete client/artist follow-ups', type: 'checkbox', is_critical: true },
      { id: '2', label: 'Log all external communications with next steps', type: 'checkbox', is_critical: true },
      { id: '3', label: 'Update artist pipeline', type: 'checkbox' },
      { id: '4', label: 'Coordinate release timelines', type: 'checkbox' },
      { id: '5', label: 'Review new submissions', type: 'checkbox' },
    ],
  },
  {
    name: 'Owner Daily Checklist',
    type: 'checklist',
    position: 'owner',
    is_default: true,
    fields: [
      { id: '1', label: 'Review team progress and submissions', type: 'checkbox', is_critical: true },
      { id: '2', label: 'Check business health metrics', type: 'checkbox' },
      { id: '3', label: 'Approve submitted work', type: 'checkbox' },
      { id: '4', label: 'Handle escalations', type: 'checkbox' },
      { id: '5', label: 'Update priorities for the team', type: 'checkbox' },
    ],
  },
  {
    name: 'Weekly Summary',
    type: 'weekly',
    position: null,
    is_default: false,
    fields: [
      { id: '1', label: 'Key accomplishments this week', type: 'textarea', required: true },
      { id: '2', label: 'Challenges faced', type: 'textarea', required: false },
      { id: '3', label: 'Plans for next week', type: 'textarea', required: true },
      { id: '4', label: 'Total hours worked', type: 'number', required: true },
    ],
  },
  {
    name: 'Marketing Weekly Report',
    type: 'weekly',
    position: 'marketing_admin',
    is_default: false,
    fields: [
      { id: '1', label: 'Content pieces published', type: 'number', required: true },
      { id: '2', label: 'Social media growth this week', type: 'textarea', required: true },
      { id: '3', label: 'Campaign performance summary', type: 'textarea', required: false },
      { id: '4', label: 'Next week\'s content strategy', type: 'textarea', required: true },
    ],
  },
  {
    name: 'Daily Standup Report',
    type: 'daily',
    position: null,
    is_default: false,
    fields: [
      { id: '1', label: 'What did you accomplish today?', type: 'textarea', required: true },
      { id: '2', label: 'Any blockers or challenges?', type: 'textarea', required: false },
      { id: '3', label: 'What will you work on tomorrow?', type: 'textarea', required: true },
    ],
  },
]

export default function Templates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')

  const [name, setName] = useState('')
  const [type, setType] = useState<'daily' | 'weekly' | 'checklist'>('daily')
  const [position, setPosition] = useState<string>('')
  const [isDefault, setIsDefault] = useState(false)
  const [fields, setFields] = useState<TemplateField[]>([])

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    const { data } = await supabase.from('report_templates').select('*').order('created_at', { ascending: false })
    if (data) setTemplates(data as ReportTemplate[])
    setLoading(false)
  }

  const resetForm = () => {
    setName(''); setType('daily'); setPosition(''); setIsDefault(false)
    setFields([]); setEditingTemplate(null)
  }

  const openForm = () => { resetForm(); setShowForm(true); setShowPresets(false) }

  const handleEdit = (t: ReportTemplate) => {
    setEditingTemplate(t)
    setName(t.name)
    setType(t.type)
    setPosition(t.position ?? '')
    setIsDefault(t.is_default)
    setFields(t.fields)
    setShowForm(true)
    setShowPresets(false)
  }

  const handleDuplicate = (t: ReportTemplate) => {
    setEditingTemplate(null)
    setName(`${t.name} (Copy)`)
    setType(t.type)
    setPosition(t.position ?? '')
    setIsDefault(false)
    setFields(t.fields.map(f => ({ ...f, id: crypto.randomUUID() })))
    setShowForm(true)
    setShowPresets(false)
  }

  const usePreset = (preset: typeof PRESET_TEMPLATES[number]) => {
    resetForm()
    setName(preset.name)
    setType(preset.type as ReportTemplate['type'])
    setPosition(preset.position ?? '')
    setFields(preset.fields.map(f => ({ ...f, id: crypto.randomUUID() })))
    setShowPresets(false)
    setShowForm(true)
  }

  const addField = () => {
    setFields([...fields, {
      id: crypto.randomUUID(),
      label: '',
      type: type === 'checklist' ? 'checkbox' : 'textarea',
      required: false,
    }])
  }

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f))
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      name,
      type,
      position: position || null,
      is_default: isDefault,
      fields,
      updated_at: new Date().toISOString(),
    }

    if (editingTemplate) {
      await supabase.from('report_templates').update(payload).eq('id', editingTemplate.id)
    } else {
      await supabase.from('report_templates').insert({ ...payload, created_at: new Date().toISOString() })
    }

    setShowForm(false)
    resetForm()
    setSubmitting(false)
    loadTemplates()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    await supabase.from('report_templates').delete().eq('id', id)
    loadTemplates()
  }

  const getTypeInfo = (t: string) => TEMPLATE_TYPES.find(tt => tt.value === t) ?? TEMPLATE_TYPES[0]!

  const filtered = typeFilter === 'all' ? templates : templates.filter(t => t.type === typeFilter)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-gold/20 border-t-gold" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-text-muted mt-1">Create and manage report templates for your team</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowPresets(!showPresets); setShowForm(false) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-hover">
            <ClipboardList size={16} /> Presets
          </button>
          <button onClick={showForm ? () => { setShowForm(false); resetForm() } : openForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold hover:bg-gold-muted text-black font-semibold text-sm">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New Template'}
          </button>
        </div>
      </div>

      {/* Presets panel */}
      {showPresets && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-4">Preset Templates</h2>
          <p className="text-sm text-text-muted mb-4">Pick a preset to start with, then customize it to your needs.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_TEMPLATES.map((preset, i) => {
              const info = getTypeInfo(preset.type)
              return (
                <button
                  key={i}
                  onClick={() => usePreset(preset)}
                  className="text-left p-4 rounded-lg border border-border hover:border-gold/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1 rounded ${info.color}`}><info.icon size={14} /></span>
                    <span className="text-xs font-medium text-text-muted capitalize">{preset.type}</span>
                    {preset.position && (
                      <span className="text-xs bg-surface-alt px-1.5 py-0.5 rounded capitalize">{preset.position}</span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm">{preset.name}</h3>
                  <p className="text-xs text-text-muted mt-1">{preset.fields.length} fields</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 space-y-5">
          <h2 className="font-semibold">{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Template Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm"
                placeholder="e.g. Daily Marketing Report" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select value={type} onChange={e => setType(e.target.value as ReportTemplate['type'])}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm">
                {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Assigned Position</label>
              <select value={position} onChange={e => setPosition(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm">
                <option value="">All Positions</option>
                <option value="owner">Owner / Lead Engineer</option>
                <option value="marketing_admin">Marketing / Admin</option>
                <option value="artist_development">Artist Development</option>
                <option value="intern">Intern</option>
                <option value="engineer">Audio Engineer</option>
                <option value="producer">Producer</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded border-border" />
                Set as default for this position
              </label>
            </div>
          </div>

          {/* Fields builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Fields ({fields.length})</label>
              <button type="button" onClick={addField}
                className="flex items-center gap-1 text-xs text-gold font-medium">
                <Plus size={14} /> Add Field
              </button>
            </div>
            <div className="space-y-2">
              {fields.length === 0 && (
                <p className="text-sm text-text-muted p-4 text-center border border-dashed border-border rounded-lg">
                  No fields yet. Click "Add Field" to start building your template.
                </p>
              )}
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-surface-alt">
                  <GripVertical size={16} className="text-text-light mt-2 shrink-0 cursor-grab" />
                  <div className="flex-1 grid sm:grid-cols-3 gap-2">
                    <input
                      value={field.label}
                      onChange={e => updateField(i, { label: e.target.value })}
                      placeholder="Field label"
                      className="sm:col-span-2 px-2.5 py-1.5 rounded border border-border text-sm"
                    />
                    <select
                      value={field.type}
                      onChange={e => updateField(i, { type: e.target.value as TemplateField['type'] })}
                      className="px-2.5 py-1.5 rounded border border-border text-sm"
                    >
                      {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </select>
                  </div>
                  {field.type !== 'checkbox' && (
                    <label className="flex items-center gap-1 text-xs text-text-muted mt-2 shrink-0">
                      <input type="checkbox" checked={field.required ?? false}
                        onChange={e => updateField(i, { required: e.target.checked })}
                        className="rounded border-border" />
                      Required
                    </label>
                  )}
                  <button type="button" onClick={() => removeField(i)}
                    className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 mt-1 shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-hover">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold hover:bg-gold-muted text-black font-semibold text-sm disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-gold/10 text-gold' : 'text-text-muted hover:bg-surface-hover'}`}>
          All
        </button>
        {TEMPLATE_TYPES.map(t => (
          <button key={t.value} onClick={() => setTypeFilter(t.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t.value ? t.color : 'text-text-muted hover:bg-surface-hover'}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Templates list */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-muted">
          <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
          <p>No templates yet. Create one or pick from presets to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(template => {
            const info = getTypeInfo(template.type)
            return (
              <div key={template.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`p-1 rounded ${info.color}`}><info.icon size={14} /></span>
                      <span className="text-xs font-medium text-text-muted capitalize">{template.type}</span>
                      {template.is_default && (
                        <span className="text-[10px] font-medium bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>
                  {template.position && (
                    <span className="text-xs bg-surface-alt px-2 py-1 rounded-full capitalize">{template.position}</span>
                  )}
                </div>

                <div className="space-y-1 mb-4">
                  {template.fields.slice(0, 4).map(field => (
                    <div key={field.id} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-light shrink-0" />
                      <span className="truncate">{field.label}</span>
                      <span className="text-text-light ml-auto shrink-0">{field.type}</span>
                    </div>
                  ))}
                  {template.fields.length > 4 && (
                    <p className="text-xs text-text-light pl-3.5">+{template.fields.length - 4} more fields</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 border-t border-border pt-3">
                  <button onClick={() => handleEdit(template)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gold hover:bg-gold/10">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => handleDuplicate(template)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-surface-hover">
                    <Copy size={12} /> Duplicate
                  </button>
                  <button onClick={() => handleDelete(template.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 ml-auto">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
