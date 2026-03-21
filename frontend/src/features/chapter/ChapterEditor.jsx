import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useBookStore from '@/app/store/bookStore'
import useEditorStore from '@/app/store/editorStore'
import ChapterSidebar from './ChapterSidebar'
import RichTextEditor from '@/components/Editor/RichTextEditor'
import AISidePanel from '@/features/ai/AISidePanel'
import { generateOutline } from '@/features/ai/aiApi'
import { rewriteText } from '@/features/ai/aiApi'

export default function ChapterEditor() {
  const { bookId } = useParams()
  const { fetchBook, selectedBook } = useBookStore()
  const { fetchChapters, setAiLoading, currentChapter, setCurrentChapterContent } = useEditorStore()

  useEffect(() => {
    if (bookId) {
      fetchBook(bookId)
      fetchChapters(bookId)
    }
  }, [bookId, fetchBook, fetchChapters])

  const handleGenerateOutline = async () => {
    if (!bookId) return
    setAiLoading(true, 'planning')
    try {
      await generateOutline(bookId)
      await fetchChapters(bookId)
    } catch (err) {
      alert('Outline generation failed: ' + err.message)
    } finally {
      setAiLoading(false, null)
    }
  }

  const handleBubbleAction = async (action, selectedText) => {
    if (!currentChapter || !selectedText) return
    setAiLoading(true, action)
    try {
      const { data } = await rewriteText(currentChapter.id, selectedText, action)
      const currentContent = currentChapter.content || ''
      const updated = currentContent.replace(selectedText, data.result)
      setCurrentChapterContent(updated)
    } catch (err) {
      alert('Action failed: ' + err.message)
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
