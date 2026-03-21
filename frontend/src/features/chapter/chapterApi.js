import apiClient from '@/lib/apiClient'

export const createChapter = (bookId, payload) =>
  apiClient.post(`/api/books/${bookId}/chapters`, payload)

export const listChapters = (bookId) =>
  apiClient.get(`/api/books/${bookId}/chapters`)

export const getChapter = (id) => apiClient.get(`/api/chapters/${id}`)

export const updateChapter = (id, payload) =>
  apiClient.put(`/api/chapters/${id}`, payload)

export const deleteChapter = (id) => apiClient.delete(`/api/chapters/${id}`)

export const reorderChapter = (id, orderIndex) =>
  apiClient.patch(`/api/chapters/${id}/reorder`, { order_index: orderIndex })
