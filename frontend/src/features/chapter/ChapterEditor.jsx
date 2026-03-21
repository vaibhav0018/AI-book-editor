import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useBookStore from '@/app/store/bookStore'
import useEditorStore from '@/app/store/editorStore'
import ChapterSidebar from './ChapterSidebar'
import RichTextEditor from '@/components/Editor/RichTextEditor'
import AISidePanel from '@/features/ai/AISidePanel'
import { generateOutline, rewriteText } from '@/features/ai/aiApi'
import { useToast } from '@/components/ui/Toast'

export default function ChapterEditor() {
  const { bookId } = useParams()
  const { fetchBook, selectedBook } = useBookStore()
  const { fetchChapters, selectChapter, resetForBook, setAiLoading, currentChapter, setCurrentChapterContent, updateChapterContent } = useEditorStore()
  const toast = useToast()

  useEffect(() => {
    if (!bookId) return
    resetForBook()
    fetchBook(bookId)
    fetchChapters(bookId).then(() => {
      const { chapters } = useEditorStore.getState()
      const saved = sessionStorage.getItem(`lastChapterId:${bookId}`)
      const match = saved && chapters.find((ch) => ch.id === saved)
      if (match) selectChapter(match.id, bookId)
      else if (chapters.length > 0) selectChapter(chapters[0].id, bookId)
    })
  }, [bookId])

  const handleGenerateOutline = async () => {
    if (!bookId) return
    setAiLoading(true, 'planning')
    toast.info('Cooking your outline — watch the sidebar')
    try {
      await generateOutline(bookId)
      await fetchChapters(bookId)
      toast.success('Outline is ready')
    } catch (err) {
      toast.error('Outline generation failed: ' + err.message)
    } finally {
      setAiLoading(false, null)
    }
  }

  const handleBubbleAction = async (action, selectedText, customInstruction = null) => {
    if (!currentChapter || !selectedText) return
    setAiLoading(true, action)
    try {
      const { data } = await rewriteText(currentChapter.id, selectedText, action, null, customInstruction)
      const currentContent = currentChapter.content || ''
      const updated = currentContent.replace(selectedText, data.result)
      setCurrentChapterContent(updated)
      updateChapterContent(currentChapter.id, updated)
      toast.success(action === 'custom_edit' ? 'Custom edit applied' : `${action.replace('_', ' ')} applied`)
    } catch (err) {
      toast.error('Action failed: ' + err.message)
    } finally {
      setAiLoading(false, null)
    }
  }

  return (
    <div className="flex h-full">
      <ChapterSidebar bookId={bookId} onGenerateOutline={handleGenerateOutline} />
      <RichTextEditor onBubbleAction={handleBubbleAction} />
      <AISidePanel />
    </div>
  )
}
