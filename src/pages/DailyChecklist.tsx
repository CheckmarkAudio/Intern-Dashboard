import { useMemo, useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTasks } from '../contexts/TaskContext'
import CreateTaskModal from '../components/CreateTaskModal'
import { Check, Send, Plus, Clock, Circle } from 'lucide-react'

/* ── Position / role definitions ── */
const POSITIONS = ['Marketing', 'Media', 'Engineer', 'Intern', 'Administration'] as const
type Position = typeof POSITIONS[number]

const POSITION_COLORS: Record<Position, { color: string; bg: string }> = {
  Marketing: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)' },
  Media: { color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.12)' },
  Engineer: { color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.12)' },
  Intern: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)' },
  Administration: { color: '#fb7185', bg: 'rgba(244, 63, 94, 0.12)' },
}

type RoleTask = { id: string; title: string; assigned: string; due: string; priority: 'HIGH' | 'MED' | 'LOW'; done: boolean }
type RoleProject = { id: string; name: string; status: string; statusColor: string; statusBg: string; due: string }

const ROLE_TASKS: Record<Position, RoleTask[]> = {
  Marketing: [
    { id: 'mk1', title: 'Draft Q2 social media calendar', assigned: 'Apr 10', due: 'Today, 5:00 PM', priority: 'HIGH', done: false },
    { id: 'mk2', title: 'Review Instagram analytics report', assigned: 'Apr 11', due: 'Tomorrow, 10:00 AM', priority: 'MED', done: false },
    { id: 'mk3', title: 'Create ad copy for podcast promo', assigned: 'Apr 8', due: 'Wed, Apr 15', priority: 'MED', done: true },
    { id: 'mk4', title: 'Update brand guidelines doc', assigned: 'Apr 9', due: 'Fri, Apr 17', priority: 'LOW', done: false },
    { id: 'mk5', title: 'Schedule newsletter send', assigned: 'Apr 12', due: 'Today, 3:00 PM', priority: 'HIGH', done: true },
  ],
  Media: [
    { id: 'md1', title: 'Edit podcast episode 14', assigned: 'Apr 11', due: 'Today, 6:00 PM', priority: 'HIGH', done: false },
    { id: 'md2', title: 'Color grade promo video', assigned: 'Apr 10', due: 'Tomorrow, 2:00 PM', priority: 'MED', done: false },
    { id: 'md3', title: 'Export stems for client review', assigned: 'Apr 12', due: 'Today, 4:00 PM', priority: 'HIGH', done: true },
    { id: 'md4', title: 'Upload B-roll to shared drive', assigned: 'Apr 9', due: 'Wed, Apr 15', priority: 'LOW', done: false },
  ],
  Engineer: [
    { id: 'en1', title: 'Mix session for Stanford project', assigned: 'Apr 11', due: 'Today, 5:00 PM', priority: 'HIGH', done: false },
    { id: 'en2', title: 'Master final tracks — Album Production', assigned: 'Apr 10', due: 'Tomorrow, 12:00 PM', priority: 'HIGH', done: false },
    { id: 'en3', title: 'Calibrate Studio A monitors', assigned: 'Apr 8', due: 'Wed, Apr 15', priority: 'MED', done: true },
    { id: 'en4', title: 'Backup session files to NAS', assigned: 'Apr 9', due: 'Fri, Apr 17', priority: 'LOW', done: false },
    { id: 'en5', title: 'Patch bay maintenance check', assigned: 'Apr 12', due: 'Today, 2:00 PM', priority: 'MED', done: true },
  ],
  Intern: [
    { id: 'in1', title: 'Shadow Jordan on mixing session', assigned: 'Apr 12', due: 'Today, 3:00 PM', priority: 'HIGH', done: false },
    { id: 'in2', title: 'Complete audio fundamentals module 3', assigned: 'Apr 7', due: 'Tomorrow, 5:00 PM', priority: 'MED', done: false },
    { id: 'in3', title: 'Organize sample library folders', assigned: 'Apr 8', due: 'Wed, Apr 15', priority: 'LOW', done: true },
    { id: 'in4', title: 'Submit weekly learning reflection', assigned: 'Apr 11', due: 'Fri, Apr 17', priority: 'MED', done: false },
    { id: 'in5', title: 'Prep studio for afternoon session', assigned: 'Apr 12', due: 'Today, 1:00 PM', priority: 'HIGH', done: true },
  ],
  Administration: [
    { id: 'ad1', title: 'Process invoices for March sessions', assigned: 'Apr 10', due: 'Today, 5:00 PM', priority: 'HIGH', done: false },
    { id: 'ad2', title: 'Update team availability calendar', assigned: 'Apr 11', due: 'Tomorrow, 9:00 AM', priority: 'MED', done: false },
    { id: 'ad3', title: 'File equipment receipts', assigned: 'Apr 8', due: 'Wed, Apr 15', priority: 'LOW', done: true },
    { id: 'ad4', title: 'Renew software licenses', assigned: 'Apr 9', due: 'Fri, Apr 17', priority: 'HIGH', done: false },
    { id: 'ad5', title: 'Order studio supplies', assigned: 'Apr 12', due: 'Today, 4:00 PM', priority: 'MED', done: true },
  ],
}

const ROLE_PROJECTS: Record<Position, RoleProject[]> = {
  Marketing: [
    { id: 'mp1', name: 'Q2 Campaign Launch', status: 'Active', statusColor: '#34d399', statusBg: 'rgba(16, 185, 129, 0.15)', due: 'May 1' },
    { id: 'mp2', name: 'Brand Refresh Assets', status: 'In Review', statusColor: '#fbbf24', statusBg: 'rgba(245, 158, 11, 0.15)', due: 'Apr 28' },
  ],
  Media: [
    { id: 'mdp1', name: 'Podcast Season 2 Edit', status: 'Active', statusColor: '#34d399', statusBg: 'rgba(16, 185, 129, 0.15)', due: 'Jun 1' },
    { id: 'mdp2', name: 'Promo Reel 2026', status: 'Editing', statusColor: '#a78bfa', statusBg: 'rgba(139, 92, 246, 0.15)', due: 'May 15' },
  ],
  Engineer: [
    { id: 'ep1', name: 'Album Production — Stanford', status: 'Recording', statusColor: '#38bdf8', statusBg: 'rgba(14, 165, 233, 0.15)', due: 'May 15' },
    { id: 'ep2', name: 'Studio B Renovation', status: 'Planning', statusColor: '#fbbf24', statusBg: 'rgba(245, 158, 11, 0.15)', due: 'Jun 30' },
  ],
  Intern: [
    { id: 'ip1', name: 'Audio Fundamentals Course', status: 'In Progress', statusColor: '#34d399', statusBg: 'rgba(16, 185, 129, 0.15)', due: 'May 30' },
    { id: 'ip2', name: 'Sample Library Organization', status: 'Active', statusColor: '#34d399', statusBg: 'rgba(16, 185, 129, 0.15)', due: 'Apr 25' },
  ],
  Administration: [
    { id: 'ap1', name: 'Q1 Financial Close', status: 'Active', statusColor: '#34d399', statusBg: 'rgba(16, 185, 129, 0.15)', due: 'Apr 20' },
    { id: 'ap2', name: 'Equipment Inventory Audit', status: 'Scheduled', statusColor: '#94a3b8', statusBg: 'rgba(148, 163, 184, 0.12)', due: 'May 5' },
  ],
}

/* ── Flywheel stages ── */
const STAGES = [
  { name: 'Deliver', subtitle: 'Client Fulfillment', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.5)', target: '95% on-time delivery' },
  { name: 'Capture', subtitle: 'Lead Capture Rate', color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.5)', target: '80% lead-to-session' },
  { name: 'Share', subtitle: 'Content Distribution', color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.5)', target: '3 posts/week' },
  { name: 'Attract', subtitle: 'Consult Demand', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.5)', target: '10 inquiries/month' },
  { name: 'Book', subtitle: 'Paid Sessions', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.5)', target: '20 sessions/month' },
] as const


/** Tiny SVG gauge meter — needle reacts to percentage */
function HealthGauge({ pct }: { pct: number }) {
  // Needle angle: 0% = -90° (far left/red), 100% = 90° (far right/green)
  const angle = -90 + (pct / 100) * 180
  return (
    <svg width="36" height="22" viewBox="0 0 60 34" fill="none" className="shrink-0">
      {/* Arc segments: Poor (red), Average (orange), Good (yellow-green), Excellent (green) */}
      <path d="M6 30 A24 24 0 0 1 15.1 10.1" stroke="#f87171" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M15.1 10.1 A24 24 0 0 1 30 6" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M30 6 A24 24 0 0 1 44.9 10.1" stroke="#a3e635" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M44.9 10.1 A24 24 0 0 1 54 30" stroke="#34d399" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Needle */}
      <g transform={`rotate(${angle}, 30, 30)`}>
        <line x1="30" y1="30" x2="30" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Center dot */}
      <circle cx="30" cy="30" r="3" fill="white" />
    </svg>
  )
}

function PriorityBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { HIGH: 'bg-red-500/15 text-red-400', MED: 'bg-amber-500/15 text-amber-400', LOW: 'bg-emerald-500/15 text-emerald-400' }
  return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colors[level] ?? colors.LOW}`}>{level}</span>
}

const TIME_FILTERS = ['Total', 'Year', 'Month', 'Week', 'Day'] as const

function RoleTaskList() {
  const [activePos, setActivePos] = useState<Position>('Marketing')
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())
  const [detailTask, setDetailTask] = useState<RoleTask | null>(null)
  const [roleTimeFilter, setRoleTimeFilter] = useState('Week')

  const posColor = POSITION_COLORS[activePos]
  const roleTasks = ROLE_TASKS[activePos]
  const roleProjects = ROLE_PROJECTS[activePos]

  const hasPending = pendingIds.size > 0

  const togglePending = (id: string) => {
    setPendingIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submitCompleted = () => {
    setSubmittedIds(prev => {
      const next = new Set(prev)
      pendingIds.forEach(id => next.add(id))
      return next
    })
    setPendingIds(new Set())
  }

  // Sort: incomplete first, submitted/done at bottom
  const sorted = [...roleTasks].sort((a, b) => {
    const aD = a.done || submittedIds.has(a.id)
    const bD = b.done || submittedIds.has(b.id)
    return aD === bD ? 0 : aD ? 1 : -1
  })

  const doneCount = roleTasks.filter(t => t.done || submittedIds.has(t.id)).length
  const totalCount = roleTasks.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Top bar: title + time filter (same layout as Flywheel KPIs) */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text">Task List by Position</h2>
          <div className="flex gap-1 bg-surface-alt/50 p-1 rounded-xl border border-border">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf}
                onClick={() => setRoleTimeFilter(tf)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  roleTimeFilter === tf
                    ? 'bg-gold text-black shadow-sm'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        {/* Position tabs + stats + submit */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {POSITIONS.map((pos) => {
              const active = activePos === pos
              return (
                <button
                  key={pos}
                  onClick={() => { setActivePos(pos); setPendingIds(new Set()); setSubmittedIds(new Set()); setDetailTask(null) }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-gold/10 text-gold border-gold/30 shadow-sm'
                      : 'bg-surface-alt text-text-muted border-border hover:text-text hover:border-border-light'
                  }`}
                >
                  {pos}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-text-muted">{doneCount}/{totalCount} complete · {pct}%</span>
            <button
              onClick={submitCompleted}
              disabled={!hasPending}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                hasPending
                  ? 'bg-gold text-black hover:bg-gold-muted shadow-md shadow-gold/20 animate-pulse-gold'
                  : 'bg-surface-alt text-text-light cursor-not-allowed border border-border'
              }`}
            >
              <Send size={12} />
              Submit {hasPending ? `(${pendingIds.size})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Tasks + Projects grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/30">
        {/* Tasks (2/3) */}
        <div className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Tasks</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: posColor.color }} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: posColor.color }}>{pct}%</span>
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 pb-2 border-b border-border/30 mb-1">
            <div className="w-5 shrink-0" />
            <span className="flex-1 text-[10px] font-semibold text-text-muted uppercase tracking-wide">Task</span>
            <span className="w-16 text-[10px] font-semibold text-text-muted uppercase tracking-wide text-center">Assigned</span>
            <span className="w-20 text-[10px] font-semibold text-text-muted uppercase tracking-wide text-center">Due</span>
            <span className="w-12 text-[10px] font-semibold text-text-muted uppercase tracking-wide text-center">Priority</span>
          </div>

          <div className="space-y-0.5">
            {sorted.map((task) => {
              const isSubmitted = submittedIds.has(task.id)
              const isDone = task.done || isSubmitted
              const isPending = pendingIds.has(task.id)
              const isChecked = isDone || isPending
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isDone ? 'opacity-40' : isPending ? 'bg-gold/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Checkbox — click to toggle pending */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!isDone) togglePending(task.id) }}
                    disabled={isDone}
                    className="shrink-0"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-emerald-500/30 border-emerald-500/50'
                          : isPending
                            ? 'border-gold bg-gold/20'
                            : 'border-border-light hover:border-gold/50'
                      }`}
                    >
                      {isChecked && <Check size={12} className={isDone ? 'text-emerald-400' : 'text-gold'} />}
                    </div>
                  </button>

                  {/* Task name — click to open detail */}
                  <button
                    onClick={() => setDetailTask(task)}
                    className={`flex-1 text-left text-sm font-medium truncate transition-colors ${
                      isDone ? 'line-through text-text-light' : 'text-text hover:text-gold'
                    }`}
                  >
                    {task.title}
                  </button>

                  {/* Assigned */}
                  <span className="w-16 text-center text-[10px] text-text-muted">{task.assigned}</span>

                  {/* Due */}
                  <span className="w-20 text-center text-[10px] text-text-muted flex items-center justify-center gap-1">
                    <Clock size={9} />{task.due.split(',')[0]}
                  </span>

                  {/* Priority */}
                  <span className="w-12 flex justify-center">
                    <PriorityBadge level={task.priority} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel: Projects or Task Detail */}
        <div className="p-5">
          {detailTask ? (
            /* Task Detail View */
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Task Detail</p>
                <button onClick={() => setDetailTask(null)} className="text-[10px] text-gold font-medium hover:underline">Back to Projects</button>
              </div>
              <div className="bg-surface-alt rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-sm font-bold text-text">{detailTask.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Position</span>
                    <span className="text-[11px] font-semibold" style={{ color: posColor.color }}>{activePos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Assigned</span>
                    <span className="text-[11px] text-text">{detailTask.assigned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Due</span>
                    <span className="text-[11px] text-text">{detailTask.due}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Priority</span>
                    <PriorityBadge level={detailTask.priority} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">Status</span>
                    <span className={`text-[11px] font-semibold ${
                      detailTask.done || submittedIds.has(detailTask.id) ? 'text-emerald-400' : pendingIds.has(detailTask.id) ? 'text-gold' : 'text-text-muted'
                    }`}>
                      {detailTask.done || submittedIds.has(detailTask.id) ? 'Completed' : pendingIds.has(detailTask.id) ? 'Pending Submit' : 'Open'}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-xs text-text-light italic">No notes yet. Notes will appear here when connected to the database.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Projects View */
            <>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Projects</p>
              <div className="space-y-3">
                {roleProjects.map((proj) => (
                  <div key={proj.id} className="bg-surface-alt rounded-xl border border-border p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-text">{proj.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color: proj.statusColor, backgroundColor: proj.statusBg, borderColor: proj.statusColor + '40' }}
                      >
                        {proj.status}
                      </span>
                      <span className="text-[10px] text-text-muted">Due {proj.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Due Today / Upcoming tasks for signed-in user (Marketing mock) ── */
const MY_DUE_TODAY = [
  { id: 'my1', title: 'Draft Q2 social media calendar', due: '5:00 PM', priority: 'HIGH' as const, done: false },
  { id: 'my2', title: 'Schedule newsletter send', due: '3:00 PM', priority: 'HIGH' as const, done: false },
  { id: 'my3', title: 'Respond to influencer DMs', due: '12:00 PM', priority: 'MED' as const, done: true },
  { id: 'my4', title: 'Post session highlight reel', due: '6:00 PM', priority: 'MED' as const, done: false },
]

const MY_UPCOMING = [
  { id: 'up1', title: 'Review Instagram analytics report', due: 'Tomorrow, 10:00 AM', priority: 'MED' as const, done: false },
  { id: 'up2', title: 'Create ad copy for podcast promo', due: 'Wed, Apr 15', priority: 'MED' as const, done: false },
  { id: 'up3', title: 'Update brand guidelines doc', due: 'Fri, Apr 17', priority: 'LOW' as const, done: false },
  { id: 'up4', title: 'Plan May content calendar', due: 'Mon, Apr 21', priority: 'LOW' as const, done: false },
  { id: 'up5', title: 'Q2 campaign launch prep', due: 'Thu, May 1', priority: 'HIGH' as const, done: false },
]

function MyTasksBox() {
  const [tab, setTab] = useState<'today' | 'upcoming'>('today')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())
  const [showCreateTask, setShowCreateTask] = useState(false)

  const items = tab === 'today' ? MY_DUE_TODAY : MY_UPCOMING
  const hasPending = checkedIds.size > 0

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const submitChecked = () => {
    setSubmittedIds(prev => { const n = new Set(prev); checkedIds.forEach(id => n.add(id)); return n })
    setCheckedIds(new Set())
  }

  const sorted = [...items].sort((a, b) => {
    const aD = a.done || submittedIds.has(a.id); const bD = b.done || submittedIds.has(b.id)
    return aD === bD ? 0 : aD ? 1 : -1
  })

  return (
    <div className="bg-surface rounded-2xl border border-border p-5">
      {showCreateTask && <CreateTaskModal onClose={() => setShowCreateTask(false)} />}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text">My Tasks</h2>
          <div className="flex gap-1 bg-surface-alt/50 p-0.5 rounded-lg border border-border">
            <button onClick={() => setTab('today')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${tab === 'today' ? 'bg-gold text-black shadow-sm' : 'text-text-muted hover:text-text'}`}>Due Today</button>
            <button onClick={() => setTab('upcoming')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${tab === 'upcoming' ? 'bg-gold text-black shadow-sm' : 'text-text-muted hover:text-text'}`}>Upcoming</button>
          </div>
          <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-1 text-xs text-gold font-medium hover:underline"><Plus size={12} />Create Task</button>
        </div>
        <button
          onClick={submitChecked}
          disabled={!hasPending}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            hasPending ? 'bg-gold text-black hover:bg-gold-muted shadow-md shadow-gold/20 animate-pulse-gold' : 'bg-surface-alt text-text-light cursor-not-allowed border border-border'
          }`}
        >
          <Send size={12} />
          Submit {hasPending ? `(${checkedIds.size})` : ''}
        </button>
      </div>
      <div className="space-y-1">
        {sorted.map((task) => {
          const isDone = task.done || submittedIds.has(task.id)
          const isPending = checkedIds.has(task.id)
          const isChecked = isDone || isPending
          return (
            <div key={task.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isDone ? 'opacity-40' : isPending ? 'bg-gold/[0.04]' : 'hover:bg-white/[0.02]'}`}>
              <button onClick={() => !isDone && toggleCheck(task.id)} disabled={isDone} className="shrink-0">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500/30 border-emerald-500/50' : isPending ? 'border-gold bg-gold/20' : 'border-border-light hover:border-gold/50'}`}>
                  {isChecked && <Check size={12} className={isDone ? 'text-emerald-400' : 'text-gold'} />}
                </div>
              </button>
              <span className={`flex-1 text-sm ${isDone ? 'line-through text-text-light' : 'text-text'}`}>{task.title}</span>
              <span className="text-[10px] text-text-muted flex items-center gap-1 shrink-0"><Clock size={9} />{task.due}</span>
              <PriorityBadge level={task.priority} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Team Projects ── */
const TEAM_PROJECTS = [
  { id: 'tp1', name: 'Album Production — Stanford Music', lead: 'Jordan Lee', tags: [{ label: 'Recording', color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.15)' }, { label: 'Active', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' }], due: 'May 15', progress: 65 },
  { id: 'tp2', name: 'Podcast Series Edit — Aprt Media', lead: 'Sam Rivera', tags: [{ label: 'Editing', color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.15)' }, { label: 'Paused', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.15)' }], due: 'Jun 1', progress: 30 },
  { id: 'tp3', name: 'Q2 Marketing Campaign', lead: 'Alex Kim', tags: [{ label: 'Marketing', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' }, { label: 'Active', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' }], due: 'May 1', progress: 80 },
  { id: 'tp4', name: 'Studio B Renovation', lead: 'Taylor Morgan', tags: [{ label: 'Planning', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' }], due: 'Jun 30', progress: 15 },
]

/* ── Maintenance / optional daily tasks ── */
const MAINTENANCE_TASKS = [
  { id: 'mt1', title: 'Organize desktop and downloads folder', done: false },
  { id: 'mt2', title: 'Clear and sort email inbox', done: false },
  { id: 'mt3', title: 'Review and update task notes', done: false },
  { id: 'mt4', title: 'Check team comms for unread messages', done: false },
  { id: 'mt5', title: 'Back up current session files', done: false },
  { id: 'mt6', title: 'Tidy shared drive folders', done: false },
  { id: 'mt7', title: 'Review platform notifications', done: false },
  { id: 'mt8', title: 'Update personal availability calendar', done: false },
]

function MaintenanceBox() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())
  const hasPending = checkedIds.size > 0

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const submitChecked = () => {
    setSubmittedIds(prev => { const n = new Set(prev); checkedIds.forEach(id => n.add(id)); return n })
    setCheckedIds(new Set())
  }

  const sorted = [...MAINTENANCE_TASKS].sort((a, b) => {
    const aD = a.done || submittedIds.has(a.id); const bD = b.done || submittedIds.has(b.id)
    return aD === bD ? 0 : aD ? 1 : -1
  })

  const doneCount = MAINTENANCE_TASKS.filter(t => t.done || submittedIds.has(t.id)).length
  const totalCount = MAINTENANCE_TASKS.length

  return (
    <div className="bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-text">Maintenance & Organization</h2>
        <button
          onClick={submitChecked}
          disabled={!hasPending}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            hasPending ? 'bg-gold text-black hover:bg-gold-muted shadow-md shadow-gold/20 animate-pulse-gold' : 'bg-surface-alt text-text-light cursor-not-allowed border border-border'
          }`}
        >
          <Send size={12} />
          Submit {hasPending ? `(${checkedIds.size})` : ''}
        </button>
      </div>
      <p className="text-[11px] text-text-muted mb-4">Optional daily tasks for downtime or in-between time. {doneCount}/{totalCount} done.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {sorted.map((task) => {
          const isDone = task.done || submittedIds.has(task.id)
          const isPending = checkedIds.has(task.id)
          const isChecked = isDone || isPending
          return (
            <button
              key={task.id}
              onClick={() => !isDone && toggleCheck(task.id)}
              disabled={isDone}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${isDone ? 'opacity-40' : isPending ? 'bg-gold/[0.04]' : 'hover:bg-white/[0.02]'}`}
            >
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500/30 border-emerald-500/50' : isPending ? 'border-gold bg-gold/20' : 'border-border-light hover:border-gold/50'}`}>
                {isChecked && <Check size={10} className={isDone ? 'text-emerald-400' : 'text-gold'} />}
              </div>
              <span className={`text-sm ${isDone ? 'line-through text-text-light' : 'text-text-muted'}`}>{task.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StatusTag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ color, backgroundColor: bg, borderColor: color + '40' }}>
      {label}
    </span>
  )
}

export default function DailyChecklist() {
  useDocumentTitle('Tasks - Checkmark Audio')
  const { tasks, pendingIds, togglePending, submitPending, hasPending } = useTasks()
  const [selectedStage, setSelectedStage] = useState('Deliver')
  const [timeFilter, setTimeFilter] = useState<'total' | 'year' | 'month' | 'week' | 'day'>('week')

  // Compute per-stage stats
  const stageStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number; pct: number }> = {}
    for (const stage of STAGES) {
      const stageTasks = tasks.filter(t => t.stage === stage.name)
      const done = stageTasks.filter(t => t.completed).length
      const total = stageTasks.length
      stats[stage.name] = { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
    }
    return stats
  }, [tasks])

  const totalTasks = tasks.length
  const totalDone = tasks.filter(t => t.completed).length

  // Find best and weakest stages
  const sortedStages = [...STAGES].sort((a, b) => (stageStats[b.name]?.pct ?? 0) - (stageStats[a.name]?.pct ?? 0))
  const bestStage = sortedStages[0]?.name ?? 'Deliver'
  const weakStage = sortedStages[sortedStages.length - 1]?.name ?? 'Attract'

  // Health label + color (4-tier: Low=red, Average=orange, Good=yellow-green, Excellent=green)
  const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
  const healthLevel = overallPct >= 85 ? 'Excellent' : overallPct >= 65 ? 'Good' : overallPct >= 40 ? 'Average' : 'Low'
  const HEALTH_STYLES: Record<string, { color: string; bg: string; border: string }> = {
    Excellent: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
    Good:      { color: '#a3e635', bg: 'rgba(163, 230, 53, 0.12)', border: 'rgba(163, 230, 53, 0.35)' },
    Average:   { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.35)' },
    Low:       { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' },
  }
  const healthStyle = HEALTH_STYLES[healthLevel]

  // Stage color lookup helper
  const stageColor = (name: string) => STAGES.find(s => s.name === name)?.color ?? '#C9A84C'

  // Selected stage data
  const stage = STAGES.find(s => s.name === selectedStage) ?? STAGES[0]
  const stageTasks = tasks.filter(t => t.stage === selectedStage)
  const sortedStageTasks = [...stageTasks].sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1)
  const stats = stageStats[selectedStage] ?? { total: 0, done: 0, pct: 0 }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* ── My Tasks (Due Today / Upcoming) ── */}
      <MyTasksBox />

      {/* ── Flywheel Task Tracker (merged header + KPIs) ── */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        {/* Header row: title + stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold mb-1">Checkmark Audio KPI System</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-text">Flywheel Task Tracker</h1>
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="bg-surface-alt rounded-xl border border-border px-3.5 py-2.5 min-w-[130px]">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Tasks Completed</p>
              <p className="text-sm font-bold text-text mt-0.5">{totalDone} / {totalTasks}</p>
            </div>
            <div className="bg-surface-alt rounded-xl border border-border px-3.5 py-2.5 min-w-[130px]">
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">KPI Health</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border" style={{ color: healthStyle.color, backgroundColor: healthStyle.bg, borderColor: healthStyle.border }}>{healthLevel}</span>
                <span className="text-xs font-semibold" style={{ color: healthStyle.color }}>{overallPct}%</span>
                <HealthGauge pct={overallPct} />
              </div>
            </div>
            <div className="bg-surface-alt rounded-xl border border-border px-3.5 py-2.5 min-w-[130px]">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Best Stage</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: stageColor(bestStage) }}>{bestStage}</p>
            </div>
            <div className="bg-surface-alt rounded-xl border border-border px-3.5 py-2.5 min-w-[130px]">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Needs Attention</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: stageColor(weakStage) }}>{weakStage}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 pt-5">
          {/* Time filter row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Flywheel KPIs</p>
            <div className="flex gap-1 bg-surface-alt/50 p-1 rounded-xl border border-border">
              {([
                { key: 'total' as const, label: 'Total' },
                { key: 'year' as const, label: 'Year' },
                { key: 'month' as const, label: 'Month' },
                { key: 'week' as const, label: 'Week' },
                { key: 'day' as const, label: 'Day' },
              ]).map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeFilter(tf.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    timeFilter === tf.key
                      ? 'bg-gold text-black shadow-sm'
                      : 'text-text-muted hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

        <div className="space-y-4">
            {/* Stage chips grid */}
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-2.5">
              {STAGES.map((s) => {
                const st = stageStats[s.name] ?? { pct: 0 }
                const active = selectedStage === s.name
                return (
                  <button
                    key={s.name}
                    onClick={() => setSelectedStage(s.name)}
                    className={`relative rounded-xl border-2 p-3.5 text-left transition-all ${
                      active ? 'shadow-lg scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      backgroundColor: active ? s.bg : 'rgba(20,20,22,0.8)',
                      borderColor: active ? s.color : 'rgba(42,42,42,0.8)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold" style={{ color: s.color }}>{s.name}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{s.subtitle}</p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2"
                        style={{
                          borderColor: s.color + '60',
                          backgroundColor: s.color + '15',
                          color: s.color,
                        }}
                      >
                        {st.pct}%
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected stage detail panel */}
            <div className="bg-surface-alt rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">Selected Stage</p>
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                  style={{ color: stage.color, borderColor: stage.color, backgroundColor: stage.bg }}
                >
                  Live KPI Component
                </span>
              </div>
              <h2 className="text-2xl font-bold text-text">{stage.name}</h2>
              <p className="text-sm text-text-muted mt-0.5">KPI: {stage.subtitle}</p>
              <p className="text-sm text-text-muted">Target: {stage.target}</p>

              {/* Progress bar */}
              <div className="mt-4 mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-text-muted">Progress toward target</p>
                  <p className="text-sm font-bold text-text">{stats.pct}%</p>
                </div>
                <div className="h-2.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${stats.pct}%`, backgroundColor: stage.color }}
                  />
                </div>
              </div>

              {/* Task list */}
              <div className="space-y-2">
                {sortedStageTasks.map((task) => {
                  const isPending = pendingIds.has(task.id)
                  const isChecked = task.completed || isPending
                  return (
                    <button
                      key={task.id}
                      onClick={() => !task.completed && togglePending(task.id)}
                      disabled={task.completed}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        task.completed
                          ? 'border-gold/15 bg-gold/[0.04] opacity-50'
                          : isPending
                            ? 'border-gold/30 bg-gold/[0.06]'
                            : 'border-border bg-surface hover:border-border-light'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          task.completed
                            ? 'bg-gold border-gold'
                            : isPending
                              ? 'bg-gold/20 border-gold'
                              : 'border-border-light'
                        }`}
                      >
                        {isChecked && <Check size={13} className={task.completed ? 'text-black' : 'text-gold'} />}
                      </div>
                      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-text-light' : 'text-text'}`}>
                        {task.title}
                      </span>
                      <span className="text-[11px] text-text-muted shrink-0">Tap to update</span>
                    </button>
                  )
                })}
                {stageTasks.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">No tasks in this stage yet.</p>
                )}
              </div>

              {/* Submit button */}
              {hasPending && (
                <button
                  onClick={submitPending}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold text-black font-semibold text-sm hover:bg-gold-muted transition-all shadow-lg shadow-gold/20 animate-pulse-gold"
                >
                  <Send size={14} />
                  Submit {pendingIds.size} completed task{pendingIds.size > 1 ? 's' : ''}
                </button>
              )}
            </div>

        </div>
        </div>
      </div>

      {/* ── Task List by Position ── */}
      <RoleTaskList />

      {/* ── Team Projects ── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Team Projects</h2>
          <p className="text-[11px] text-text-muted mt-0.5">Active company-wide projects across all departments.</p>
        </div>
        <div className="divide-y divide-border/30">
          {TEAM_PROJECTS.map((proj) => (
            <div key={proj.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{proj.name}</p>
                <p className="text-[11px] text-text-muted mt-0.5">Lead: {proj.lead}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex gap-1.5">
                  {proj.tags.map((tag) => <StatusTag key={tag.label} {...tag} />)}
                </div>
                <div className="flex items-center gap-2 w-24">
                  <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${proj.progress}%`, backgroundColor: proj.progress >= 70 ? '#34d399' : proj.progress >= 40 ? '#fbbf24' : '#fb923c' }} />
                  </div>
                  <span className="text-[10px] text-text-muted font-semibold">{proj.progress}%</span>
                </div>
                <span className="text-[10px] text-text-muted">Due {proj.due}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Maintenance & Organization ── */}
      <MaintenanceBox />
    </div>
  )
}
