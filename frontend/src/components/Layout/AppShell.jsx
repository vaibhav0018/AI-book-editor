import { Outlet, useLocation, Link } from 'react-router-dom'

export default function AppShell() {
  const { pathname } = useLocation()
  const isEditor = pathname.startsWith('/book/')

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-border/60 bg-sidebar px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="text-xl">📖</span>
          <span className="font-semibold tracking-tight text-foreground">
            Book<span className="text-primary">Forge</span>
          </span>
        </Link>
        {isEditor && (
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ← All Books
          </Link>
        )}
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
