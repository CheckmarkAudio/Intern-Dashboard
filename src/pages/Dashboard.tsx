import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useChecklist } from '../hooks/useChecklist'
import { supabase } from '../lib/supabase'
import type { DailyNote, DeliverableSubmission, TeamMember } from '../types'
import MustDoCard from '../components/MustDoCard'
import SubmissionModal from '../components/SubmissionModal'
import {
  Check, ChevronLeft, ChevronRight, FileText, Flame,
  ListChecks, Mic, ArrowRight,
} from 'lucide-react'

export default function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null)
  const [streak, setStreak] = useState(0)
  const [todaySessions, setTodaySessions] = useState<{ id: string; client_name: string; start_time: string; end_time: string; session_type: string; status: string }[]>([])
  const [teamSubmissions, setTeamSubmissions] = useState<(DeliverableSubmission & { display_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [mustDoKey, setMustDoKey] = useState(0)

  const daily = useChecklist('daily', new Date())

  useEffect(() => { loadData() }, [profile])

  const loadData = async () => {
    if (!profile) { setLoading(false); return }
    const today = new Date().toISOString().split('T')[0]

    try {
      const [noteRes, sessRes] = await Promise.all([
        supabase.from('intern_daily_notes').select('*').eq('intern_id', profile.id).eq('note_date', today).maybeSingle(),
        supabase.from('sessions').select('*').eq('session_date', today).order('start_time'),
      ])
      if (noteRes.data) setTodayNote(noteRes.data as DailyNote)
      if (sessRes.data) setTodaySessions(sessRes.data)

      if (isAdmin) {
        const { data: subs } = await supabase
          .from('deliverable_submissions')
          .select('*')
          .eq('submission_date', today)
          .order('created_at', { ascending: false })
        if (subs) {
          const { data: members } = await supabase.from('intern_users').select('id, display_name')
          const memberMap = new Map((members ?? []).map((m: TeamMember) => [m.id, m.display_name]))
          setTeamSubmissions(subs.map((s: DeliverableSubmission) => ({ ...s, display_name: memberMap.get(s.intern_id) ?? 'Unknown' })))
        }
      }

      try {
        const { data: instances } = await supabase
          .from('intern_checklist_instances')
          .select('id, period_date')
          .eq('frequency', 'daily')
          .eq('intern_id', profile.id)
          .order('period_date', { ascending: false })
          .limit(30)
        if (instances && instances.length > 0) {
          let s = 0
          for (const inst of instances) {
            const { data: cItems } = await supabase
              .from('intern_checklist_items')
              .select('is_completed')
              .eq('instance_id', inst.id)
            if (!cItems || cItems.length === 0) break
            if (cItems.every((ci: { is_completed: boolean }) => ci.is_completed)) s++
            else break
          }
          setStreak(s)
        }
      } catch {}
    } catch (err) { console.error('Dashboard load error:', err) }
    finally { setLoading(false) }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.display_name?.split(' ')[0] ?? ''

  const handleReviewSubmission = async (id: string) => {
    if (!profile) return
    await supabase.from('deliverable_submissions').update({
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold/20 border-t-gold" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-text-light text-sm font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold mt-1">{greeting}, {firstName}</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Daily Progress</span>
            <ListChecks size={14} className="text-gold" />
          </div>
          <p className="text-xl font-bold">{daily.completedCount}/{daily.totalCount}</p>
          <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${daily.percentage}%`,
                backgroundColor: daily.percentage === 100 ? '#10b981' : '#C9A84C',
              }}
            />
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Streak</span>
            <Flame size={14} className="text-orange-500" />
          </div>
          <p className="text-xl font-bold">{streak} day{streak !== 1 ? 's' : ''}</p>
          <p className="text-[11px] text-text-light mt-1">Consecutive 100%</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Daily Note</span>
            <FileText size={14} className="text-emerald-500" />
          </div>
          {todayNote ? (
            <p className="text-sm font-semibold text-emerald-400">Submitted</p>
          ) : (
            <Link to="/notes" className="text-sm font-semibold text-gold hover:underline">
              Submit now
            </Link>
          )}
        </div>
      </div>

      {/* Must-Do */}
      <MustDoCard key={mustDoKey} onSubmit={() => setShowSubmitModal(true)} />

      {/* Today's Checklist inline */}
      {daily.totalCount > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Today's Tasks</h2>
          </div>
          <div className="divide-y divide-border/50">
            {Object.entries(daily.grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-5 py-2.5 bg-surface-alt/50">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">{category}</span>
                </div>
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => daily.toggleItem(item.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.is_completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-border-light hover:border-gold/50'
                    }`}>
                      {item.is_completed && <Check size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm ${item.is_completed ? 'text-text-light line-through' : 'text-text'}`}>
                      {item.item_text}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={14} className="text-gold" />
              <h2 className="font-semibold text-sm">Today's Sessions</h2>
            </div>
            <Link to="/sessions" className="text-xs text-gold font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {todaySessions.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.client_name ?? 'Studio Session'}</p>
                  <p className="text-xs text-text-muted capitalize">{s.session_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-muted">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</p>
                  <span className={`text-[10px] font-semibold uppercase ${
                    s.status === 'confirmed' ? 'text-emerald-400' : s.status === 'pending' ? 'text-gold' : 'text-text-light'
                  }`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin: Team Submissions Today */}
      {isAdmin && teamSubmissions.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Team Submissions Today</h2>
          </div>
          <div className="divide-y divide-border/50">
            {teamSubmissions.map(sub => (
              <div key={sub.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{sub.display_name}</p>
                  <p className="text-xs text-text-muted capitalize">{sub.submission_type.replace(/_/g, ' ')}</p>
                  {sub.notes && <p className="text-xs text-text-light mt-0.5">{sub.notes}</p>}
                </div>
                {sub.reviewed_by ? (
                  <span className="text-xs text-emerald-400 font-medium">Reviewed</span>
                ) : (
                  <button
                    onClick={() => handleReviewSubmission(sub.id)}
                    className="text-xs text-gold font-medium hover:underline"
                  >
                    Mark Reviewed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showSubmitModal && (
        <SubmissionModal
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={() => { setMustDoKey(k => k + 1); loadData() }}
        />
      )}
    </div>
  )
}
