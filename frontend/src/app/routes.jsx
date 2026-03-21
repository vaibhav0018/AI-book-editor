import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/components/Layout/AppShell'
import BookDashboard from '@/features/book/BookDashboard'
import ChapterEditor from '@/features/chapter/ChapterEditor'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <BookDashboard /> },
      { path: '/book/:bookId', element: <ChapterEditor /> },
    ],
  },
])

export default router
