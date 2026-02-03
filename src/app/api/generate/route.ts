import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateLessonPlanWithAgent } from '@/lib/claude/agent'
import type { Document } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    weekNumber,
    selectedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    classDuration = 90,
    includeHandouts = true,
    includePresentations = false,
    customInstructions,
  } = body

  if (!weekNumber) {
    return NextResponse.json({ error: 'Week number required' }, { status: 400 })
  }

  if (!selectedDays || selectedDays.length === 0) {
    return NextResponse.json({ error: 'At least one day must be selected' }, { status: 400 })
  }

  // Create generation record
  const { data: generation, error: createError } = await supabase
    .from('generations')
    .insert({
      teacher_id: user.id,
      week_number: weekNumber,
      config: {
        days: selectedDays,
        include_presentations: includePresentations,
        include_handouts: includeHandouts,
        custom_instructions: customInstructions,
      },
      status: 'generating',
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  try {
    // Fetch teacher's documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('teacher_id', user.id)

    const context = {
      syllabus: documents?.find((d: Document) => d.type === 'syllabus'),
      standards: documents?.find((d: Document) => d.type === 'standards'),
      otherDocs: documents?.filter((d: Document) => d.type === 'other'),
    }

    // Generate lesson plan using Claude Agent
    const lessonPlan = await generateLessonPlanWithAgent(
      {
        weekNumber,
        selectedDays,
        classDuration,
        includeHandouts,
        includePresentations,
        customInstructions,
      },
      context
    )

    // Update generation with result
    await supabase
      .from('generations')
      .update({
        unit_name: lessonPlan.unit,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id)

    return NextResponse.json({
      generation_id: generation.id,
      lesson_plan: lessonPlan,
    })
  } catch (error) {
    // Update generation with error
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', generation.id)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
