import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Star,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  ClipboardList,
} from 'lucide-react'

const memberLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/daily', icon: FileText, label: 'Daily Notes' },
  { to: '/leads', icon: Target, label: 'Leads' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
]

const adminLinks = [
  { to: '/admin/team', icon: Users, label: 'Team Manager' },
  { to: '/admin/templates', icon: ClipboardList, label: 'Templates' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { profile, isAdmin, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminExpanded, setAdminExpanded] = useState(true)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-text-muted hover:bg-surface-hover hover:text-text'
    }`

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            CA
          </div>
          <div>
            <h1 className="font-semibold text-sm">Checkmark Audio</h1>
            <p className="text-xs text-text-muted">Team Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {memberLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={linkClass}
            onClick={() => setSidebarOpen(false)}
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-hover w-full mt-4"
            >
              <Shield size={18} />
              Admin
              <ChevronDown
                size={14}
                className={`ml-auto transition-transform ${adminExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            {adminExpanded && (
              <div className="ml-3 space-y-1">
                {adminLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={linkClass}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
            {profile?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.display_name ?? 'User'}</p>
            <p className="text-xs text-text-muted truncate capitalize">{profile?.position ?? 'Member'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-surface flex-col shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-surface h-full shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-surface-hover"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-surface flex items-center px-4 lg:hidden shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-hover">
            <Menu size={20} />
          </button>
          <span className="ml-3 font-semibold text-sm">Checkmark Audio</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
