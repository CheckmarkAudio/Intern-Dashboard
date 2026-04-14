import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTasks } from '../contexts/TaskContext'
import CreateTaskModal from '../components/CreateTaskModal'
import {
  ChevronRight, Instagram, Music2, Youtube,
  Clock, Check, Calendar as CalendarIcon, Send, Plus,
} from 'lucide-react'

/* ── Social platform icons (match mockup colors) ── */
const platforms = [
  { name: 'Instagram', icon: Instagram, color: '#E1306C', bg: 'rgba(225, 48, 108, 0.12)', followers: '128.4K', asOf: 'As of Apr 9, 2026' },
  { name: 'TikTok', icon: Music2, color: '#ffffff', bg: 'rgba(255, 255, 255, 0.08)', followers: '128.4K', asOf: 'As of Apr 9, 2026' },
  { name: 'YouTube', icon: Youtube, color: '#FF0000', bg: 'rgba(255, 0, 0, 0.12)', followers: '128.4K', asOf: 'As of Apr 9, 2026' },
]

/* ── Team snapshot (placeholder) ── */
const teamMembers = [
  { id: 'jordan', name: 'Jordan Lee', role: 'Lead Engineer', contact: 'jordan@checkmar...' },
  { id: 'sam', name: 'Sam Rivera', role: 'Audio Intern', contact: 'sam@checkmark...' },
  { id: 'alex', name: 'Alex Kim', role: 'Marketing', contact: 'alex@checkmark...' },
  { id: 'taylor', name: 'Taylor Morgan', role: 'Operations', contact: 'taylor@checkmark...' },
  { id: 'taylor2', name: 'Taylor Morganson', role: 'Operations', contact: 'taylor@checkmark...' },
]

/* ── Today's agenda (placeholder) ── */
const todayEvents = [
  { time: '9:00 AM', title: 'Email and inbox review', color: '#C9A84C' },
  { time: '10:30 AM', title: 'Content breakdown', color: '#38bdf8' },
  { time: '1:00 PM', title: 'Walk', color: '#a78bfa' },
  { time: '3:00 PM', title: 'Metrics discussion', color: '#34d399' },
]

function PriorityBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    HIGH: 'bg-red-500/15 text-red-400',
    MED: 'bg-amber-500/15 text-amber-400',
    LOW: 'bg-emerald-500/15 text-emerald-400',
  }
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colors[level] ?? colors.LOW}`}>
      {level}
    </span>
  )
}

export default function Dashboard() {
  useDocumentTitle('Overview - Checkmark Audio')
  const { tasks, pendingIds, togglePending, submitPending, hasPending } = useTasks()
  const [showCreateTask, setShowCreateTask] = useState(false)

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // Sort: incomplete first, completed at bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return 0
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-xs text-text-muted mt-0.5">Dashboard v5.2 Revision</p>
      </div>

      {/* Top row: Upcoming Tasks (left, 2/3) + Platform Snapshot (right, 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Tasks — big left column with checkboxes */}
        {showCreateTask && <CreateTaskModal onClose={() => setShowCreateTask(false)} />}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to="/daily" className="flex items-center gap-1.5 group">
                <h2 className="text-sm font-semibold text-text group-hover:text-gold transition-colors">Upcoming Tasks</h2>
                <ChevronRight size={14} className="text-text-muted group-hover:text-gold transition-colors" />
              </Link>
              <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-1 text-xs text-gold font-medium hover:underline"><Plus size={12} />Add Task</button>
            </div>
            {/* Submit button — lights up when tasks are checked */}
            <button
              onClick={submitPending}
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

          <div className="space-y-1">
            {sortedTasks.map((task) => {
              const isPending = pendingIds.has(task.id)
              const isChecked = task.completed || isPending
              return (
                <button
                  key={task.id}
                  onClick={() => !task.completed && togglePending(task.id)}
                  disabled={task.completed}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    task.completed
                      ? 'opacity-40'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      task.completed
                        ? 'bg-emerald-500/30 border-emerald-500/50'
                        : isPending
                          ? 'bg-gold/20 border-gold'
                          : 'border-border-light hover:border-gold/50'
                    }`}
                  >
                    {isChecked && <Check size={13} className={task.completed ? 'text-emerald-400' : 'text-gold'} />}
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${task.completed ? 'line-through text-text-light' : 'text-text'}`}>
                        {task.title}
                      </span>
                      <PriorityBadge level={task.priority} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={9} />
                        {task.due}
                      </span>
                      <span>{task.assignee}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                        style={{ color: task.stageColor, backgroundColor: task.stageColor + '18' }}
                      >
                        {task.stage}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Platform Snapshot — compact right column */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text mb-4">Platform snapshot</h2>
          <div className="space-y-3">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt px-3 py-2.5"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.bg }}
                >
                  <p.icon size={16} style={{ color: p.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">{p.followers}</p>
                  <p className="text-[9px] text-text-light">{p.name}</p>
                </div>
                <p className="text-[9px] text-text-light shrink-0">{p.asOf}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Team Snapshot + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Team Snapshot */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text">Team snapshot</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Name</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Role</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {teamMembers.map((m) => (
                  <tr key={m.id}>
                    <td colSpan={3} className="p-0">
                      <Link to="/admin/my-team" className="flex hover:bg-white/[0.04] transition-colors">
                        <span className="px-5 py-3 text-text font-medium flex-1 basis-1/3">{m.name}</span>
                        <span className="px-5 py-3 text-text-muted flex-1 basis-1/3">{m.role}</span>
                        <span className="px-5 py-3 text-text-muted flex-1 basis-1/3 flex items-center justify-between">
                          {m.contact}
                          <ChevronRight size={12} className="text-text-light" />
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <Link to="/calendar" className="flex items-center gap-1.5 group mb-0.5">
            <CalendarIcon size={15} className="text-gold" />
            <h2 className="text-sm font-semibold text-text group-hover:text-gold transition-colors">Calendar</h2>
            <ChevronRight size={14} className="text-text-muted group-hover:text-gold transition-colors" />
          </Link>
          <p className="text-[11px] text-text-muted mb-0.5">Today</p>
          <p className="text-xs text-text-light mb-4">{dateStr}</p>

          <div className="space-y-3">
            {todayEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center gap-2 shrink-0 w-[72px]">
                  <Clock size={12} className="text-text-light" />
                  <span className="text-[11px] text-text-muted font-medium">{event.time}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-full min-h-[16px] rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                  <span className="text-sm text-text">{event.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
