import { useState, useRef, useEffect } from 'react'
import { useChecklist, type ChecklistItemRow, type PendingTaskEdit } from '../hooks/useChecklist'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { localDateKey } from '../lib/dates'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Badge, Button, Input } from '../components/ui'
import ConfirmModal from '../components/ConfirmModal'
import {
  Check, ChevronLeft, ChevronRight, ListChecks, Plus, Trash2, Pencil, X,
  Clock,
} from 'lucide-react'

// Emoji chip per well-known category, falls back to 📌 for any custom one.
const CATEGORY_META: Record<string, string> = {
  'Studio Readiness': '🎙️',
  'Content Support': '📸',
  'Admin & Organization': '📋',
  'End-of-Day Reset': '🔒',
}

export default function DailyChecklist() {
  useDocumentTitle('Daily Tasks - Checkmark Audio')
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [date, setDate] = useState(new Date())

  const {
    grouped,
    loading,
    toggleItem,
    completedCount,
    totalCount,
    percentage,
    // Member-side (propose) actions — routed through task_edit_requests queue.
    proposeAddItem,
    proposeRenameItem,
    proposeDeleteItem,
    // Admin-side (direct) actions — bypass the queue entirely.
    addItem,
    renameItem,
    deleteItem,
    // Pending approval state for badges + member pending queue display.
    pendingByItemId,
    pendingAdds,
  } = useChecklist('daily', date)

  const isToday = localDateKey(date) === localDateKey()

  const shift = (days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold/20 border-t-gold" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  const categories = Object.keys(grouped)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Tasks</h1>
          <p className="text-text-muted text-sm mt-1">
            {isToday
              ? "Today's tasks"
              : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus-ring"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            onClick={() => setDate(new Date())}
            className="px-3 py-1.5 text-sm font-medium bg-surface-alt hover:bg-surface-hover rounded-lg transition-colors focus-ring"
          >
            Today
          </button>
          <button
            onClick={() => shift(1)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus-ring"
            aria-label="Next day"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <ListChecks size={16} className="text-gold" aria-hidden="true" />
            Overall Progress
          </span>
          <span className="text-sm font-bold">{completedCount}/{totalCount}</span>
        </div>
        <div
          className="h-3 bg-surface-alt rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Daily progress: ${percentage}%`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: percentage === 100 ? '#10b981' : percentage > 50 ? '#C9A84C' : '#f59e0b',
            }}
          />
        </div>
        {percentage === 100 && totalCount > 0 && (
          <p className="text-sm text-emerald-400 font-medium mt-2" aria-live="polite">All tasks completed!</p>
        )}
      </div>

      {/* Member-side pending queue — only rendered when there's something to show.
          Admins edit directly, so they never have pending rows of their own. */}
      {!isAdmin && (pendingAdds.length > 0 || pendingByItemId.size > 0) && (
        <PendingQueue
          pendingAdds={pendingAdds}
          pendingByItemId={pendingByItemId}
        />
      )}

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center shadow-sm">
          <ListChecks size={40} className="mx-auto mb-3 text-text-light opacity-40" />
          <p className="text-text-muted font-medium">No tasks for this date</p>
          <p className="text-sm text-text-light mt-1">Tasks are auto-generated. Check back on a workday.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category, catIdx) => (
            <CategoryCard
              key={category}
              category={category}
              items={grouped[category] ?? []}
              catIdx={catIdx}
              isAdmin={isAdmin}
              isToday={isToday}
              toggleItem={toggleItem}
              pendingByItemId={pendingByItemId}
              onProposeRename={async (id, text) => {
                const { error } = await proposeRenameItem(id, text)
                if (error) toast(error, 'error')
                else toast('Rename sent for approval')
              }}
              onProposeDelete={async (id) => {
                const { error } = await proposeDeleteItem(id)
                if (error) toast(error, 'error')
                else toast('Delete sent for approval')
              }}
              onProposeAdd={async (text) => {
                const { error } = await proposeAddItem(category, text)
                if (error) toast(error, 'error')
                else toast('New task sent for approval')
              }}
              onAdminRename={async (id, text) => {
                const { error } = await renameItem(id, text)
                if (error) toast(error, 'error')
                else toast('Task renamed')
              }}
              onAdminDelete={async (id) => {
                const { error } = await deleteItem(id)
                if (error) toast(error, 'error')
                else toast('Task removed')
              }}
              onAdminAdd={async (text) => {
                const { error } = await addItem(category, text)
                if (error) toast(error, 'error')
                else toast('Task added')
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pending approval queue (member-only) ────────────────────────────
function PendingQueue({
  pendingAdds,
  pendingByItemId,
}: {
  pendingAdds: PendingTaskEdit[]
  pendingByItemId: Map<string, PendingTaskEdit>
}) {
  const renameAndDelete = Array.from(pendingByItemId.values())
  const total = pendingAdds.length + renameAndDelete.length

  return (
    <div className="bg-surface rounded-2xl border border-amber-500/30 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-amber-400" aria-hidden="true" />
        <h2 className="font-semibold text-sm">Pending approval</h2>
        <Badge variant="warning" size="sm">{total}</Badge>
      </div>
      <p className="text-xs text-text-muted mb-3">
        Your edits are waiting for your manager or an admin to review.
      </p>
      <ul className="space-y-2 text-sm">
        {pendingAdds.map(req => (
          <li key={req.id} className="flex items-start gap-2">
            <Plus size={14} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-text">Add <strong>{req.proposed_text}</strong></span>
              <span className="text-text-light"> to {req.proposed_category ?? 'the list'}</span>
            </div>
          </li>
        ))}
        {renameAndDelete.map(req => (
          <li key={req.id} className="flex items-start gap-2">
            {req.change_type === 'rename' ? (
              <Pencil size={14} className="text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Trash2 size={14} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              {req.change_type === 'rename' ? (
                <span className="text-text">
                  Rename <strong className="line-through text-text-light">{req.previous_text}</strong>
                  {' → '}
                  <strong>{req.proposed_text}</strong>
                </span>
              ) : (
                <span className="text-text">
                  Delete <strong className="line-through text-text-light">{req.previous_text}</strong>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── One category card with inline editing ──────────────────────────
interface CategoryCardProps {
  category: string
  items: ChecklistItemRow[]
  catIdx: number
  isAdmin: boolean
  isToday: boolean
  toggleItem: (id: string) => void
  pendingByItemId: Map<string, PendingTaskEdit>
  onProposeRename: (id: string, text: string) => Promise<void>
  onProposeDelete: (id: string) => Promise<void>
  onProposeAdd: (text: string) => Promise<void>
  onAdminRename: (id: string, text: string) => Promise<void>
  onAdminDelete: (id: string) => Promise<void>
  onAdminAdd: (text: string) => Promise<void>
}

function CategoryCard({
  category,
  items,
  catIdx,
  isAdmin,
  isToday,
  toggleItem,
  pendingByItemId,
  onProposeRename,
  onProposeDelete,
  onProposeAdd,
  onAdminRename,
  onAdminDelete,
  onAdminAdd,
}: CategoryCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [addingOpen, setAddingOpen] = useState(false)
  const [addText, setAddText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; itemId: string; itemText: string
  }>({ open: false, itemId: '', itemText: '' })

  const done = items.filter(i => i.is_completed).length
  const emoji = CATEGORY_META[category] ?? '📌'

  const beginEdit = (item: ChecklistItemRow) => {
    setEditingId(item.id)
    setEditingText(item.item_text)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }
  const commitEdit = async () => {
    const id = editingId
    const text = editingText
    if (!id) return
    cancelEdit()
    if (isAdmin) await onAdminRename(id, text)
    else await onProposeRename(id, text)
  }

  const commitAdd = async () => {
    const text = addText
    if (!text.trim()) return
    setAddText('')
    setAddingOpen(false)
    if (isAdmin) await onAdminAdd(text)
    else await onProposeAdd(text)
  }

  const requestDelete = (item: ChecklistItemRow) => {
    setDeleteConfirm({ open: true, itemId: item.id, itemText: item.item_text })
  }
  const confirmDelete = async () => {
    const id = deleteConfirm.itemId
    setDeleteConfirm({ open: false, itemId: '', itemText: '' })
    if (isAdmin) await onAdminDelete(id)
    else await onProposeDelete(id)
  }

  // Only allow structural edits on the current day's list — backdating edits
  // would require special handling and isn't a real workflow here.
  const canEdit = isToday

  return (
    <>
      <div
        className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden animate-slide-up"
        style={{ animationDelay: `${catIdx * 60}ms` }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-alt/50 transition-colors focus-ring"
          aria-expanded={!collapsed}
          aria-controls={`daily-cat-${catIdx}`}
        >
          <span className="text-lg" aria-hidden="true">{emoji}</span>
          <span className="font-semibold text-sm flex-1 text-left">{category}</span>
          <span className="text-xs text-text-muted font-medium">{done}/{items.length}</span>
          <ChevronLeft
            size={16}
            aria-hidden="true"
            className={`text-text-light transition-transform duration-200 ${collapsed ? '' : '-rotate-90'}`}
          />
        </button>

        {!collapsed && (
          <div id={`daily-cat-${catIdx}`} className="border-t border-border divide-y divide-border/50">
            {items.map(item => {
              const pending = pendingByItemId.get(item.id)
              const isPendingRename = pending?.change_type === 'rename'
              const isPendingDelete = pending?.change_type === 'delete'
              const isEditing = editingId === item.id

              if (isEditing) {
                return (
                  <div key={item.id} className="flex items-center gap-2 px-5 py-3">
                    <Input
                      aria-label="Edit task"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                        if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                      }}
                      wrapperClassName="flex-1"
                      autoFocus
                    />
                    <Button variant="primary" size="sm" onClick={commitEdit}>Save</Button>
                    <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
                  </div>
                )
              }

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                    isPendingDelete ? 'opacity-60' : 'hover:bg-surface-alt/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-pressed={item.is_completed}
                    aria-label={item.is_completed ? `Uncheck ${item.item_text}` : `Complete ${item.item_text}`}
                    className="shrink-0 focus-ring rounded-md"
                  >
                    <div
                      aria-hidden="true"
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        item.is_completed
                          ? 'bg-gold border-gold'
                          : 'border-text-light hover:border-gold'
                      }`}
                    >
                      {item.is_completed && <Check size={14} className="text-black" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`flex-1 text-left text-sm transition-all focus-ring rounded ${
                      item.is_completed ? 'text-text-light line-through' : 'text-text'
                    }`}
                  >
                    {item.item_text}
                  </button>

                  {isPendingRename && (
                    <Badge variant="warning" size="sm" title={`Pending rename → "${pending?.proposed_text}"`}>
                      rename pending
                    </Badge>
                  )}
                  {isPendingDelete && (
                    <Badge variant="danger" size="sm">delete pending</Badge>
                  )}

                  {canEdit && !pending && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => beginEdit(item)}
                        aria-label={`Edit ${item.item_text}`}
                        className="p-1.5 rounded text-text-light hover:text-gold hover:bg-gold/10 focus-ring"
                      >
                        <Pencil size={13} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(item)}
                        aria-label={`Delete ${item.item_text}`}
                        className="p-1.5 rounded text-text-light hover:text-red-400 hover:bg-red-500/10 focus-ring"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add-task row — only on today's list */}
            {canEdit && (
              <div className="px-5 py-3 bg-surface-alt/30">
                {addingOpen ? (
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`New task in ${category}`}
                      placeholder="New task…"
                      value={addText}
                      onChange={e => setAddText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitAdd() }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setAddingOpen(false)
                          setAddText('')
                        }
                      }}
                      wrapperClassName="flex-1"
                      autoFocus
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={commitAdd}
                      iconLeft={<Plus size={13} aria-hidden="true" />}
                    >
                      {isAdmin ? 'Add' : 'Propose'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setAddingOpen(false); setAddText('') }}
                      aria-label="Cancel add"
                    >
                      <X size={13} aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingOpen(true)}
                    className="w-full flex items-center gap-2 text-sm text-text-muted hover:text-gold transition-colors focus-ring rounded-md px-2 py-1"
                  >
                    <Plus size={14} aria-hidden="true" />
                    {isAdmin ? 'Add task' : 'Propose a new task'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteConfirm.open}
        title={isAdmin ? 'Delete task' : 'Propose task deletion'}
        message={
          isAdmin
            ? `Permanently remove "${deleteConfirm.itemText}" from today's list?`
            : `Send a request to delete "${deleteConfirm.itemText}"? Your manager will review before it's removed.`
        }
        confirmLabel={isAdmin ? 'Delete' : 'Send request'}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, itemId: '', itemText: '' })}
      />
    </>
  )
}
