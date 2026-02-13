import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateLessonPlanWithAgent } from '@/lib/claude/agent'
import type { Document } from '@/types/database'

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const VALID_MODELS = ['sonnet', 'opus']
const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 2000

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    weekNumber,
    selectedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    selectedModel = 'sonnet',
    enableThinking = false,
    classDuration = 90,
    includeHandouts = true,
    includePresentations = false,
    customInstructions,
  } = body

  // Validate weekNumber is a positive integer in a reasonable range
  if (!weekNumber || typeof weekNumber !== 'number' || !Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 52) {
    return NextResponse.json({ error: 'Week number must be an integer between 1 and 52' }, { status: 400 })
  }

  // Validate selectedDays contains only valid day abbreviations
  if (!Array.isArray(selectedDays) || selectedDays.length === 0) {
    return NextResponse.json({ error: 'At least one day must be selected' }, { status: 400 })
  }
  if (selectedDays.some((day: unknown) => typeof day !== 'string' || !VALID_DAYS.includes(day as string))) {
    return NextResponse.json({ error: 'Invalid day selection' }, { status: 400 })
  }

  // Validate selectedModel
  if (typeof selectedModel !== 'string' || !VALID_MODELS.includes(selectedModel)) {
    return NextResponse.json({ error: 'Invalid model selection' }, { status: 400 })
  }

  // Validate classDuration is a reasonable number
  if (typeof classDuration !== 'number' || classDuration < 15 || classDuration > 480) {
    return NextResponse.json({ error: 'Class duration must be between 15 and 480 minutes' }, { status: 400 })
  }

  // Validate customInstructions length if provided
  if (customInstructions && (typeof customInstructions !== 'string' || customInstructions.length > MAX_CUSTOM_INSTRUCTIONS_LENGTH)) {
    return NextResponse.json({ error: `Custom instructions must be under ${MAX_CUSTOM_INSTRUCTIONS_LENGTH} characters` }, { status: 400 })
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
    console.error('Failed to create generation record:', createError)
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 })
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
    // Values are safe to cast after validation above
    const lessonPlan = await generateLessonPlanWithAgent(
      {
        weekNumber: weekNumber as number,
        selectedDays: selectedDays as string[],
        selectedModel: selectedModel as 'sonnet' | 'opus',
        enableThinking: Boolean(enableThinking),
        classDuration: classDuration as number,
        includeHandouts: Boolean(includeHandouts),
        includePresentations: Boolean(includePresentations),
        customInstructions: customInstructions as string | undefined,
      },
      context
    )

    // Update generation with result (scoped to current user)
    await supabase
      .from('generations')
      .update({
        unit_name: lessonPlan.unit,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id)
      .eq('teacher_id', user.id)

    return NextResponse.json({
      generation_id: generation.id,
      lesson_plan: lessonPlan,
    })
  } catch (error) {
    // Update generation with error (scoped to current user)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Lesson generation failed:', errorMessage)
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', generation.id)
      .eq('teacher_id', user.id)

    return NextResponse.json(
      { error: 'Lesson generation failed. Please try again.' },
      { status: 500 }
    )
  }
}
