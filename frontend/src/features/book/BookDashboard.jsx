import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useBookStore from '@/app/store/bookStore'
import CreateBookModal from './CreateBookModal'
import { formatDate } from '@/lib/utils'

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
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Books</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your book projects</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Book
        </button>
      </div>

      {loading && books.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : books.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border py-20 text-center">
          <p className="text-muted-foreground">No books yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="group cursor-pointer rounded-lg border border-border p-5 transition hover:border-primary hover:shadow-md"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <h3 className="font-semibold group-hover:text-primary">{book.title}</h3>
              {book.genre && (
                <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {book.genre}
                </span>
              )}
              {book.brief && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{book.brief}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(book.created_at)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this book?')) deleteBook(book.id)
                  }}
                  className="opacity-0 transition hover:text-destructive group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBookModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  )
}
