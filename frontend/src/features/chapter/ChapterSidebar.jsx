import { useState } from 'react'
import useEditorStore from '@/app/store/editorStore'
import { cn } from '@/lib/utils'

const STATUS_COLORS = {
  empty: 'bg-gray-300',
  draft: 'bg-yellow-400',
  reviewed: 'bg-green-500',
}

export default function ChapterSidebar({ bookId, onGenerateOutline }) {
  const {
    chapters, currentChapter, selectChapter,
    createChapter, deleteChapter, aiLoading,
  } = useEditorStore()
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await createChapter(bookId, { title: newTitle.trim() })
    setNewTitle('')
    setAdding(false)
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chapters</span>
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-primary hover:underline"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chapters.length === 0 && !aiLoading && (
          <div className="px-2 py-6 text-center">
            <p className="text-xs text-muted-foreground">No chapters yet</p>
            <button
              onClick={onGenerateOutline}
              className="mt-2 rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Generate Outline
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {chapters.map((ch, i) => (
            <div
              key={ch.id}
              onClick={() => selectChapter(ch.id)}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition',
                currentChapter?.id === ch.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_COLORS[ch.status] || STATUS_COLORS.empty)} />
              <span className="flex-1 truncate">{ch.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this chapter?')) deleteChapter(ch.id)
                }}
                className="hidden text-xs text-destructive group-hover:block"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {adding && (
          <div className="mt-2 flex gap-1 px-1">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Chapter title"
              className="flex-1 rounded border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={handleAdd} className="text-xs text-primary">✓</button>
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground">✕</button>
          </div>
        )}
      </div>
    </aside>
  )
}
