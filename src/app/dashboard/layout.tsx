import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ModeToggle } from '@/components/mode-toggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Navigation */}
      <nav className="bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="font-bold text-xl">
                Lesson Planner
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Generate
                </Link>
                <Link
                  href="/dashboard/documents"
                  className="text-muted-foreground hover:text-foreground"
                >
                  My Documents
                </Link>
                <Link
                  href="/dashboard/history"
                  className="text-muted-foreground hover:text-foreground"
                >
                  History
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ModeToggle />
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <form action="/api/auth/signout" method="post">
                <button className="text-sm text-muted-foreground hover:text-foreground">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}
