import { Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center border-b border-border px-4">
        <a href="/" className="text-sm font-semibold tracking-tight text-foreground">
          AI Book Editor
        </a>
      </header>

      {/* Page content — dashboard or 3-panel editor */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
