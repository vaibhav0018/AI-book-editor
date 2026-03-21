import { useState } from 'react'

export default function CreateBookModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', genre: '', brief: '', style_notes: '' })
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await onCreate(form)
      setForm({ title: '', genre: '', brief: '', style_notes: '' })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const field = (label, name, type = 'input') => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {type === 'textarea' ? (
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
      ) : (
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
      )}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">New Book</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Title *', 'title')}
          {field('Genre', 'genre')}
          {field('Concept Brief', 'brief', 'textarea')}
          {field('Style Notes', 'style_notes', 'textarea')}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
