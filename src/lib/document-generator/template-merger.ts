import createReport from 'docx-templates'
import { mapLessonPlanToPlaceholders } from './placeholder-map'
import type { LessonPlanInput } from '@/types/lesson'

/**
 * Merge lesson plan data into a DOCX template using docx-templates.
 * Replaces {= fieldName} placeholders with actual values while preserving
 * template formatting (fonts, tables, styles).
 *
 * @param templateBuffer - The template file as a Buffer
 * @param lessonPlan - The full lesson plan input with week-level data
 * @param dayIndex - Zero-based index of the day to extract (0-4 for a 5-day week)
 * @returns Promise<Buffer> - The merged document as a Buffer
 */
export async function mergeTemplate(
  templateBuffer: Buffer,
  lessonPlan: LessonPlanInput,
  dayIndex: number
): Promise<Buffer> {
  const data = mapLessonPlanToPlaceholders(lessonPlan, dayIndex)

  try {
    const result = await createReport({
      template: templateBuffer,
      data,
      cmdDelimiter: ['{', '}'], // Use {= field} syntax
      fixSmartQuotes: true, // Handle Word's curly quotes
      failFast: false, // Collect all errors
      errorHandler: (error, cmdCode) => {
        console.warn(`Template placeholder error: ${cmdCode}`, error)
        return `[${cmdCode}]` // Show placeholder name on error
      },
    })

    return Buffer.from(result)
  } catch (error) {
    console.error('Template merge failed:', error)
    // Return original template on total failure
    return templateBuffer
  }
}
