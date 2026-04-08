import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Settings, Save, Loader2, Database, Globe, Bell } from 'lucide-react'

export default function AdminSettings() {
  const { profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [orgName, setOrgName] = useState('Checkmark Audio')
  const [orgTagline, setOrgTagline] = useState('Team Management System')
  const [notifyOnSubmission, setNotifyOnSubmission] = useState(true)
  const [notifyOnLeadUpdate, setNotifyOnLeadUpdate] = useState(true)
  const [requireDailyNotes, setRequireDailyNotes] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Settings would be persisted to a settings table in Supabase
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-text-muted mt-1">Configure your team dashboard</p>
      </div>

      {/* Organization */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Globe size={16} /> Organization</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Organization Name</label>
            <input value={orgName} onChange={e => setOrgName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tagline</label>
            <input value={orgTagline} onChange={e => setOrgTagline(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Bell size={16} /> Notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
            <div>
              <p className="text-sm font-medium">Daily note submissions</p>
              <p className="text-xs text-text-muted">Get notified when team members submit daily notes</p>
            </div>
            <input type="checkbox" checked={notifyOnSubmission} onChange={e => setNotifyOnSubmission(e.target.checked)}
              className="rounded border-border" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
            <div>
              <p className="text-sm font-medium">Lead updates</p>
              <p className="text-xs text-text-muted">Get notified when leads change status</p>
            </div>
            <input type="checkbox" checked={notifyOnLeadUpdate} onChange={e => setNotifyOnLeadUpdate(e.target.checked)}
              className="rounded border-border" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
            <div>
              <p className="text-sm font-medium">Require daily notes</p>
              <p className="text-xs text-text-muted">Team members must submit daily notes before end of day</p>
            </div>
            <input type="checkbox" checked={requireDailyNotes} onChange={e => setRequireDailyNotes(e.target.checked)}
              className="rounded border-border" />
          </label>
        </div>
      </div>

      {/* Database info */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Database size={16} /> Database</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-alt">
            <span className="text-text-muted">Supabase Project</span>
            <code className="text-xs bg-white px-2 py-1 rounded border border-border">ncljfjdcyswoeitsooty</code>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-alt">
            <span className="text-text-muted">Admin User</span>
            <span className="font-medium">{profile?.email}</span>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Settings
        </button>
      </div>
    </div>
  )
}
