import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { TeamMember, DailyNote, Lead } from '../types'
import {
  Users, FileText, Target, TrendingUp, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'

export default function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [recentNotes, setRecentNotes] = useState<DailyNote[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [profile])

  const loadData = async () => {
    if (!profile) return

    if (isAdmin) {
      const [usersRes, notesRes, leadsRes] = await Promise.all([
        supabase.from('intern_users').select('*'),
        supabase.from('intern_daily_notes').select('*').order('submitted_at', { ascending: false }).limit(10),
        supabase.from('intern_leads').select('*'),
      ])
      if (usersRes.data) setTeamMembers(usersRes.data as TeamMember[])
      if (notesRes.data) setRecentNotes(notesRes.data as DailyNote[])
      if (leadsRes.data) setLeads(leadsRes.data as Lead[])
    } else {
      const [notesRes, leadsRes] = await Promise.all([
        supabase.from('intern_daily_notes').select('*').eq('intern_id', profile.id).order('submitted_at', { ascending: false }).limit(5),
        supabase.from('intern_leads').select('*').eq('intern_id', profile.id),
      ])
      if (notesRes.data) setRecentNotes(notesRes.data as DailyNote[])
      if (leadsRes.data) setLeads(leadsRes.data as Lead[])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  const activeLeads = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status))
  const followUps = leads.filter(l => l.needs_follow_up)
  const todayNotes = recentNotes.filter(n => n.note_date === new Date().toISOString().split('T')[0])

  const stats = isAdmin
    ? [
        { label: 'Team Members', value: teamMembers.length, icon: Users, color: 'text-brand-600 bg-brand-50' },
        { label: 'Notes Today', value: todayNotes.length, icon: FileText, color: 'text-green-600 bg-green-50' },
        { label: 'Active Leads', value: activeLeads.length, icon: Target, color: 'text-purple-600 bg-purple-50' },
        { label: 'Follow-ups', value: followUps.length, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
      ]
    : [
        { label: 'My Notes', value: recentNotes.length, icon: FileText, color: 'text-brand-600 bg-brand-50' },
        { label: 'My Leads', value: leads.length, icon: Target, color: 'text-purple-600 bg-purple-50' },
        { label: 'Active Leads', value: activeLeads.length, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
        { label: 'Follow-ups', value: followUps.length, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
      ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {profile?.display_name?.split(' ')[0]}</h1>
        <p className="text-text-muted mt-1">
          {isAdmin ? "Here's an overview of your team's activity." : "Here's your activity summary."}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <div className="bg-surface rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FileText size={16} className="text-text-muted" />
            <h2 className="font-semibold">Recent Notes</h2>
          </div>
          <div className="divide-y divide-border">
            {recentNotes.length === 0 ? (
              <p className="p-5 text-sm text-text-muted">No notes yet.</p>
            ) : (
              recentNotes.slice(0, 5).map(note => (
                <div key={note.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{note.note_date}</span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      {note.manager_reply ? (
                        <><CheckCircle2 size={12} className="text-green-500" /> Replied</>
                      ) : (
                        <><Clock size={12} /> Pending</>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted line-clamp-2">
                    {typeof note.content === 'string' ? note.content : JSON.stringify(note.content).slice(0, 120)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Leads */}
        <div className="bg-surface rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Target size={16} className="text-text-muted" />
            <h2 className="font-semibold">Active Leads</h2>
          </div>
          <div className="divide-y divide-border">
            {activeLeads.length === 0 ? (
              <p className="p-5 text-sm text-text-muted">No active leads.</p>
            ) : (
              activeLeads.slice(0, 5).map(lead => (
                <div key={lead.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{lead.contact}</p>
                    <p className="text-xs text-text-muted">{lead.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      lead.priority === 'high' ? 'bg-red-50 text-red-700' :
                      lead.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {lead.priority}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 capitalize">
                      {lead.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin: Team Overview */}
      {isAdmin && teamMembers.length > 0 && (
        <div className="bg-surface rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users size={16} className="text-text-muted" />
            <h2 className="font-semibold">Team Members</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-hover transition-colors">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold shrink-0">
                  {member.display_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.display_name}</p>
                  <p className="text-xs text-text-muted capitalize">{member.position ?? 'Member'}</p>
                </div>
                <span className={`ml-auto shrink-0 w-2 h-2 rounded-full ${
                  member.status === 'active' ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
