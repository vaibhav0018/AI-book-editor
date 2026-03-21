import { useState, useRef, useEffect } from 'react'
import useEditorStore from '@/app/store/editorStore'
import useBookStore from '@/app/store/bookStore'
import { streamGenerateChapter, rewriteText, summarizeChapter } from './aiApi'
import { useToast } from '@/components/ui/Toast'

const ACTIONS = [
  { key: 'continue', label: 'Continue', icon: '→', desc: 'Write more from where it left off' },
  { key: 'rewrite', label: 'Rewrite', icon: '✏️', desc: 'Rewrite with better prose' },
  { key: 'improve', label: 'Improve', icon: '✨', desc: 'Sharpen language and flow' },
  { key: 'change_tone', label: 'Tone', icon: '🎭', desc: 'Shift the writing voice' },
]

function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

export default function AISidePanel() {
  const { currentChapter, setAiLoading, aiLoading, aiStep, setCurrentChapterContent, updateChapterContent, fetchChapters } = useEditorStore()
  const { selectedBook, fetchBook } = useBookStore()
  const [lastResult, setLastResult] = useState(null)
  const [abortFn, setAbortFn] = useState(null)
  const toast = useToast()
  const resultRef = useRef(null)

  const bookId = selectedBook?.id

  useEffect(() => {
    if (lastResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [lastResult])

  const handleGenerate = async () => {
    if (!bookId || !currentChapter) return

    // Persist any user-written notes/brief so the backend sees them
    if (currentChapter.content?.trim()) {
      await updateChapterContent(currentChapter.id, currentChapter.content)
    }

    setAiLoading(true, 'writing')
    let content = ''

    const cancel = streamGenerateChapter(
      bookId,
      currentChapter.id,
      (token) => {
        content += token
        setCurrentChapterContent(content)
      },
      (modelUsed) => {
        setAiLoading(false, null)
        setAbortFn(null)
        fetchChapters(bookId)
        fetchBook(bookId)
        toast.success('Chapter generated successfully')
      },
      (err) => {
        setAiLoading(false, null)
        setAbortFn(null)
        toast.error('Generation failed: ' + err.message)
      },
    )
    setAbortFn(() => cancel)
  }

  const handleStop = () => {
    if (abortFn) abortFn()
    setAiLoading(false, null)
    setAbortFn(null)
  }

  const handleAction = async (action) => {
    if (!currentChapter) return
    const rawContent = currentChapter.content || ''
    if (!rawContent.trim()) {
      toast.error('Write some content first')
      return
    }
    setAiLoading(true, action)
    try {
      const plainText = stripHtml(rawContent)
      const { data } = await rewriteText(currentChapter.id, plainText, action)
      setLastResult({ action, text: data.result, model: data.model_used, originalHtml: rawContent })
      toast.info(`${action.replace('_', ' ')} ready — review below`)
    } catch (err) {
      toast.error('Action failed: ' + err.message)
    } finally {
      setAiLoading(false, null)
    }
  }

  const handleSummarize = async () => {
    if (!currentChapter) return
    setAiLoading(true, 'summarizing')
    try {
      const { data } = await summarizeChapter(currentChapter.id)
      setLastResult({ action: 'summarize', text: data.summary, model: data.model_used })
      fetchChapters(bookId)
      toast.success('Chapter summarized')
    } catch (err) {
      toast.error('Summarize failed: ' + err.message)
    } finally {
      setAiLoading(false, null)
    }
  }

  const applyResult = () => {
    if (!lastResult) return

    let newContent = null
    if (lastResult.action === 'continue') {
      const existing = currentChapter.content || ''
      newContent = existing + `<p>${lastResult.text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
      setCurrentChapterContent(newContent)
      toast.success('Continuation added to chapter')
    } else if (lastResult.action === 'summarize') {
      toast.info('Summary saved to memory')
    } else {
      newContent = `<p>${lastResult.text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
      setCurrentChapterContent(newContent)
      toast.success('Changes applied to editor')
    }

    if (newContent && currentChapter?.id) {
      updateChapterContent(currentChapter.id, newContent)
    }
    setLastResult(null)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border/60 bg-sidebar">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!currentChapter ? (
          <div className="py-8 text-center">
            <span className="text-3xl opacity-30">✨</span>
            <p className="mt-3 text-xs text-muted-foreground">Select a chapter to unlock AI features</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* AI result preview — shown at top so user sees it */}
            {lastResult && (
              <div ref={resultRef} className="animate-slide-up rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {lastResult.action === 'continue' ? 'Continuation' : lastResult.action.replace('_', ' ')} · {lastResult.model}
                </p>
                <div className="mb-3 max-h-52 overflow-y-auto rounded-lg bg-card p-2.5 text-xs leading-relaxed text-foreground/80">
                  {lastResult.text.slice(0, 800)}{lastResult.text.length > 800 && '...'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={applyResult}
                    className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    ✓ {lastResult.action === 'continue' ? 'Append' : lastResult.action === 'summarize' ? 'Done' : 'Apply'}
                  </button>
                  <button
                    onClick={() => setLastResult(null)}
                    className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    ✕ Discard
                  </button>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {aiLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-warm-light bg-warm-light/40 p-3">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {aiStep === 'writing' && 'Generating chapter...'}
                    {aiStep === 'planning' && 'Planning outline...'}
                    {aiStep === 'summarizing' && 'Summarizing...'}
                    {aiStep === 'continue' && 'Continuing your story...'}
                    {aiStep === 'rewrite' && 'Rewriting chapter...'}
                    {aiStep === 'improve' && 'Improving prose...'}
                    {aiStep === 'change_tone' && 'Adjusting tone...'}
                    {!aiStep && 'Working...'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">This may take a few seconds</p>
                </div>
              </div>
            )}

            {/* Generate section */}
            <section>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>✦</span> Generate
              </h3>
              {aiLoading && aiStep === 'writing' ? (
                <button
                  onClick={handleStop}
                  className="w-full rounded-lg bg-destructive px-3 py-2.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                >
                  ■ Stop Generating
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={aiLoading}
                  className="w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  Generate Chapter
                </button>
              )}
            </section>

            {/* Edit actions */}
            <section>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>✏️</span> Edit Chapter
              </h3>
              <div className="space-y-1.5">
                {ACTIONS.map(({ key, label, icon, desc }) => {
                  const isActive = aiLoading && aiStep === key
                  return (
                    <button
                      key={key}
                      onClick={() => handleAction(key)}
                      disabled={aiLoading || !currentChapter.content}
                      className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all disabled:opacity-40 ${
                        isActive
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <span className="mt-0.5 text-sm">
                        {isActive ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : icon}
                      </span>
                      <div>
                        <span className="text-xs font-medium text-foreground">{isActive ? `${label}ing...` : label}</span>
                        <p className="text-[10px] leading-tight text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Memory section */}
            <section>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>🧠</span> Memory
              </h3>
              <button
                onClick={handleSummarize}
                disabled={aiLoading || !currentChapter.content}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-40"
              >
                Summarize Chapter
              </button>
              {currentChapter.summary && (
                <div className="mt-2.5 rounded-lg border border-warm-light bg-warm-light/50 p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                    What AI remembers
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{currentChapter.summary}</p>
                </div>
              )}
            </section>

            {/* Book memory */}
            {selectedBook?.global_summary && (
              <section>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>📖</span> Book Memory
                </h3>
                <div className="rounded-lg border border-warm-light bg-warm-light/30 p-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">{selectedBook.global_summary}</p>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
