import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import { X, Upload, Loader2 } from 'lucide-react'

const PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const

interface SubmissionModalProps {
  onClose: () => void
  onSubmitted: () => void
}

export default function SubmissionModal({ onClose, onSubmitted }: SubmissionModalProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [dropboxUrl, setDropboxUrl] = useState('')
  const [platform, setPlatform] = useState<string>('instagram')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const position = profile?.position ?? 'intern'
  const isContentRole = ['intern', 'marketing_admin'].includes(position)
  const isArtistDev = position === 'artist_development'

  const submissionType = isContentRole
    ? 'social_media_content'
    : isArtistDev
      ? 'client_followup_log'
      : 'general'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)

    const { error } = await supabase.from('deliverable_submissions').insert({
      intern_id: profile.id,
      submission_date: new Date().toISOString().split('T')[0],
      submission_type: submissionType,
      dropbox_url: dropboxUrl || null,
      platform_tag: isContentRole ? platform : null,
      notes: notes || null,
    })

    setSubmitting(false)
    if (error) {
      toast('Failed to submit. Try again.', 'error')
    } else {
      toast('Deliverable submitted')
      onSubmitted()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-2xl border border-border p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">Submit Deliverable</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isContentRole && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-text-muted">Dropbox Link</label>
                <input
                  type="url"
                  value={dropboxUrl}
                  onChange={e => setDropboxUrl(e.target.value)}
                  placeholder="https://dropbox.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-text-muted">Platform</label>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all border ${
                        platform === p
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border text-text-muted hover:border-border-light'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {isArtistDev && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-muted">Who was contacted?</label>
              <input
                value={dropboxUrl}
                onChange={e => setDropboxUrl(e.target.value)}
                placeholder="Client / artist name"
                className="w-full px-4 py-3 rounded-xl border border-border text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-text-muted">
              {isContentRole ? 'Description' : isArtistDev ? 'Communication summary & next steps' : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={isContentRole ? 'What did you create?' : 'Details...'}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gold hover:bg-gold-muted text-black font-semibold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
