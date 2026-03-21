import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import useEditorStore from '@/app/store/editorStore'

const BUBBLE_ACTIONS = [
  { key: 'rewrite', label: 'Rewrite', icon: '✏️' },
  { key: 'improve', label: 'Improve', icon: '✨' },
  { key: 'make_shorter', label: 'Shorter', icon: '📐' },
  { key: 'make_longer', label: 'Longer', icon: '📏' },
]

export default function RichTextEditor({ onBubbleAction }) {
  const { currentChapter, saveStatus, updateChapterContent, setCurrentChapterContent, aiLoading, contentSyncKey } = useEditorStore()
  const debounceRef = useRef(null)
  const isLocalEdit = useRef(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const customInputRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Begin writing your story...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[calc(100vh-8rem)] px-12 py-8 max-w-3xl mx-auto',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      isLocalEdit.current = true
      setCurrentChapterContent(html)
      requestAnimationFrame(() => { isLocalEdit.current = false })

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (currentChapter?.id) {
          updateChapterContent(currentChapter.id, html)
        }
      }, 1500)
    },
  })

  useEffect(() => {
    if (editor && currentChapter) {
      const incoming = currentChapter.content || ''
      if (editor.getHTML() !== incoming) {
        editor.commands.setContent(incoming, false)
      }
    }
  }, [editor, currentChapter?.id])

  useEffect(() => {
    if (!editor || !currentChapter || isLocalEdit.current) return
    const incoming = currentChapter.content || ''
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming, false)
    }
  }, [editor, currentChapter?.content, contentSyncKey])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus()
    }
  }, [showCustomInput])

  const getSelectedText = useCallback(() => {
    if (!editor) return ''
    const { from, to } = editor.state.selection
    return editor.state.doc.textBetween(from, to, ' ')
  }, [editor])

  const handleCustomSubmit = () => {
    if (!customPrompt.trim()) return
    onBubbleAction?.('custom_edit', getSelectedText(), customPrompt.trim())
    setCustomPrompt('')
    setShowCustomInput(false)
  }

  if (!currentChapter) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-background">
        <span className="text-5xl opacity-30">📝</span>
        <p className="text-sm text-muted-foreground">Select a chapter to start writing</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-card">
      <div className="flex items-center justify-between border-b border-border/40 px-6 py-2">
        <span className="text-sm font-medium text-foreground">{currentChapter.title}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {saveStatus === 'saving' && (
            <><span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-warm" /> Saving...</>
          )}
          {saveStatus === 'saved' && (
            <><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Saved</>
          )}
          {saveStatus === 'unsaved' && (
            <><span className="inline-block h-1.5 w-1.5 rounded-full bg-warm" /> Unsaved</>
          )}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 150, maxWidth: 420 }}>
            <div className="animate-slide-up rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-center gap-0.5 p-1">
                {BUBBLE_ACTIONS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => { setShowCustomInput(false); onBubbleAction?.(key, getSelectedText()) }}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-primary/10 hover:text-primary"
                  >
                    <span className="text-[10px]">{icon}</span> {label}
                  </button>
                ))}
                <div className="mx-0.5 h-4 w-px bg-border" />
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    showCustomInput
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <span className="text-[10px]">💬</span> Edit
                </button>
              </div>

              {showCustomInput && (
                <div className="border-t border-border/60 p-1.5">
                  <div className="flex gap-1">
                    <input
                      ref={customInputRef}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomSubmit()
                        if (e.key === 'Escape') { setShowCustomInput(false); setCustomPrompt('') }
                      }}
                      placeholder="e.g. Make it more dramatic..."
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleCustomSubmit}
                      disabled={!customPrompt.trim()}
                      className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                    >
                      Go
                    </button>
                  </div>
                </div>
              )}
            </div>
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
