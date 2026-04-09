import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/Toast'
import type { TeamMember } from '../../types'
import {
  Users, Plus, X, Loader2, Edit2, Trash2, Search, Shield, UserCheck,
  Mail, Phone, Calendar as CalendarIcon, Save,
} from 'lucide-react'

const POSITIONS = [
  { value: 'owner', label: 'Owner / Lead Engineer', color: 'bg-gold/10 text-gold' },
  { value: 'marketing_admin', label: 'Marketing / Admin', color: 'bg-emerald-500/10 text-emerald-400' },
  { value: 'artist_development', label: 'Artist Development', color: 'bg-violet-500/10 text-violet-400' },
  { value: 'intern', label: 'Intern', color: 'bg-sky-500/10 text-sky-400' },
  { value: 'engineer', label: 'Audio Engineer', color: 'bg-amber-500/10 text-amber-400' },
  { value: 'producer', label: 'Producer', color: 'bg-rose-500/10 text-rose-400' },
]

type MemberForm = {
  display_name: string; email: string; role: 'admin' | 'member'
  position: string; phone: string; start_date: string; status: 'active' | 'inactive'
}

const EMPTY_MEMBER: MemberForm = {
  display_name: '',
  email: '',
  role: 'member',
  position: 'intern',
  phone: '',
  start_date: '',
  status: 'active',
}

export default function TeamManager() {
  const { toast } = useToast()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<MemberForm>(EMPTY_MEMBER)
  const [customPosition, setCustomPosition] = useState('')

  useEffect(() => { loadMembers() }, [])

  const loadMembers = async () => {
    const { data } = await supabase.from('intern_users').select('*').order('display_name')
    if (data) setMembers(data as TeamMember[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const position = formData.position === 'custom' ? customPosition : formData.position

    if (editingMember) {
      const { error } = await supabase.from('intern_users').update({
        display_name: formData.display_name,
        role: formData.role,
        position,
        phone: formData.phone,
        start_date: formData.start_date || null,
        status: formData.status,
      }).eq('id', editingMember.id)
      if (error) toast('Failed to update member', 'error')
      else toast('Member updated')
    } else {
      const { error } = await supabase.from('intern_users').insert({
        id: crypto.randomUUID(),
        display_name: formData.display_name,
        email: formData.email,
        role: formData.role,
        position,
        phone: formData.phone || null,
        start_date: formData.start_date || null,
        status: formData.status,
      })
      if (error) toast('Failed to add member', 'error')
      else toast('Member added')
    }

    setShowForm(false)
    setEditingMember(null)
    setFormData(EMPTY_MEMBER)
    setCustomPosition('')
    setSubmitting(false)
    loadMembers()
  }

  const handleEdit = (member: TeamMember) => {
    const knownPosition = POSITIONS.find(p => p.value === member.position)
    setEditingMember(member)
    setFormData({
      display_name: member.display_name,
      email: member.email,
      role: member.role as 'admin' | 'member',
      position: knownPosition ? (member.position ?? 'intern') : 'custom',
      phone: member.phone ?? '',
      start_date: member.start_date ?? '',
      status: (member.status ?? 'active') as 'active' | 'inactive',
    })
    if (!knownPosition) setCustomPosition(member.position ?? '')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this team member? This cannot be undone.')) return
    await supabase.from('intern_users').delete().eq('id', id)
    toast('Member removed')
    loadMembers()
  }

  const toggleStatus = async (member: TeamMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    await supabase.from('intern_users').update({ status: newStatus }).eq('id', member.id)
    toast(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
    loadMembers()
  }

  const toggleRole = async (member: TeamMember) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    await supabase.from('intern_users').update({ role: newRole }).eq('id', member.id)
    toast(`Role updated to ${newRole}`)
    loadMembers()
  }

  const getPositionStyle = (pos: string) => {
    return POSITIONS.find(p => p.value === pos)?.color ?? 'bg-surface-alt text-text-muted'
  }

  const getPositionLabel = (pos: string) => {
    return POSITIONS.find(p => p.value === pos)?.label ?? pos
  }

  const filtered = members
    .filter(m => positionFilter === 'all' || m.position === positionFilter)
    .filter(m => {
      if (!search) return true
      const s = search.toLowerCase()
      return m.display_name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s)
    })

  const positionCounts = members.reduce<Record<string, number>>((acc, m) => {
    const pos = m.position ?? 'intern'
    acc[pos] = (acc[pos] ?? 0) + 1
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-gold/20 border-t-gold" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Manager</h1>
          <p className="text-text-muted mt-1">Manage team members, roles, and positions</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingMember(null); setFormData(EMPTY_MEMBER) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-muted text-black text-sm font-semibold transition-all">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(positionCounts).map(([pos, count]) => (
          <button
            key={pos}
            onClick={() => setPositionFilter(positionFilter === pos ? 'all' : pos)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              positionFilter === pos ? 'ring-2 ring-gold ring-offset-1 ring-offset-bg' : ''
            } ${getPositionStyle(pos)}`}
          >
            <span>{getPositionLabel(pos)}</span>
            <span className="bg-white/10 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
          </button>
        ))}
        {positionFilter !== 'all' && (
          <button onClick={() => setPositionFilter('all')}
            className="text-xs text-text-muted hover:text-gold px-2 py-1.5">
            Clear filter
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold">{editingMember ? 'Edit Team Member' : 'Add Team Member'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Full Name *</label>
              <input required value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Email {editingMember ? '' : '*'}</label>
              <input type="email" required={!editingMember} disabled={!!editingMember}
                value={editingMember ? editingMember.email : formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm disabled:bg-surface-alt disabled:text-text-muted" placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Position</label>
              <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm">
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                <option value="custom">Custom Position...</option>
              </select>
            </div>
            {formData.position === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-text-muted">Custom Position Name</label>
                <input value={customPosition} onChange={e => setCustomPosition(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm" placeholder="e.g. Session Musician" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Role</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'member' })}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Phone</label>
              <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Start Date</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingMember(null) }}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-hover">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-muted text-black text-sm font-semibold disabled:opacity-50 transition-all">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-muted">
          No team members found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-bold shrink-0">
                    {member.display_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{member.display_name}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium mt-0.5 ${getPositionStyle(member.position ?? 'intern')}`}>
                      {getPositionLabel(member.position ?? 'intern')}
                    </span>
                  </div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full mt-1 ${member.status === 'active' ? 'bg-emerald-400' : 'bg-text-light'}`} />
              </div>

              <div className="space-y-1.5 text-xs text-text-muted mb-4">
                <p className="flex items-center gap-1.5"><Mail size={12} /> {member.email}</p>
                {member.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {member.phone}</p>}
                {member.start_date && <p className="flex items-center gap-1.5"><CalendarIcon size={12} /> Started {member.start_date}</p>}
                <p className="flex items-center gap-1.5">
                  {member.role === 'admin' ? <Shield size={12} className="text-gold" /> : <UserCheck size={12} />}
                  <span className="capitalize">{member.role}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 border-t border-border pt-3">
                <button onClick={() => handleEdit(member)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gold hover:bg-gold/10 transition-colors">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => toggleRole(member)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors">
                  <Shield size={12} /> {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </button>
                <button onClick={() => toggleStatus(member)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    member.status === 'active' ? 'text-text-muted hover:bg-surface-hover' : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}>
                  {member.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(member.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors ml-auto">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
