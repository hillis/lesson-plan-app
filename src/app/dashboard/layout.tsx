import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="font-bold text-xl">
                Lesson Planner
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Generate
                </Link>
                <Link
                  href="/dashboard/documents"
                  className="text-gray-600 hover:text-gray-900"
                >
                  My Documents
                </Link>
                <Link
                  href="/dashboard/history"
                  className="text-gray-600 hover:text-gray-900"
                >
                  History
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <form action="/api/auth/signout" method="post">
                <button className="text-sm text-gray-600 hover:text-gray-900">
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
