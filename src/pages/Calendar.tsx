import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { loadWeekEvents } from '../lib/calendar'
import { addDays, startOfWeek } from '../lib/time'
import {
  CalendarWeek,
  EmptyState,
  PageHeader,
  Select,
} from '../components/ui'
import { CalendarDays, Users, ExternalLink } from 'lucide-react'
import type { CalendarEvent, TeamMember } from '../types'
import { supabase } from '../lib/supabase'

/**
 * Phase 5.5 — Personal + team calendar page.
 *
 * Two modes:
 *   - "My week" (default): shows the signed-in user's own sessions,
 *     meetings, and schedule focus areas for the week.
 *   - "Team view" (admin only): pulls every member's events in one
 *     merged grid with member-name chips on each block.
 */
export default function Calendar() {
  useDocumentTitle('Calendar - Checkmark Audio')
  const { profile, isAdmin } = useAuth()

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<'self' | 'team' | string>('self')
  const [members, setMembers] = useState<TeamMember[]>([])

  // Load member list for the admin scope selector.
  useEffect(() => {
    if (!isAdmin) return
    ;(async () => {
      const { data, error } = await supabase
        .from('intern_users')
        .select('*')
        .eq('status', 'active')
        .order('display_name')
      if (!error) setMembers((data ?? []) as TeamMember[])
    })()
  }, [isAdmin])

  const effectiveScope = useMemo<'team' | string>(() => {
    if (scope === 'self') return profile?.id ?? 'team'
    if (scope === 'team') return 'team'
    return scope // specific member id
  }, [scope, profile?.id])

  const reload = useCallback(async () => {
    setLoading(true)
    const { events: evs } = await loadWeekEvents({ weekStart, scope: effectiveScope })
    setEvents(evs)
    setLoading(false)
  }, [weekStart, effectiveScope])

  useEffect(() => { reload() }, [reload])

  const handlePrev = () => setWeekStart((d) => addDays(d, -7))
  const handleNext = () => setWeekStart((d) => addDays(d, 7))
  const handleToday = () => setWeekStart(startOfWeek(new Date()))

  const title = useMemo(() => {
    if (scope === 'self') return 'My week'
    if (scope === 'team') return 'Entire team'
    const m = members.find((x) => x.id === scope)
    return m ? `${m.display_name}'s week` : 'Member week'
  }, [scope, members])

  if (!profile) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Sign in to see your calendar"
        description="The calendar shows sessions, meetings, and weekly focus areas for your account."
      />
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-fade-in">
      <PageHeader
        icon={CalendarDays}
        title="Calendar"
        subtitle="Time-sensitive events for you and your team — sessions, meetings, and weekly focus."
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Users size={14} className="text-text-muted" aria-hidden="true" />
              <Select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                aria-label="Calendar scope"
              >
                <option value="self">My week</option>
                <option value="team">Entire team</option>
                {members
                  .filter((m) => m.id !== profile.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
              </Select>
            </div>
          ) : undefined
        }
      />

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-text-muted text-sm">
          Loading your week…
        </div>
      ) : (
        <CalendarWeek
          weekStart={weekStart}
          events={events}
          onPrevWeek={handlePrev}
          onNextWeek={handleNext}
          onToday={handleToday}
          showMemberChip={scope === 'team'}
          title={title}
          onEventClick={(ev) => {
            if (ev.href) window.location.assign(import.meta.env.BASE_URL + ev.href.replace(/^\//, ''))
          }}
        />
      )}

      <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
        <span>Need to add or edit a session?</span>
        <Link to="/sessions" className="text-gold hover:underline inline-flex items-center gap-1">
          Open Sessions <ExternalLink size={10} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
