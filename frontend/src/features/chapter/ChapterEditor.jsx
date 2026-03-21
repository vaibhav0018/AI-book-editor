import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useBookStore from '@/app/store/bookStore'
import useEditorStore from '@/app/store/editorStore'

export default function ChapterEditor() {
  const { bookId } = useParams()
  const { selectedBook, fetchBook } = useBookStore()
  const { chapters, fetchChapters } = useEditorStore()

  useEffect(() => {
    if (bookId) {
      fetchBook(bookId)
      fetchChapters(bookId)
    }
  }, [bookId, fetchBook, fetchChapters])

  return (
    <div className="flex h-full">
      {/* Left sidebar — placeholder for ChapterSidebar (Phase 4) */}
      <aside className="w-60 shrink-0 overflow-y-auto border-r border-border p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {selectedBook?.title || 'Loading...'}
        </h2>
        <p className="text-xs text-muted-foreground">{chapters.length} chapters</p>
        <div className="mt-4 space-y-1">
          {chapters.map((ch) => (
            <div key={ch.id} className="rounded px-2 py-1.5 text-sm hover:bg-muted">
              {ch.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Center editor — placeholder for TipTap (Phase 4) */}
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a chapter to start editing
      </div>

      {/* Right AI panel — placeholder (Phase 4) */}
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-border p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">AI Assistant</h2>
        <p className="mt-2 text-xs text-muted-foreground">Coming in Phase 4</p>
      </aside>
    </div>
  )
}
