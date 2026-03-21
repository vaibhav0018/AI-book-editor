import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useBookStore from '@/app/store/bookStore'
import CreateBookModal from './CreateBookModal'
import { formatDate } from '@/lib/utils'

const GENRE_ICONS = {
  fantasy: '🏰',
  'sci-fi': '🚀',
  romance: '💕',
  mystery: '🔍',
  thriller: '🔪',
  horror: '👻',
  fiction: '📖',
  'non-fiction': '📚',
}

export default function BookDashboard() {
  const { books, loading, fetchBooks, createBook, deleteBook } = useBookStore()
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleCreate = async (form) => {
    const book = await createBook(form)
    navigate(`/book/${book.id}`)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Library</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every great story starts with a single idea.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <button
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md"
        >
          <span className="text-base transition-transform group-hover:scale-110">✦</span>
          Start a New Book
        </button>
      </div>

      {loading && books.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse-soft rounded-full bg-warm-light" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="mx-auto max-w-md rounded-xl border-2 border-dashed border-border py-16 text-center">
          <span className="text-4xl">📝</span>
          <p className="mt-4 text-sm text-muted-foreground">
            Your library is empty. Create your first book to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/book/${book.id}`)}
              className="animate-slide-up group cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="text-2xl">{GENRE_ICONS[book.genre?.toLowerCase()] || '📖'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this book permanently?')) deleteBook(book.id)
                  }}
                  className="rounded p-1 text-xs text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
              <h3 className="font-semibold leading-tight text-foreground group-hover:text-primary">
                {book.title}
              </h3>
              {book.genre && (
                <span className="mt-1.5 inline-block rounded-full bg-warm-light px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                  {book.genre}
                </span>
              )}
              {book.brief && (
                <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                  {book.brief}
                </p>
              )}
              <div className="mt-4 border-t border-border/60 pt-3">
                <span className="text-[11px] text-muted-foreground">{formatDate(book.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBookModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  )
}
