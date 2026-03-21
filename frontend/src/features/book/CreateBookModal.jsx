import { useState, useEffect, useRef } from 'react'

export default function CreateBookModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', genre: '', brief: '', style_notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100)
  }, [open])

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-slide-up w-full max-w-lg rounded-2xl border border-border bg-card p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <span className="text-3xl">✍️</span>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Begin a New Story</h2>
          <p className="mt-1 text-xs text-muted-foreground">Give your book a foundation — you can always refine later.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Title <span className="text-primary">*</span></span>
            <input
              ref={titleRef}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., The Last Algorithm"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Genre</span>
            <input
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              placeholder="e.g., sci-fi, fantasy, mystery"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Concept Brief</span>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={3}
              value={form.brief}
              onChange={(e) => setForm({ ...form, brief: e.target.value })}
              placeholder="What's your story about? A paragraph is enough for the AI to build an outline."
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Style Notes</span>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
              value={form.style_notes}
              onChange={(e) => setForm({ ...form, style_notes: e.target.value })}
              placeholder="e.g., dark and atmospheric, witty dialogue, first person"
            />
          </label>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
