import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import useEditorStore from '@/app/store/editorStore'

export default function RichTextEditor({ onBubbleAction }) {
  const { currentChapter, saveStatus, updateChapterContent, setCurrentChapterContent } = useEditorStore()
  const debounceRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing or generate a chapter...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none outline-none min-h-[calc(100vh-8rem)] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setCurrentChapterContent(html)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (currentChapter?.id) {
          updateChapterContent(currentChapter.id, html)
        }
      }, 1500)
    },
  })

  // Sync editor content when switching chapters
  useEffect(() => {
    if (editor && currentChapter) {
      const current = editor.getHTML()
      const incoming = currentChapter.content || ''
      if (current !== incoming) {
        editor.commands.setContent(incoming, false)
      }
    }
  }, [editor, currentChapter?.id])

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const getSelectedText = useCallback(() => {
    if (!editor) return ''
    const { from, to } = editor.state.selection
    return editor.state.doc.textBetween(from, to, ' ')
  }, [editor])

  if (!currentChapter) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a chapter to start editing
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Save indicator */}
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{currentChapter.title}</span>
        <span className="text-xs text-muted-foreground">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'unsaved' && 'Unsaved changes'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-lg">
              {['rewrite', 'improve', 'make_shorter', 'make_longer'].map((action) => (
                <button
                  key={action}
                  onClick={() => onBubbleAction?.(action, getSelectedText())}
                  className="rounded px-2 py-1 text-xs hover:bg-muted"
                >
                  {action.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
