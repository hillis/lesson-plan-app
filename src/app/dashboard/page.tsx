import { createClient } from '@/lib/supabase/server'
import { LessonGenerator } from '@/components/LessonGenerator'
import { Sparkles, FileText, Upload } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has uploaded documents
  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, type')
    .eq('teacher_id', user!.id)

  const hasSyllabus = documents?.some((d) => d.type === 'syllabus')
  const hasStandards = documents?.some((d) => d.type === 'standards')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="text-primary">{user!.email?.split('@')[0]}</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Ready to create some amazing lesson plans today?
        </p>
      </div>

      {!hasSyllabus && (
        <div className="glass-card rounded-xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none -mr-10 -mt-10" />
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Upload your Syllabus</h3>
              <p className="text-muted-foreground mb-4 max-w-xl">
                To get the best results tailored to your specific curriculum, we recommend uploading your course syllabus first.
              </p>
              <Link href="/dashboard/documents" className="text-sm font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors">
                Go to Documents <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl md:p-8 p-6 shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 border-t border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-inner">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generate New Lesson Plan</h2>
            <p className="text-sm text-muted-foreground">AI-powered creation based on your standards</p>
          </div>
        </div>

        <LessonGenerator
          hasSyllabus={hasSyllabus || false}
          hasStandards={hasStandards || false}
        />
      </div>
    </div>
  )
}

