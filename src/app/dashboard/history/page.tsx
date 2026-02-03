import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, ExternalLink, FileText, Clock, AlertCircle } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('generations')
    .select('*')
    .eq('teacher_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Generation History</h1>
        <p className="text-muted-foreground text-lg">
          View and access your previously generated lesson plans
        </p>
      </div>

      {!generations || generations.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center border-dashed border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No lesson plans yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Once you generate lesson plans, they will appear here for easy access.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
          >
            Generate your first lesson plan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {generations.map((gen) => (
            <div
              key={gen.id}
              className="glass-card rounded-xl p-5 hover:bg-white/5 transition-all duration-200 group border border-white/5 hover:border-white/10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-white/5">
                    <FileText className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {gen.unit_name || 'Untitled Lesson Plan'}
                      <StatusBadge status={gen.status} />
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                        Week {gen.week_number}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(gen.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(gen.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:self-center pl-16 md:pl-0">
                  {gen.status === 'failed' && (
                    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-1.5 rounded-md max-w-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{gen.error_message || 'Generation failed'}</span>
                    </div>
                  )}

                  {gen.drive_folder_url && (
                    <a
                      href={gen.drive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/5 hover:border-white/10 group-hover:translate-x-1 duration-200"
                    >
                      Open in Drive
                      <ExternalLink className="w-4 h-4 opacity-50" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    generating: 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  const labels: Record<string, string> = {
    pending: 'Queueing',
    generating: 'Generating',
    completed: 'Completed',
    failed: 'Failed'
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  )
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}
