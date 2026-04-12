import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Star, Target } from 'lucide-react'
import type { TeamMember, MemberKPI, MemberKPIEntry, WeeklyAdminReview } from '../../types'
import { downsampleSingle } from '../../lib/chartData'
import { getKPITrend } from '../../lib/kpi'

/** MyTeam cards use a tighter 3-point window so manager cards reflect immediate momentum. */
const TEAM_CARD_TREND_WINDOW = 3

export interface MemberOverviewCardProps {
  member: TeamMember
  memberKpis: MemberKPI[]
  getKpiEntries: (kpiId: string) => MemberKPIEntry[]
  assignmentCount: number
  latestReview: WeeklyAdminReview | undefined
  onReview: (member: TeamMember) => void
  onKpis: (member: TeamMember) => void
}

export default function MemberOverviewCard({
  member, memberKpis, getKpiEntries, assignmentCount, latestReview, onReview, onKpis,
}: MemberOverviewCardProps) {
  const primaryKpi = memberKpis[0]
  const primaryEntries = primaryKpi ? getKpiEntries(primaryKpi.id) : []
  const trend =
    primaryEntries.length > 0
      ? getKPITrend(primaryEntries, TEAM_CARD_TREND_WINDOW)
      : null
  const chartData = downsampleSingle(
    primaryEntries.slice(-14).map(e => ({
      date: e.entry_date.slice(5),
      value: Number(e.value),
    })),
    'value',
    30,
  )

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-bold">
          {member.display_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h3 className="font-semibold text-sm">{member.display_name}</h3>
          <p className="text-xs text-text-muted capitalize">{(member.position ?? 'intern').replace(/_/g, ' ')}</p>
        </div>
        {trend && (
          <div className="ml-auto inline-flex">
            {trend === 'up' && (
              <span className="inline-flex items-center">
                <TrendingUp size={18} className="text-emerald-400" aria-hidden="true" />
                <span className="sr-only">Trending up</span>
              </span>
            )}
            {trend === 'down' && (
              <span className="inline-flex items-center">
                <TrendingDown size={18} className="text-red-400" aria-hidden="true" />
                <span className="sr-only">Trending down</span>
              </span>
            )}
            {trend === 'flat' && (
              <span className="inline-flex items-center">
                <Minus size={18} className="text-text-muted" aria-hidden="true" />
                <span className="sr-only">No change</span>
              </span>
            )}
          </div>
        )}
      </div>

      {chartData.length > 1 && (
        <>
          <div className="h-16 mb-3 -mx-1" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${member.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#C9A84C'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#C9A84C'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#C9A84C'} fill={`url(#grad-${member.id})`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <span className="sr-only">
            {primaryKpi ? `Area chart of ${primaryKpi.name} for the last ${chartData.length} data points. ` : ''}
            {trend === 'up' && 'Values are trending upward.'}
            {trend === 'down' && 'Values are trending downward.'}
            {trend === 'flat' && 'Values are relatively flat.'}
          </span>
        </>
      )}

      <div className="space-y-1.5 text-xs text-text-muted">
        {primaryKpi && (
          <div className="flex items-center justify-between">
            <span>{primaryKpi.name}</span>
            <span className="font-medium text-text">
              {primaryEntries.length > 0 ? (primaryEntries[primaryEntries.length - 1]?.value ?? '—') : '—'}
              {primaryKpi.target_value != null && <span className="text-text-light"> / {primaryKpi.target_value}</span>}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span>Assigned templates</span>
          <span className="font-medium text-text">{assignmentCount}</span>
        </div>
        {latestReview && (
          <div className="flex items-center justify-between">
            <span>Last review</span>
            <span className="font-medium text-text">{latestReview.overall_score}/5 ({latestReview.week_start})</span>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 mt-3 pt-3 border-t border-border">
        <button onClick={() => onReview(member)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-gold hover:bg-gold/10">
          <Star size={12} aria-hidden="true" /> Review
        </button>
        <button onClick={() => onKpis(member)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-violet-400 hover:bg-violet-500/10">
          <Target size={12} aria-hidden="true" /> KPIs
        </button>
      </div>
    </div>
  )
}
