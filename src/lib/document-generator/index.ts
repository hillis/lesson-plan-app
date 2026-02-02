import { generateLessonPlanDocx } from './lesson-plan-docx'
import { mergeTemplate } from './template-merger'
import { loadTemplate, DEFAULT_TEMPLATE_ID } from '@/lib/templates/loader'
import { createClient } from '@/lib/supabase/server'
import type { LessonPlanInput } from '@/types/lesson'

export interface GeneratedFile {
  name: string
  content: Buffer
  mimeType: string
  type: 'lesson_plan' | 'teacher_handout' | 'student_handout' | 'presentation'
}

export async function generateAllDocuments(
  lessonPlan: LessonPlanInput,
  templateId?: string
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = []
  const weekNum = parseInt(lessonPlan.week)
  const weekStr = String(weekNum).padStart(2, '0')

  // Load template once for all days
  const supabase = await createClient()
  const useTemplateId = templateId || DEFAULT_TEMPLATE_ID

  let templateBuffer: Buffer | null = null
  try {
    templateBuffer = await loadTemplate(supabase, useTemplateId)
  } catch (error) {
    console.warn('Template load failed, using scratch generation:', error)
  }

  // Generate lesson plan for each day
  for (let i = 0; i < lessonPlan.days.length; i++) {
    const day = lessonPlan.days[i]
    const dayNum = i + 1

    let docBuffer: Buffer

    if (templateBuffer) {
      // Use template-based generation
      docBuffer = await mergeTemplate(templateBuffer, lessonPlan, i)
    } else {
      // Fall back to scratch generation
      docBuffer = await generateLessonPlanDocx(day, weekNum, dayNum, lessonPlan.unit)
    }

    files.push({
      name: `Week${weekStr}_Day${dayNum}_${day.topic.replace(/[^a-zA-Z0-9]/g, '_')}.docx`,
      content: docBuffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      type: 'lesson_plan',
    })
  }

  // TODO: Add teacher handout generation
  // TODO: Add student handout generation
  // TODO: Add presentation generation (if includePresentations)

  return files
}
