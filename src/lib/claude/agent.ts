import { executeParseSyllabus } from './tools/parse-syllabus'
import { executeGenerateLesson } from './tools/generate-lesson'
import type { Document } from '@/types/database'
import type { LessonPlanInput } from '@/types/lesson'

export interface GenerationRequest {
  weekNumber: number
  daysCount: number
  classDuration: number
  includeHandouts: boolean
  includePresentations: boolean
  customInstructions?: string
}

export interface GenerationContext {
  syllabus?: Document
  standards?: Document
  otherDocs?: Document[]
}

export async function generateLessonPlanWithAgent(
  request: GenerationRequest,
  context: GenerationContext
): Promise<LessonPlanInput> {
  // Step 1: Parse syllabus to get week info
  let weekInfo = {
    unit: 'Unit ' + request.weekNumber,
    topics: ['Topic 1', 'Topic 2'],
  }

  if (context.syllabus?.parsed_content?.raw_text) {
    const parsed = await executeParseSyllabus(context.syllabus.parsed_content.raw_text)
    const week = parsed.weeks.find((w) => w.week_number === request.weekNumber)
    if (week) {
      weekInfo = {
        unit: week.unit,
        topics: week.topics,
      }
    }
  }

  // Step 2: Get standards text
  let standardsText = ''
  if (context.standards?.parsed_content?.raw_text) {
    standardsText = context.standards.parsed_content.raw_text
  }

  // Step 3: Generate the lesson plan
  const lessonPlan = await executeGenerateLesson({
    week_number: request.weekNumber,
    unit_name: weekInfo.unit,
    topics: weekInfo.topics,
    days_count: request.daysCount,
    class_duration: request.classDuration,
    standards_text: standardsText,
    additional_context: request.customInstructions,
  })

  // Step 4: Add presentation flag if needed
  if (!request.includePresentations) {
    lessonPlan.skip_presentations = true
  }

  return lessonPlan
}
