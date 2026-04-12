import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import TeamPulseTab from '../components/dashboard/TeamPulseTab'
import YourDayTab from '../components/dashboard/YourDayTab'
import {
  ListChecks, LogIn, LogOut, Users, X,
} from 'lucide-react'

// ─── Account Strip ────────────────────────────────────────────────────
// Always-visible "who am I signed in as" indicator. Lives at the top of
// the Dashboard so the user never has to hunt for it — independent of
// sidebar visibility, viewport breakpoint, or session state.
//
// Logged in  → shows avatar + display name + email + role, plus a
//              "Sign out" button that signs the user out and goes to /login.
// Logged out → shows a "Not signed in" state with a primary "Sign in"
//              button that navigates to /login.
//
// This component was added in response to user feedback that the sidebar
// account card is too easy to miss and too easy to accidentally click.
// It's the canonical place to verify which account is active on this tab.
function AccountStrip() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const signedIn = !!profile || !!user
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'Unknown user'
  const email = profile?.email ?? user?.email ?? 'no email on file'
  const role = profile?.role ?? 'member'
  const position = profile?.position ?? null
  const initial = displayName.charAt(0).toUpperCase() || '?'

  const handleSignOut = async () => {
    try { await signOut() } catch {}
    navigate('/login')
  }

  if (!signedIn) {
    return (
      <div className="bg-surface rounded-2xl border border-red-500/30 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
            <X size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">Not signed in</p>
            <p className="text-xs text-text-muted">Sign in to see your personal dashboard.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gold hover:bg-gold-muted text-black px-4 py-2 text-sm font-semibold focus-ring"
        >
          <LogIn size={14} aria-hidden="true" />
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-bold shrink-0"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate">{displayName}</p>
          <p className="text-xs text-gold truncate" title={email}>{email}</p>
          <p className="text-[10px] text-text-light truncate capitalize">
            {role}{position ? ` · ${position}` : ''}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-alt hover:bg-surface-hover text-text-muted hover:text-text px-3 py-2 text-xs font-medium focus-ring shrink-0"
        aria-label={`Sign out of ${email}`}
        title="Sign out"
      >
        <LogOut size={13} aria-hidden="true" />
        Sign out
      </button>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function Dashboard() {
  useDocumentTitle('Dashboard - Checkmark Audio')
  const { profile, isAdmin } = useAuth()
  const [adminTab, setAdminTab] = useState<'team' | 'my'>('team')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.display_name?.split(' ')[0] ?? ''

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Always-visible account indicator so you can verify your login on every dashboard load. */}
      <AccountStrip />

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-text-light text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold mt-1">{greeting}, {firstName}</h1>
        </div>
      </div>

      {/* Admin tab bar */}
      {isAdmin && (
        <div className="flex gap-1 bg-surface-alt/50 p-1 rounded-xl border border-border w-fit">
          <button
            onClick={() => setAdminTab('team')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              adminTab === 'team'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users size={15} /> Team
            </span>
          </button>
          <button
            onClick={() => setAdminTab('my')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              adminTab === 'my'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <ListChecks size={15} /> My Tasks
            </span>
          </button>
        </div>
      )}

      {/* Tab content */}
      {isAdmin && adminTab === 'team' ? (
        <TeamPulseTab />
      ) : (
        <YourDayTab />
      )}
    </div>
  )
}
