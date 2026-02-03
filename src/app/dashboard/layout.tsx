import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ModeToggle } from '@/components/mode-toggle'
import { FileText, LayoutDashboard, History, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-50 border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span>LessonGen</span>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                  <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
                    Generate
                  </NavLink>
                  <NavLink href="/dashboard/documents" icon={<FileText className="w-4 h-4" />}>
                    Documents
                  </NavLink>
                  <NavLink href="/dashboard/history" icon={<History className="w-4 h-4" />}>
                    History
                  </NavLink>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{user.email}</span>
                </div>

                <form action="/api/auth/signout" method="post">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 py-8 relative">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-all duration-200"
    >
      {icon}
      {children}
    </Link>
  )
}

