import { useMemo, useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTasks } from '../contexts/TaskContext'
import { ChevronLeft, ChevronRight, ChevronDown, Clock, CheckSquare, Briefcase } from 'lucide-react'

/* ── Event colors ── */
const EVENT_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  deliver:  { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  capture:  { color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)' },
  share:    { color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)' },
  attract:  { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
  book:     { color: '#fb7185', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' },
  focus:    { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.10)', border: 'rgba(148, 163, 184, 0.25)' },
  task:     { color: '#C9A84C', bg: 'rgba(201, 168, 76, 0.10)', border: 'rgba(201, 168, 76, 0.3)' },
}

type DayItem = {
  label: string
  time?: string
  type: 'booking' | 'task'
  stage: string
}

/* ── Week dates for Apr 7–13, 2026 ── */
const WEEK_DATES = [
  { day: 'Monday', date: 'Apr 7', dateKey: '2026-04-07' },
  { day: 'Tuesday', date: 'Apr 8', dateKey: '2026-04-08' },
  { day: 'Wednesday', date: 'Apr 9', dateKey: '2026-04-09' },
  { day: 'Thursday', date: 'Apr 10', dateKey: '2026-04-10' },
  { day: 'Friday', date: 'Apr 11', dateKey: '2026-04-11' },
  { day: 'Saturday', date: 'Apr 12', dateKey: '2026-04-12' },
  { day: 'Sunday', date: 'Apr 13', dateKey: '2026-04-13' },
]

/* ── Mini month calendar (April 2026) ── */
const APRIL_2026 = { year: 2026, month: 'April 2026', startDay: 2, days: 30 }

const LEGEND = [
  { label: 'Booking', type: 'book' },
  { label: 'Task', type: 'task' },
  { label: 'Deliver', type: 'deliver' },
  { label: 'Capture', type: 'capture' },
  { label: 'Share', type: 'share' },
  { label: 'Attract', type: 'attract' },
]

function WeekDayList({ weekItems }: { weekItems: Record<string, DayItem[]> }) {
  // All days expanded by default
  const [expanded, setExpanded] = useState<Set<string>>(new Set(WEEK_DATES.map(w => w.dateKey)))

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="divide-y divide-border/30">
      {WEEK_DATES.map((wd) => {
        const dayItems = weekItems[wd.dateKey] ?? []
        const isToday = wd.dateKey === '2026-04-13'
        const isOpen = expanded.has(wd.dateKey)
        const bookingCount = dayItems.filter(i => i.type === 'booking').length
        const taskCount = dayItems.filter(i => i.type === 'task').length

        return (
          <div key={wd.dateKey}>
            {/* Clickable day header row */}
            <button
              onClick={() => toggle(wd.dateKey)}
              className={`w-full flex items-center gap-2.5 px-5 py-3 text-left transition-colors ${isToday ? 'bg-gold/[0.03]' : 'hover:bg-white/[0.02]'}`}
            >
              <ChevronDown size={12} className={`text-text-muted transition-transform shrink-0 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
              <span className={`text-sm font-bold ${isToday ? 'text-gold' : 'text-text'}`}>{wd.day}</span>
              <span className={`text-xs ${isToday ? 'text-gold' : 'text-text-muted'}`}>{wd.date}</span>
              {isToday && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">Today</span>}
              {/* Compact summary when collapsed */}
              <div className="ml-auto flex items-center gap-2">
                {bookingCount > 0 && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: EVENT_COLORS.book.color, backgroundColor: EVENT_COLORS.book.bg }}>
                    {bookingCount} booking{bookingCount > 1 ? 's' : ''}
                  </span>
                )}
                {taskCount > 0 && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: EVENT_COLORS.task.color, backgroundColor: EVENT_COLORS.task.bg }}>
                    {taskCount} task{taskCount > 1 ? 's' : ''}
                  </span>
                )}
                {dayItems.length === 0 && <span className="text-[10px] text-text-light italic">Free</span>}
              </div>
            </button>

            {/* Expanded items */}
            {isOpen && dayItems.length > 0 && (
              <div className={`px-5 pb-3 space-y-1 ${isToday ? 'bg-gold/[0.03]' : ''}`}>
                {dayItems.map((item, i) => {
                  const style = EVENT_COLORS[item.stage] ?? EVENT_COLORS[item.type === 'booking' ? 'book' : 'task']
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-sm `}
                      style={{ backgroundColor: style.bg, borderColor: style.border }}
                    >
                      <div className="shrink-0" style={{ color: style.color }}>
                        {item.type === 'booking' ? <Briefcase size={12} /> : <CheckSquare size={12} />}
                      </div>
                      <span className={`flex-1 truncate text-text`}>{item.label}</span>
                      {item.time && <span className="text-[9px] text-text-muted shrink-0">{item.time}</span>}
                      <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded shrink-0" style={{ color: style.color }}>{item.type === 'booking' ? 'Book' : item.stage}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Calendar() {
  useDocumentTitle('Calendar - Checkmark Audio')
  const { bookings, tasks } = useTasks()
  const [view, setView] = useState<'my' | 'team'>('my')

  // Build day-by-day items for the week (bookings + tasks)
  const weekItems = useMemo(() => {
    const items: Record<string, DayItem[]> = {}
    for (const wd of WEEK_DATES) {
      items[wd.dateKey] = []
    }

    // Add bookings
    for (const b of bookings) {
      if (items[b.date]) {
        items[b.date].push({
          label: `${b.client} — ${b.description}`,
          time: `${b.startTime} – ${b.endTime}`,
          type: 'booking',
          stage: 'book',
        })
      }
    }

    // Add incomplete tasks only (map "Today" / "Tomorrow" style dates to actual dateKeys)
    for (const t of tasks) {
      if (t.completed) continue // skip completed tasks
      const dueLower = t.due.toLowerCase()
      let dateKey = ''
      if (dueLower.includes('today')) dateKey = '2026-04-13'
      else if (dueLower.includes('tomorrow')) dateKey = '2026-04-14'
      else if (dueLower.includes('apr 15') || dueLower.includes('wed')) dateKey = '2026-04-09'
      else if (dueLower.includes('apr 16') || dueLower.includes('thu')) dateKey = '2026-04-10'
      else if (dueLower.includes('apr 17') || dueLower.includes('fri')) dateKey = '2026-04-11'

      if (items[dateKey]) {
        items[dateKey].push({
          label: t.title,
          time: t.due.split(',')[1]?.trim(),
          type: 'task',
          stage: t.stage.toLowerCase(),
        })
      }
    }

    return items
  }, [bookings, tasks])

  // Build booking-only events for the monthly view
  const monthBookings = useMemo(() => {
    const byDay: Record<number, { label: string; time: string }[]> = {}
    for (const b of bookings) {
      try {
        const d = new Date(b.date + 'T00:00:00')
        if (d.getMonth() !== 3 || d.getFullYear() !== 2026) continue // April only
        const day = d.getDate()
        if (!byDay[day]) byDay[day] = []
        byDay[day].push({ label: b.client, time: `${b.startTime}–${b.endTime}` })
      } catch { /* skip */ }
    }
    return byDay
  }, [bookings])

  // Generate mini calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < APRIL_2026.startDay; i++) calendarDays.push(null)
  for (let d = 1; d <= APRIL_2026.days; d++) calendarDays.push(d)
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-xs text-text-muted mt-0.5">Weekly schedule, focus areas, and bookings at a glance.</p>
      </div>

      {/* This week — day-by-day descending list */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-text">This week</h2>
            <div className="flex items-center gap-1.5 text-text-muted">
              <button className="p-1 rounded hover:bg-surface-hover transition-colors"><ChevronLeft size={14} /></button>
              <span className="text-xs font-medium text-gold">Today</span>
              <button className="p-1 rounded hover:bg-surface-hover transition-colors"><ChevronRight size={14} /></button>
            </div>
            <span className="text-xs text-text-muted">Apr 7 – Apr 13, 2026</span>
          </div>
          <div className="flex gap-1 bg-surface-alt/50 p-0.5 rounded-lg border border-border">
            <button onClick={() => setView('my')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'my' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}`}>My week</button>
            <button onClick={() => setView('team')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'team' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}`}>Team</button>
          </div>
        </div>

        {/* Day-by-day collapsible list */}
        <WeekDayList weekItems={weekItems} />

        {/* Legend */}
        <div className="px-5 py-3 border-t border-border flex items-center gap-4 flex-wrap">
          {LEGEND.map((item) => {
            const style = EVENT_COLORS[item.type]
            return (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: style.color }} />
                <span className="text-[10px] text-text-muted">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Month view — bookings only */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">Month view</h2>
            <p className="text-[11px] text-text-muted mt-0.5">Bookings only — for a clean scheduling overview.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted"><ChevronLeft size={14} /></button>
            <span className="text-sm font-semibold text-text">{APRIL_2026.month}</span>
            <button className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted"><ChevronRight size={14} /></button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-text-muted uppercase py-2">{d}</div>
            ))}
            {/* Day cells */}
            {calendarDays.map((day, i) => {
              const dayBookings = day ? (monthBookings[day] ?? []) : []
              const isToday = day === 13
              return (
                <div
                  key={i}
                  className={`min-h-[68px] p-1.5 rounded-lg border ${
                    day ? (isToday ? 'border-gold/40 bg-gold/[0.03]' : 'border-border/30 hover:border-border transition-colors') : 'border-transparent'
                  }`}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-medium ${isToday ? 'text-gold' : 'text-text-muted'}`}>{day}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayBookings.map((bk, j) => (
                          <div
                            key={j}
                            className="text-[8px] px-1 py-0.5 rounded truncate"
                            style={{ color: EVENT_COLORS.book.color, backgroundColor: EVENT_COLORS.book.bg }}
                          >
                            {bk.label} {bk.time}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
