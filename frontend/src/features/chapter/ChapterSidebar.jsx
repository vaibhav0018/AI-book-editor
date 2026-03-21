import { useState, useEffect } from 'react'
import useEditorStore from '@/app/store/editorStore'
import useBookStore from '@/app/store/bookStore'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { getFriendlyMessage } from '@/lib/friendlyError'

const STATUS_DOT = {
  empty: 'bg-border',
  draft: 'bg-warm',
  reviewed: 'bg-green-500',
}

const OUTLINE_WAIT_MESSAGES = [
  'Cooking up your outline…',
  'Stirring plot threads together…',
  'Letting the story simmer…',
  'Tasting themes and pacing…',
  'Almost ready to serve…',
]

export default function ChapterSidebar({ bookId, onGenerateOutline }) {
  const {
    chapters, currentChapter, selectChapter,
    createChapter, deleteChapter, aiLoading, aiStep,
  } = useEditorStore()
  const { selectedBook } = useBookStore()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [exporting, setExporting] = useState(false)
  const [outlineMsgIdx, setOutlineMsgIdx] = useState(0)

  const outlineInProgress = aiLoading && aiStep === 'planning'

  useEffect(() => {
    if (!outlineInProgress) {
      setOutlineMsgIdx(0)
      return
    }
    const id = setInterval(() => {
      setOutlineMsgIdx((i) => (i + 1) % OUTLINE_WAIT_MESSAGES.length)
    }, 2800)
    return () => clearInterval(id)
  }, [outlineInProgress])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await createChapter(bookId, { title: newTitle.trim() })
    setNewTitle('')
    setAdding(false)
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const res = await fetch(`${baseUrl}/api/books/${bookId}/export/pdf`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedBook?.title || 'book'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch (err) {
      toast.error(getFriendlyMessage(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar">
      {/* Book title header */}
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {selectedBook?.title || 'Loading...'}
        </h2>
        {selectedBook?.genre && (
          <span className="mt-1 inline-block text-[11px] text-muted-foreground">{selectedBook.genre}</span>
        )}
      </div>

      {/* Chapter list header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Chapters · {chapters.length}
        </span>
        <button
          onClick={() => setAdding(true)}
          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {chapters.length === 0 && outlineInProgress && (
          <div className="animate-slide-up px-2 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-light/50 border border-border/60">
              <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <p className="mt-5 min-h-[2.5rem] px-2 text-sm font-medium leading-snug text-foreground transition-opacity duration-300">
              {OUTLINE_WAIT_MESSAGES[outlineMsgIdx]}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Hang tight — this often takes 15–40 seconds
            </p>
            <div className="mx-auto mt-6 max-w-[200px] space-y-2.5">
              <div className="h-2.5 w-full rounded-full bg-warm-light/90 animate-pulse" />
              <div className="mx-auto h-2.5 w-[85%] rounded-full bg-warm-light/70 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="mx-auto h-2.5 w-[65%] rounded-full bg-warm-light/50 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="mt-5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/80">
              Chef’s special: your chapter list
            </p>
          </div>
        )}

        {chapters.length === 0 && !outlineInProgress && (
          <div className="px-2 py-8 text-center">
            <span className="text-3xl">📋</span>
            <p className="mt-3 text-xs text-muted-foreground">No chapters yet.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Let AI plan your story structure.</p>
            <button
              onClick={onGenerateOutline}
              disabled={aiLoading}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              ✦ Generate Outline
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {chapters.map((ch, i) => (
            <div
              key={ch.id}
              onClick={() => selectChapter(ch.id, bookId)}
              className={cn(
                'group flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all',
                currentChapter?.id === ch.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-foreground/80 hover:bg-muted'
              )}
            >
              <span className={cn(
                'h-2 w-2 shrink-0 rounded-full ring-2',
                STATUS_DOT[ch.status] || STATUS_DOT.empty,
                currentChapter?.id === ch.id ? 'ring-primary/30' : 'ring-transparent',
              )} />
              <span className="flex-1 truncate">{ch.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this chapter?')) deleteChapter(ch.id)
                }}
                className="rounded p-0.5 text-[11px] text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {adding && (
          <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-card p-2.5">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setAdding(false)
              }}
              placeholder="Chapter title..."
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <div className="flex gap-1.5">
              <button onClick={handleAdd} className="flex-1 rounded-md bg-primary py-1 text-[11px] font-medium text-primary-foreground">Add</button>
              <button onClick={() => setAdding(false)} className="flex-1 rounded-md border border-border py-1 text-[11px] text-muted-foreground hover:bg-muted">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="border-t border-border/60 p-3">
        <button
          onClick={handleExportPdf}
          disabled={exporting || chapters.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
        >
          {exporting ? (
            <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" /> Exporting...</>
          ) : (
            <><span>📄</span> Download PDF</>
          )}
        </button>
      </div>
    </aside>
  )
}
