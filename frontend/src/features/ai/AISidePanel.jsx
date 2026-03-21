import { useState } from 'react'
import useEditorStore from '@/app/store/editorStore'
import useBookStore from '@/app/store/bookStore'
import { streamGenerateChapter, rewriteText, summarizeChapter } from './aiApi'
import StepIndicator from '@/components/ui/StepIndicator'
import { useToast } from '@/components/ui/Toast'

const ACTIONS = [
  { key: 'continue', label: 'Continue', icon: '→' },
  { key: 'rewrite', label: 'Rewrite', icon: '✏️' },
  { key: 'improve', label: 'Improve', icon: '✨' },
  { key: 'change_tone', label: 'Tone', icon: '🎭' },
]

export default function AISidePanel() {
  const { currentChapter, setAiLoading, aiLoading, aiStep, setCurrentChapterContent, fetchChapters } = useEditorStore()
  const { selectedBook, fetchBook } = useBookStore()
  const [lastResult, setLastResult] = useState(null)
  const [abortFn, setAbortFn] = useState(null)
  const toast = useToast()

  const bookId = selectedBook?.id

  const handleGenerate = () => {
    if (!bookId || !currentChapter) return
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
    setAiLoading(true, action)
    try {
      const { data } = await rewriteText(currentChapter.id, currentChapter.content || '', action)
      setLastResult({ action, text: data.result, model: data.model_used })
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
    if (lastResult) {
      setCurrentChapterContent(lastResult.text)
      setLastResult(null)
      toast.success('Applied to editor')
    }
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
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => handleAction(key)}
                    disabled={aiLoading || !currentChapter.content}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 py-2 text-xs font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-40"
                  >
                    <span className="text-[11px]">{icon}</span> {label}
                  </button>
                ))}
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

            {/* Step indicator */}
            {aiLoading && <StepIndicator currentStep={aiStep} />}

            {/* AI result preview */}
            {lastResult && (
              <div className="animate-slide-up rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  AI {lastResult.action} · {lastResult.model}
                </p>
                <p className="mb-3 max-h-44 overflow-y-auto text-xs leading-relaxed text-foreground/80">
                  {lastResult.text.slice(0, 600)}{lastResult.text.length > 600 && '...'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={applyResult}
                    className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => setLastResult(null)}
                    className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
