import { create } from 'zustand'
import apiClient from '@/lib/apiClient'

const useBookStore = create((set, get) => ({
  books: [],
  selectedBook: null,
  loading: false,
  error: null,

  fetchBooks: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await apiClient.get('/api/books/')
      set({ books: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchBook: async (bookId) => {
    set({ loading: true, error: null })
    try {
      const { data } = await apiClient.get(`/api/books/${bookId}`)
      set({ selectedBook: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  createBook: async (payload) => {
    const { data } = await apiClient.post('/api/books/', payload)
    set((state) => ({ books: [data, ...state.books] }))
    return data
  },

  updateBook: async (bookId, payload) => {
    const { data } = await apiClient.put(`/api/books/${bookId}`, payload)
    set((state) => ({
      books: state.books.map((b) => (b.id === bookId ? data : b)),
      selectedBook: state.selectedBook?.id === bookId ? data : state.selectedBook,
    }))
    return data
  },

  deleteBook: async (bookId) => {
    await apiClient.delete(`/api/books/${bookId}`)
    set((state) => ({
      books: state.books.filter((b) => b.id !== bookId),
      selectedBook: state.selectedBook?.id === bookId ? null : state.selectedBook,
    }))
  },
}))

export default useBookStore
