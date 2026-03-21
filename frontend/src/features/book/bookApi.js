import apiClient from '@/lib/apiClient'

export const createBook = (payload) => apiClient.post('/api/books/', payload)
export const listBooks = () => apiClient.get('/api/books/')
export const getBook = (id) => apiClient.get(`/api/books/${id}`)
export const updateBook = (id, payload) => apiClient.put(`/api/books/${id}`, payload)
export const deleteBook = (id) => apiClient.delete(`/api/books/${id}`)
