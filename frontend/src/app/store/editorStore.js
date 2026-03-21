import { create } from 'zustand'
import apiClient from '@/lib/apiClient'

const useEditorStore = create((set, get) => ({
  chapters: [],
  currentChapter: null,
  saveStatus: 'saved', // 'saved' | 'saving' | 'unsaved'
  aiLoading: false,
  aiStep: null,
  contentSyncKey: 0,

  resetForBook: () => set({ chapters: [], currentChapter: null, saveStatus: 'saved', aiLoading: false, aiStep: null }),

  fetchChapters: async (bookId) => {
    const { data } = await apiClient.get(`/api/books/${bookId}/chapters`)
    set({ chapters: data })
  },

  /** Reload the open chapter from the API (e.g. after AI writes summary to DB). */
  refreshCurrentChapter: async () => {
    const id = get().currentChapter?.id
    if (!id) return
    const { data } = await apiClient.get(`/api/chapters/${id}`)
    set((state) => ({
      currentChapter: state.currentChapter?.id === id ? data : state.currentChapter,
    }))
  },

  selectChapter: async (chapterId, bookId) => {
    const { data } = await apiClient.get(`/api/chapters/${chapterId}`)
    set({ currentChapter: data, saveStatus: 'saved' })
    try { sessionStorage.setItem(`lastChapterId:${bookId || data.book_id}`, chapterId) } catch {}
  },

  updateChapterContent: async (chapterId, content) => {
    set({ saveStatus: 'saving' })
    try {
      const { data } = await apiClient.put(`/api/chapters/${chapterId}`, { content, status: 'draft' })
      set((state) => ({
        currentChapter: data,
        saveStatus: 'saved',
        chapters: state.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, status: data.status } : ch
        ),
      }))
    } catch {
      set({ saveStatus: 'unsaved' })
    }
  },

  createChapter: async (bookId, payload) => {
    const { data } = await apiClient.post(`/api/books/${bookId}/chapters`, payload)
    set((state) => ({ chapters: [...state.chapters, data] }))
    return data
  },

  deleteChapter: async (chapterId) => {
    await apiClient.delete(`/api/chapters/${chapterId}`)
    set((state) => ({
      chapters: state.chapters.filter((ch) => ch.id !== chapterId),
      currentChapter: state.currentChapter?.id === chapterId ? null : state.currentChapter,
    }))
  },

  /** Clear chapter content and summary — keep chapter for regeneration. */
  scrapChapter: async (chapterId) => {
    const { data } = await apiClient.put(`/api/chapters/${chapterId}`, {
      content: '',
      summary: null,
      status: 'draft',
    })
    set((state) => ({
      currentChapter: state.currentChapter?.id === chapterId ? data : state.currentChapter,
      chapters: state.chapters.map((ch) => (ch.id === chapterId ? { ...ch, ...data } : ch)),
      saveStatus: 'saved',
      contentSyncKey: state.contentSyncKey + 1,
    }))
  },

  reorderChapter: async (chapterId, newIndex) => {
    const { data } = await apiClient.patch(`/api/chapters/${chapterId}/reorder`, { order_index: newIndex })
    const bookId = data.book_id
    await get().fetchChapters(bookId)
  },

  setAiLoading: (loading, step = null) => set({ aiLoading: loading, aiStep: step }),

  setCurrentChapterContent: (content) =>
    set((state) => ({
      currentChapter: state.currentChapter ? { ...state.currentChapter, content } : null,
      saveStatus: 'unsaved',
      contentSyncKey: state.contentSyncKey + 1,
    })),
}))

export default useEditorStore
