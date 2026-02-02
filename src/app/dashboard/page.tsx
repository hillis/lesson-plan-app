import { createClient } from '@/lib/supabase/server'
import { LessonGenerator } from '@/components/LessonGenerator'

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
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Generate Lesson Plans</h1>
        <p className="text-muted-foreground mb-8">
          Create personalized CTE-format lesson plans based on your curriculum
        </p>

        {!hasSyllabus && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-warning-foreground">
              <strong>Tip:</strong> Upload your syllabus in{' '}
              <a href="/dashboard/documents" className="underline">
                My Documents
              </a>{' '}
              for better lesson plans tailored to your course.
            </p>
          </div>
        )}

        <LessonGenerator
          hasSyllabus={hasSyllabus || false}
          hasStandards={hasStandards || false}
        />
      </div>
    </div>
  )
}
