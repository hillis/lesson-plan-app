import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('generations')
    .select('*')
    .eq('teacher_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Generation History</h1>
        <p className="text-gray-500 mb-8">
          View and access your previously generated lesson plans
        </p>

        {!generations || generations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No lesson plans generated yet.</p>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:underline"
              >
                Generate your first lesson plan
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {generations.map((gen) => (
              <Card key={gen.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Week {gen.week_number}: {gen.unit_name || 'Untitled'}
                    </CardTitle>
                    <StatusBadge status={gen.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(gen.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex gap-3">
                      {gen.drive_folder_url && (
                        <a
                          href={gen.drive_folder_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open in Drive
                        </a>
                      )}
                    </div>
                  </div>
                  {gen.error_message && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {gen.error_message}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    generating: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  )
}
