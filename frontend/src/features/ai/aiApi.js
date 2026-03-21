import apiClient from '@/lib/apiClient'

export const generateOutline = (bookId) =>
  apiClient.post('/api/ai/outline', { book_id: bookId })

export const rewriteText = (chapterId, selectedText, action, tone = null, customInstruction = null) =>
  apiClient.post('/api/ai/rewrite', {
    chapter_id: chapterId,
    selected_text: selectedText,
    action,
    tone,
    custom_instruction: customInstruction,
  })

export const summarizeChapter = (chapterId) =>
  apiClient.post('/api/ai/summarize', { chapter_id: chapterId })

export const getChapterHistory = (chapterId) =>
  apiClient.get(`/api/chapters/${chapterId}/history`)

export function streamGenerateChapter(bookId, chapterId, onToken, onDone, onError) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const ctrl = new AbortController()

  fetch(`${baseUrl}/api/ai/generate-chapter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, chapter_id: chapterId }),
    signal: ctrl.signal,
  })
    .then(async (response) => {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = JSON.parse(line.slice(6))
          if (json.token) onToken(json.token)
          if (json.done) onDone(json.model_used)
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(err)
    })

  return () => ctrl.abort()
}
