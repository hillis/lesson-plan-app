import { generateLessonPlanDocx } from './lesson-plan-docx'
import { fillCTETemplate } from './cte-template-filler'
import { generateStudentHandout, getStudentHandoutFilename } from './student-handout-generator'
import { generateTeacherHandout, getTeacherHandoutFilename } from './teacher-handout-generator'
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
      // Use direct template filling (like Python CTE skill)
      try {
        docBuffer = await fillCTETemplate(templateBuffer, lessonPlan, i)
      } catch (error) {
        console.warn('Template fill failed, using scratch generation:', error)
        docBuffer = await generateLessonPlanDocx(day, weekNum, dayNum, lessonPlan.unit)
      }
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

  // Generate teacher handout (one for the entire week)
  try {
    const teacherHandoutBuffer = await generateTeacherHandout(lessonPlan, weekNum)
    files.push({
      name: getTeacherHandoutFilename(lessonPlan, weekNum),
      content: teacherHandoutBuffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      type: 'teacher_handout',
    })
  } catch (error) {
    console.warn('Teacher handout generation failed:', error)
  }

  // Generate student handouts (one per handout entry)
  if (lessonPlan.student_handouts && lessonPlan.student_handouts.length > 0) {
    for (const handout of lessonPlan.student_handouts) {
      try {
        const studentHandoutBuffer = await generateStudentHandout(handout, weekNum)
        files.push({
          name: getStudentHandoutFilename(handout),
          content: studentHandoutBuffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          type: 'student_handout',
        })
      } catch (error) {
        console.warn(`Student handout "${handout.name}" generation failed:`, error)
      }
    }
  }

  // TODO: Add presentation generation (if includePresentations)

  return files
}
