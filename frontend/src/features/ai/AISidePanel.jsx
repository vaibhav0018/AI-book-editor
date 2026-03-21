import { useState } from 'react'
import useEditorStore from '@/app/store/editorStore'
import useBookStore from '@/app/store/bookStore'
import { streamGenerateChapter, rewriteText, summarizeChapter } from './aiApi'
import StepIndicator from '@/components/ui/StepIndicator'
import { useToast } from '@/components/ui/Toast'

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
      const { data } = await rewriteText(
        currentChapter.id,
        currentChapter.content || '',
        action,
      )
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
    }
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border">
      <div className="border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!currentChapter ? (
          <p className="text-xs text-muted-foreground">Select a chapter first</p>
        ) : (
          <div className="space-y-4">
            {/* Generate */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Generate</h3>
              {aiLoading && aiStep === 'writing' ? (
                <button
                  onClick={handleStop}
                  className="w-full rounded bg-destructive px-3 py-2 text-xs text-destructive-foreground hover:bg-destructive/90"
                >
                  Stop Generating
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={aiLoading}
                  className="w-full rounded bg-primary px-3 py-2 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Generate Chapter
                </button>
              )}
            </div>

            {/* Actions */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Edit Entire Chapter</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {['continue', 'rewrite', 'improve', 'change_tone'].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleAction(action)}
                    disabled={aiLoading || !currentChapter.content}
                    className="rounded border border-border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-40"
                  >
                    {action.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Summarize */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Memory</h3>
              <button
                onClick={handleSummarize}
                disabled={aiLoading || !currentChapter.content}
                className="w-full rounded border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40"
              >
                Summarize Chapter
              </button>
              {currentChapter.summary && (
                <div className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
                  <p className="mb-1 font-semibold">What AI remembers:</p>
                  {currentChapter.summary}
                </div>
              )}
            </div>

            {/* Book memory */}
            {selectedBook?.global_summary && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Book Memory</h3>
                <div className="rounded bg-muted p-2 text-xs text-muted-foreground">
                  {selectedBook.global_summary}
                </div>
              </div>
            )}

            {/* Step indicator */}
            {aiLoading && <StepIndicator currentStep={aiStep} />}

            {/* Result preview */}
            {lastResult && (
              <div className="rounded border border-primary/30 bg-primary/5 p-3">
                <p className="mb-2 text-xs font-semibold">
                  AI {lastResult.action} result ({lastResult.model}):
                </p>
                <p className="mb-3 max-h-40 overflow-y-auto text-xs">{lastResult.text.slice(0, 500)}...</p>
                <div className="flex gap-2">
                  <button
                    onClick={applyResult}
                    className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setLastResult(null)}
                    className="rounded border border-border px-3 py-1 text-xs"
                  >
                    Reject
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
